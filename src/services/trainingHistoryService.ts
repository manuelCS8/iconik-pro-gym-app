import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export interface ExerciseSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  isFailureSet: boolean;
}

export interface TrainingExercise {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  muscleGroup?: string;
  equipment?: string;
}

export interface TrainingSession {
  id: string;
  userId: string;
  routineName: string;
  userName: string;
  date: string;
  duration: number; // en minutos
  volume: number; // volumen total
  exercises: TrainingExercise[];
  description?: string;
  createdAt: string;
}

class TrainingHistoryService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitializing: boolean = false;
  private readonly BACKUP_KEY = 'training_history_backup';
  private readonly DB_NAME = 'training_history.db';

  /**
   * Obtener o crear la conexión a la base de datos
   */
  private async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.isInitializing) {
      // Esperar a que termine la inicialización
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.db) {
        return this.db;
      }
    }

    await this.initialize();
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  /**
   * Inicializar la base de datos
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      console.log('⏳ Inicialización ya en progreso...');
      return;
    }

    this.isInitializing = true;
    
    try {
      console.log('🔧 Iniciando inicialización de base de datos...');
      
      // Cerrar conexión existente si existe
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          console.log('⚠️ Error cerrando conexión existente:', error);
        }
        this.db = null;
      }

      // Crear nueva conexión
      console.log('📂 Abriendo base de datos:', this.DB_NAME);
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      
      if (!this.db) {
        throw new Error('Failed to open database');
      }

      console.log('✅ Base de datos abierta correctamente');
      
      await this.createTables();
      console.log('✅ Tablas creadas correctamente');
      
      await this.restoreFromBackup();
      console.log('✅ Restauración desde backup completada');
      
      console.log('🎉 Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando database:', error);
      this.db = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Crear las tablas necesarias
   */
  private async createTables(): Promise<void> {
    const db = await this.getDatabase();

    const createTrainingSessionsTable = `
      CREATE TABLE IF NOT EXISTS training_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        routineName TEXT NOT NULL,
        userName TEXT NOT NULL,
        date TEXT NOT NULL,
        duration INTEGER NOT NULL,
        volume REAL NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      );
    `;

    const createExercisesTable = `
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        trainingSessionId TEXT NOT NULL,
        exerciseId TEXT NOT NULL,
        exerciseName TEXT NOT NULL,
        muscleGroup TEXT,
        equipment TEXT,
        FOREIGN KEY (trainingSessionId) REFERENCES training_sessions (id) ON DELETE CASCADE
      );
    `;

    const createExerciseSetsTable = `
      CREATE TABLE IF NOT EXISTS exercise_sets (
        id TEXT PRIMARY KEY,
        exerciseId TEXT NOT NULL,
        weight TEXT NOT NULL,
        reps TEXT NOT NULL,
        completed INTEGER NOT NULL,
        isFailureSet INTEGER NOT NULL,
        FOREIGN KEY (exerciseId) REFERENCES exercises (id) ON DELETE CASCADE
      );
    `;

    try {
      console.log('📋 Creando tabla training_sessions...');
      await db.execAsync(createTrainingSessionsTable);
      console.log('📋 Creando tabla exercises...');
      await db.execAsync(createExercisesTable);
      console.log('📋 Creando tabla exercise_sets...');
      await db.execAsync(createExerciseSetsTable);
      console.log('✅ Todas las tablas creadas correctamente');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Guardar un entrenamiento completo
   */
  async saveTrainingSession(session: TrainingSession): Promise<void> {
    const db = await this.getDatabase();

    try {
      console.log('💾 Iniciando guardado de entrenamiento...');
      console.log('📊 Total de series a guardar:', session.exercises.reduce((total, ex) => total + ex.sets.length, 0));
      
      await db.runAsync('BEGIN TRANSACTION');

      // Insertar sesión de entrenamiento
      console.log('📝 Guardando sesión de entrenamiento...');
      await db.runAsync(
        `INSERT INTO training_sessions (id, userId, routineName, userName, date, duration, volume, description, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [session.id, session.userId, session.routineName, session.userName, session.date, session.duration, session.volume, session.description || null, session.createdAt]
      );

      // Insertar ejercicios
      for (const exercise of session.exercises) {
        const exerciseId = `${session.id}_${exercise.exerciseId}`;
        console.log(`💪 Guardando ejercicio: ${exercise.exerciseName}`);
        await db.runAsync(
          `INSERT INTO exercises (id, trainingSessionId, exerciseId, exerciseName, muscleGroup, equipment)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [exerciseId, session.id, exercise.exerciseId, exercise.exerciseName, exercise.muscleGroup || null, exercise.equipment || null]
        );

        // Insertar series
        for (const set of exercise.sets) {
          await db.runAsync(
            `INSERT INTO exercise_sets (id, exerciseId, weight, reps, completed, isFailureSet)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [set.id, exerciseId, set.weight, set.reps, set.completed ? 1 : 0, set.isFailureSet ? 1 : 0]
          );
        }
      }

      await db.runAsync('COMMIT');
      console.log('✅ Entrenamiento guardado exitosamente');
      await this.createBackup();
    } catch (error) {
      console.error('❌ Error en saveTrainingSession:', error);
      try {
        await db.runAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Obtener todos los entrenamientos de un usuario
   */
  async getTrainingSessions(userId: string): Promise<TrainingSession[]> {
    const db = await this.getDatabase();

    try {
      console.log('📖 Obteniendo entrenamientos para usuario:', userId);
      const sessions = await db.getAllAsync(
        `SELECT * FROM training_sessions WHERE userId = ? ORDER BY date DESC`,
        [userId]
      );

      console.log(`📊 Encontrados ${sessions.length} entrenamientos`);

      const result: TrainingSession[] = [];

      for (const session of sessions) {
        const exercises = await this.getExercisesForSession(session.id);
        result.push({
          ...session,
          exercises,
          duration: session.duration,
          volume: session.volume,
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting training sessions:', error);
      throw error;
    }
  }

  /**
   * Obtener ejercicios de una sesión específica
   */
  private async getExercisesForSession(sessionId: string): Promise<TrainingExercise[]> {
    const db = await this.getDatabase();

    try {
      const exercises = await db.getAllAsync(
        `SELECT * FROM exercises WHERE trainingSessionId = ?`,
        [sessionId]
      );

      const result: TrainingExercise[] = [];

      for (const exercise of exercises) {
        const sets = await db.getAllAsync(
          `SELECT * FROM exercise_sets WHERE exerciseId = ?`,
          [exercise.id]
        );

        result.push({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          sets: sets.map(set => ({
            id: set.id,
            weight: set.weight,
            reps: set.reps,
            completed: Boolean(set.completed),
            isFailureSet: Boolean(set.isFailureSet),
          })),
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting exercises for session:', error);
      return [];
    }
  }

  /**
   * Obtener un entrenamiento específico
   */
  async getTrainingSession(sessionId: string): Promise<TrainingSession | null> {
    const db = await this.getDatabase();

    try {
      const sessions = await db.getAllAsync(
        `SELECT * FROM training_sessions WHERE id = ?`,
        [sessionId]
      );

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];
      const exercises = await this.getExercisesForSession(session.id);

      return {
        ...session,
        exercises,
        duration: session.duration,
        volume: session.volume,
      };
    } catch (error) {
      console.error('❌ Error getting training session:', error);
      return null;
    }
  }

  /**
   * Eliminar un entrenamiento
   */
  async deleteTrainingSession(sessionId: string): Promise<void> {
    const db = await this.getDatabase();

    try {
      await db.runAsync('BEGIN TRANSACTION');
      
      // Eliminar series primero
      await db.runAsync(
        `DELETE FROM exercise_sets WHERE exerciseId IN (
          SELECT id FROM exercises WHERE trainingSessionId = ?
        )`,
        [sessionId]
      );

      // Eliminar ejercicios
      await db.runAsync(
        `DELETE FROM exercises WHERE trainingSessionId = ?`,
        [sessionId]
      );

      // Eliminar sesión
      await db.runAsync(
        `DELETE FROM training_sessions WHERE id = ?`,
        [sessionId]
      );

      await db.runAsync('COMMIT');
      await this.createBackup();
    } catch (error) {
      console.error('❌ Error deleting training session:', error);
      try {
        await db.runAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalVolume: number;
    averageDuration: number;
    streak: number;
  }> {
    const db = await this.getDatabase();

    try {
      const sessions = await db.getAllAsync(
        `SELECT * FROM training_sessions WHERE userId = ? ORDER BY date ASC`,
        [userId]
      );

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          totalVolume: 0,
          averageDuration: 0,
          streak: 0,
        };
      }

      const totalSessions = sessions.length;
      const totalVolume = sessions.reduce((sum, session) => sum + session.volume, 0);
      const averageDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / totalSessions;
      const dates = sessions.map(session => session.date);
      const streak = this.calculateStreak(dates);

      return {
        totalSessions,
        totalVolume,
        averageDuration,
        streak,
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return {
        totalSessions: 0,
        totalVolume: 0,
        averageDuration: 0,
        streak: 0,
      };
    }
  }

  /**
   * Calcular racha de entrenamientos
   */
  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      date.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Crear backup en AsyncStorage
   */
  private async createBackup(): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      const sessions = await db.getAllAsync('SELECT * FROM training_sessions');
      const exercises = await db.getAllAsync('SELECT * FROM exercises');
      const sets = await db.getAllAsync('SELECT * FROM exercise_sets');

      const backup = {
        sessions,
        exercises,
        sets,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      console.log('💾 Backup creado correctamente');
    } catch (error) {
      console.error('❌ Error creating backup:', error);
    }
  }

  /**
   * Restaurar desde backup
   */
  private async restoreFromBackup(): Promise<void> {
    try {
      const backupString = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupString) {
        console.log('📋 No hay backup para restaurar');
        return;
      }

      const backup = JSON.parse(backupString);
      const db = await this.getDatabase();

      console.log('🔄 Restaurando desde backup...');

      // Verificar si la base de datos está vacía
      const sessionCount = await db.getAllAsync('SELECT COUNT(*) as count FROM training_sessions');
      if (sessionCount[0]?.count > 0) {
        console.log('📋 Base de datos ya tiene datos, saltando restauración');
        return;
      }

      await db.runAsync('BEGIN TRANSACTION');

      // Restaurar sesiones
      for (const session of backup.sessions) {
        await db.runAsync(
          `INSERT OR IGNORE INTO training_sessions (id, userId, routineName, userName, date, duration, volume, description, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [session.id, session.userId, session.routineName, session.userName, session.date, session.duration, session.volume, session.description, session.createdAt]
        );
      }

      // Restaurar ejercicios
      for (const exercise of backup.exercises) {
        await db.runAsync(
          `INSERT OR IGNORE INTO exercises (id, trainingSessionId, exerciseId, exerciseName, muscleGroup, equipment)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [exercise.id, exercise.trainingSessionId, exercise.exerciseId, exercise.exerciseName, exercise.muscleGroup, exercise.equipment]
        );
      }

      // Restaurar series
      for (const set of backup.sets) {
        await db.runAsync(
          `INSERT OR IGNORE INTO exercise_sets (id, exerciseId, weight, reps, completed, isFailureSet)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [set.id, set.exerciseId, set.weight, set.reps, set.completed, set.isFailureSet]
        );
      }

      await db.runAsync('COMMIT');
      console.log('✅ Restauración completada');
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      try {
        const db = await this.getDatabase();
        await db.runAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
    }
  }

  /**
   * Exportar datos como JSON
   */
  async exportData(userId: string): Promise<string> {
    try {
      const sessions = await this.getTrainingSessions(userId);
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        sessions,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `training_history_${userId}_${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      return fileUri;
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Importar datos desde JSON
   */
  async importData(fileUri: string): Promise<void> {
    try {
      const jsonString = await FileSystem.readAsStringAsync(fileUri);
      const importData = JSON.parse(jsonString);

      for (const session of importData.sessions) {
        await this.saveTrainingSession(session);
      }
    } catch (error) {
      console.error('❌ Error importing data:', error);
      throw error;
    }
  }

  /**
   * Limpiar todos los datos
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDatabase();

    try {
      await db.runAsync('BEGIN TRANSACTION');
      await db.runAsync('DELETE FROM exercise_sets');
      await db.runAsync('DELETE FROM exercises');
      await db.runAsync('DELETE FROM training_sessions');
      await db.runAsync('COMMIT');
      
      await AsyncStorage.removeItem(this.BACKUP_KEY);
      console.log('🗑️ Todos los datos eliminados');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      try {
        await db.runAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Reinicializar la base de datos en caso de errores
   */
  async reinitialize(): Promise<void> {
    console.log('🔄 Reinicializando base de datos...');
    this.db = null;
    this.isInitializing = false;
    await this.initialize();
  }

  /**
   * Resetear completamente la base de datos (último recurso)
   */
  async resetDatabase(): Promise<void> {
    console.log('🔄 Reseteando completamente la base de datos...');
    
    try {
      // Cerrar conexión existente
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          console.log('⚠️ Error cerrando conexión:', error);
        }
      }
      
      // Limpiar estado
      this.db = null;
      this.isInitializing = false;
      
      // Eliminar backup
      await AsyncStorage.removeItem(this.BACKUP_KEY);
      
      // Eliminar archivo de base de datos
      try {
        const dbPath = `${FileSystem.documentDirectory}SQLite/${this.DB_NAME}`;
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
        console.log('🗑️ Archivo de base de datos eliminado');
      } catch (error) {
        console.log('⚠️ Error eliminando archivo de base de datos:', error);
      }
      
      // Reinicializar
      await this.initialize();
      console.log('✅ Base de datos reseteada completamente');
    } catch (error) {
      console.error('❌ Error reseteando base de datos:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de la base de datos
   */
  async checkDatabaseStatus(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      if (!db) return false;
      
      // Intentar una consulta simple para verificar la conexión
      await db.getAllAsync('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Database status check failed:', error);
      return false;
    }
  }
}

export default new TrainingHistoryService(); 