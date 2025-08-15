import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import syncService from '../services/syncService';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showDetails = true }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Configurar listener de NetInfo
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;
      
      setIsOnline(isNowOnline);
      
      // Si acabamos de conectarnos, disparar sincronización automática
      if (wasOffline && isNowOnline) {
        console.log('📡 Conexión restaurada, iniciando sincronización automática');
        handleAutoSync();
      }
    });

    // Configurar callback para cambios de sincronización
    syncService.setConnectionChangeCallback((online, pending) => {
      setPendingRecords(pending || 0);
    });

    // Obtener estado inicial
    const initializeStatus = async () => {
      const netState = await NetInfo.fetch();
      setIsOnline(netState.isConnected ?? false);
      setPendingRecords(await syncService.getPendingRecordsCount());
    };

    initializeStatus();

    // Verificar estado de sync periódicamente
    const syncCheckInterval = setInterval(() => {
      setIsSyncing(syncService.isSyncing());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(syncCheckInterval);
    };
  }, [isOnline]);

  const handleAutoSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    const result = await syncService.manualSync();
    setIsSyncing(false);
    
    if (result.success && result.synced > 0) {
      console.log(`✅ Sincronización automática completada: ${result.synced} registros`);
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    const result = await syncService.manualSync();
    setIsSyncing(false);

    Alert.alert(
      result.success ? "Sincronización" : "Error",
      result.message,
      [{ text: "OK" }]
    );
  };

  const getStatusColor = () => {
    if (isSyncing) return COLORS.info;
    if (!isOnline) return COLORS.error;
    if (pendingRecords > 0) return COLORS.warning;
    return COLORS.success;
  };

  const getStatusIcon = () => {
    if (isSyncing) return "sync";
    if (!isOnline) return "cloud-offline";
    if (pendingRecords > 0) return "cloud-upload";
    return "cloud-done";
  };

  const getStatusText = () => {
    if (isSyncing) return "Sincronizando...";
    if (!isOnline) return "Sin conexión";
    if (pendingRecords > 0) return `${pendingRecords} pendiente${pendingRecords !== 1 ? 's' : ''}`;
    return "Sincronizado";
  };

  if (!showDetails && isOnline && pendingRecords === 0) {
    return null; // No mostrar si está todo bien y no queremos detalles
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: getStatusColor() }]}
      onPress={handleManualSync}
      disabled={isSyncing || !isOnline}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={16} 
          color={COLORS.white} 
          style={isSyncing ? styles.rotating : undefined}
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        
        {pendingRecords > 0 && !isSyncing && (
          <Ionicons name="refresh" size={14} color={COLORS.white} />
        )}
      </View>
      
      {showDetails && !isOnline && (
        <Text style={styles.detailText}>
          Los entrenamientos se guardan localmente
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius / 2,
    marginHorizontal: SIZES.padding,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  detailText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall - 1,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
  rotating: {
    // La animación de rotación se puede agregar con Animated API si se necesita
  },
});

export default ConnectionStatus; 