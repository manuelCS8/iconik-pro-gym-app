import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface TrainingSession {
  id: string;
  date: string;
  routineId: string;
  routineName: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: ExerciseSet[];
  }[];
  duration: number;
  completed: boolean;
}

export interface UserStats {
  totalWorkouts: number;
  totalVolume: number;
  averageWorkoutDuration: number;
  lastWorkoutDate?: string;
}

class TrainingHistoryService {
  private readonly STORAGE_KEY = 'training_history';
  private readonly STATS_KEY = 'user_stats';

  /**
   * Guarda una sesión de entrenamiento
   */
  async saveTrainingSession(session: TrainingSession): Promise<void> {
    try {
      const sessions = await this.getTrainingSessions();
      sessions.push(session);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      
      // Actualizar estadísticas
      await this.updateStats(session);
      
      console.log('✅ Sesión de entrenamiento guardada');
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones de entrenamiento
   */
  async getTrainingSessions(): Promise<TrainingSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error obteniendo sesiones:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas del usuario
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(this.STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      
      // Estadísticas por defecto
      return {
        totalWorkouts: 0,
        totalVolume: 0,
        averageWorkoutDuration: 0
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalWorkouts: 0,
        totalVolume: 0,
        averageWorkoutDuration: 0
      };
    }
  }

  /**
   * Actualiza las estadísticas del usuario
   */
  private async updateStats(session: TrainingSession): Promise<void> {
    try {
      const stats = await this.getUserStats();
      
      // Calcular volumen total de la sesión
      const sessionVolume = session.exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);

      // Actualizar estadísticas
      stats.totalWorkouts += 1;
      stats.totalVolume += sessionVolume;
      stats.lastWorkoutDate = session.date;
      
      // Calcular duración promedio
      const sessions = await this.getTrainingSessions();
      const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
      stats.averageWorkoutDuration = totalDuration / sessions.length;

      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  /**
   * Elimina una sesión de entrenamiento
   */
  async deleteTrainingSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getTrainingSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
      console.log('✅ Sesión eliminada');
    } catch (error) {
      console.error('❌ Error eliminando sesión:', error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos de entrenamiento
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.STATS_KEY);
      console.log('✅ Todos los datos eliminados');
    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
      throw error;
    }
  }
}

export default new TrainingHistoryService();
