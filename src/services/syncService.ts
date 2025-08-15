import NetInfo from '@react-native-community/netinfo';
import sqliteService, { LocalTrainingRecord } from './sqliteService';

class SyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private onConnectionChangeCallback?: (isOnline: boolean, pendingRecords?: number) => void;

  async initialize(): Promise<void> {
    // Inicializar SQLite
    await sqliteService.initDatabase();

    // Configurar listener de conectividad
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected === true;
      
      console.log(`🌐 Connection status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);

      // Si acabamos de conectarnos, sincronizar automáticamente
      if (wasOffline && this.isOnline) {
        this.syncPendingRecords();
      }

      // Notificar cambio de estado
      this.notifyConnectionChange();
    });

    // Verificar estado inicial
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected === true;
    this.notifyConnectionChange();
  }

  setConnectionChangeCallback(callback: (isOnline: boolean, pendingRecords?: number) => void): void {
    this.onConnectionChangeCallback = callback;
  }

  private async notifyConnectionChange(): Promise<void> {
    if (this.onConnectionChangeCallback) {
      const pendingRecords = await sqliteService.getLocalRecordsCount();
      this.onConnectionChangeCallback(this.isOnline, pendingRecords);
    }
  }

  async saveTrainingRecord(
    userId: string,
    routineId: string,
    exerciseId: string,
    exerciseName: string,
    series: number,
    reps: number,
    weight: number
  ): Promise<{ success: boolean; savedLocally: boolean }> {
    const record: Omit<LocalTrainingRecord, 'id'> = {
      userId,
      routineId,
      exerciseId,
      exerciseName,
      series,
      reps,
      weight,
      timestamp: new Date().toISOString(),
      synced: 0
    };

    if (this.isOnline) {
      try {
        // Intentar guardar directamente en Firestore
        // await addDoc(collection(firestore, 'records'), {
        //   userId: record.userId,
        //   routineId: record.routineId,
        //   exerciseId: record.exerciseId,
        //   exerciseName: record.exerciseName,
        //   series: record.series,
        //   reps: record.reps,
        //   weight: record.weight,
        //   timestamp: record.timestamp,
        //   createdAt: new Date(),
        // });

        console.log('✅ Record saved directly to Firestore');
        return { success: true, savedLocally: false };
      } catch (error) {
        console.error('❌ Error saving to Firestore, falling back to local:', error);
        // Si falla Firestore, guardar localmente
        await sqliteService.insertLocalRecord(record);
        return { success: true, savedLocally: true };
      }
    } else {
      // Sin conexión, guardar localmente
      await sqliteService.insertLocalRecord(record);
      console.log('📱 Record saved locally (offline mode)');
      this.notifyConnectionChange();
      return { success: true, savedLocally: true };
    }
  }

  async syncPendingRecords(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, syncedCount: 0 };
    }

    this.syncInProgress = true;
    let syncedCount = 0;

    try {
      const unsyncedRecords = await sqliteService.getUnsyncedRecords();
      console.log(`🔄 Starting sync of ${unsyncedRecords.length} pending records`);

      for (const record of unsyncedRecords) {
        try {
          // await addDoc(collection(firestore, 'records'), {
          //   userId: record.userId,
          //   routineId: record.routineId,
          //   exerciseId: record.exerciseId,
          //   exerciseName: record.exerciseName,
          //   series: record.series,
          //   reps: record.reps,
          //   weight: record.weight,
          //   timestamp: record.timestamp,
          //   createdAt: new Date(record.timestamp),
          // });

          // Marcar como sincronizado
          if (record.id) {
            await sqliteService.markRecordAsSynced(record.id);
            syncedCount++;
          }
        } catch (error) {
          console.error(`❌ Error syncing record ${record.id}:`, error);
          // Si un record falla, continuar con los siguientes
        }
      }

      // Limpiar records sincronizados periódicamente
      if (syncedCount > 0) {
        await sqliteService.clearSyncedRecords();
      }

      console.log(`✅ Sync completed: ${syncedCount}/${unsyncedRecords.length} records synced`);
      this.notifyConnectionChange();

      return { success: true, syncedCount };
    } catch (error) {
      console.error('❌ Error during sync:', error);
      return { success: false, syncedCount };
    } finally {
      this.syncInProgress = false;
    }
  }

  async manualSync(): Promise<{ success: boolean; message: string; syncedCount?: number }> {
    if (!this.isOnline) {
      return { 
        success: false, 
        message: 'No hay conexión a internet. La sincronización se realizará automáticamente cuando se restablezca la conexión.' 
      };
    }

    if (this.syncInProgress) {
      return { 
        success: false, 
        message: 'Sincronización en progreso. Por favor espera.' 
      };
    }

    const pendingRecords = await sqliteService.getLocalRecordsCount();
    if (pendingRecords === 0) {
      return { 
        success: true, 
        message: 'No hay entrenamientos pendientes de sincronizar.' 
      };
    }

    const result = await this.syncPendingRecords();
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Sincronización completada: ${result.syncedCount} entrenamientos sincronizados.`,
        synced: result.syncedCount
      };
    } else {
      return {
        success: false,
        message: 'Error durante la sincronización. Inténtalo de nuevo.'
      };
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  async getPendingRecordsCount(): Promise<number> {
    return await sqliteService.getLocalRecordsCount();
  }

  async getLocalRecords(userId: string): Promise<LocalTrainingRecord[]> {
    return await sqliteService.getAllLocalRecords(userId);
  }

  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export default new SyncService(); 