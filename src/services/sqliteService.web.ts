import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalTrainingRecord {
  id?: number;
  userId: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  series: number;
  reps: number;
  weight: number;
  timestamp: string;
  synced: number; // 0 = not synced, 1 = synced
}

export interface NutritionConfig {
  userId: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  objective: string;
  intensity: string;
  targetWeight?: number;
  targetDate?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tier: string;
  synced: number;
}

export interface MealLog {
  id?: number;
  userId: string;
  date: string;
  mealType: string;
  imageUrl?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  aiAnalysis?: string;
  imageHash?: string;
  timestamp: string;
  synced: number;
}

export interface DailyUsage {
  userId: string;
  date: string;
  usageCount: number;
}

class SQLiteService {
  private readonly RECORDS_KEY = 'records_local';
  private readonly NUTRITION_CONFIG_KEY = 'nutrition_config';
  private readonly MEAL_LOGS_KEY = 'meal_logs';
  private readonly DAILY_USAGE_KEY = 'daily_usage';

  async initDatabase(): Promise<void> {
    try {
      console.log('🔄 Initializing AsyncStorage database...');
      // No necesitamos crear tablas, AsyncStorage maneja todo automáticamente
      console.log('✅ AsyncStorage database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  // Métodos para LocalTrainingRecord
  async saveLocalTrainingRecord(record: LocalTrainingRecord): Promise<void> {
    try {
      const records = await this.getLocalTrainingRecords();
      const newRecord = { ...record, id: Date.now() };
      records.push(newRecord);
      await AsyncStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving training record:', error);
      throw error;
    }
  }

  async getLocalTrainingRecords(): Promise<LocalTrainingRecord[]> {
    try {
      const data = await AsyncStorage.getItem(this.RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting training records:', error);
      return [];
    }
  }

  async getLocalTrainingRecordsByUserId(userId: string): Promise<LocalTrainingRecord[]> {
    try {
      const records = await this.getLocalTrainingRecords();
      return records.filter(record => record.userId === userId);
    } catch (error) {
      console.error('Error getting training records by user:', error);
      return [];
    }
  }

  async updateLocalTrainingRecord(record: LocalTrainingRecord): Promise<void> {
    try {
      const records = await this.getLocalTrainingRecords();
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = record;
        await AsyncStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
      }
    } catch (error) {
      console.error('Error updating training record:', error);
      throw error;
    }
  }

  async deleteLocalTrainingRecord(id: number): Promise<void> {
    try {
      const records = await this.getLocalTrainingRecords();
      const filteredRecords = records.filter(record => record.id !== id);
      await AsyncStorage.setItem(this.RECORDS_KEY, JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('Error deleting training record:', error);
      throw error;
    }
  }

  // Métodos para NutritionConfig
  async saveNutritionConfig(config: NutritionConfig): Promise<void> {
    try {
      const configs = await this.getNutritionConfigs();
      const existingIndex = configs.findIndex(c => c.userId === config.userId);
      if (existingIndex !== -1) {
        configs[existingIndex] = config;
      } else {
        configs.push(config);
      }
      await AsyncStorage.setItem(this.NUTRITION_CONFIG_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving nutrition config:', error);
      throw error;
    }
  }

  async getNutritionConfigs(): Promise<NutritionConfig[]> {
    try {
      const data = await AsyncStorage.getItem(this.NUTRITION_CONFIG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting nutrition configs:', error);
      return [];
    }
  }

  async getNutritionConfigByUserId(userId: string): Promise<NutritionConfig | null> {
    try {
      const configs = await this.getNutritionConfigs();
      return configs.find(config => config.userId === userId) || null;
    } catch (error) {
      console.error('Error getting nutrition config by user:', error);
      return null;
    }
  }

  async deleteNutritionConfig(userId: string): Promise<void> {
    try {
      const configs = await this.getNutritionConfigs();
      const filteredConfigs = configs.filter(config => config.userId !== userId);
      await AsyncStorage.setItem(this.NUTRITION_CONFIG_KEY, JSON.stringify(filteredConfigs));
    } catch (error) {
      console.error('Error deleting nutrition config:', error);
      throw error;
    }
  }

  // Métodos para MealLog
  async saveMealLog(mealLog: MealLog): Promise<void> {
    try {
      const mealLogs = await this.getMealLogs();
      const newMealLog = { ...mealLog, id: Date.now() };
      mealLogs.push(newMealLog);
      await AsyncStorage.setItem(this.MEAL_LOGS_KEY, JSON.stringify(mealLogs));
    } catch (error) {
      console.error('Error saving meal log:', error);
      throw error;
    }
  }

  async getMealLogs(): Promise<MealLog[]> {
    try {
      const data = await AsyncStorage.getItem(this.MEAL_LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting meal logs:', error);
      return [];
    }
  }

  async getMealLogsByUserId(userId: string): Promise<MealLog[]> {
    try {
      const mealLogs = await this.getMealLogs();
      return mealLogs.filter(log => log.userId === userId);
    } catch (error) {
      console.error('Error getting meal logs by user:', error);
      return [];
    }
  }

  async getMealLogsByDate(userId: string, date: string): Promise<MealLog[]> {
    try {
      const mealLogs = await this.getMealLogsByUserId(userId);
      return mealLogs.filter(log => log.date === date);
    } catch (error) {
      console.error('Error getting meal logs by date:', error);
      return [];
    }
  }

  async updateMealLog(mealLog: MealLog): Promise<void> {
    try {
      const mealLogs = await this.getMealLogs();
      const index = mealLogs.findIndex(log => log.id === mealLog.id);
      if (index !== -1) {
        mealLogs[index] = mealLog;
        await AsyncStorage.setItem(this.MEAL_LOGS_KEY, JSON.stringify(mealLogs));
      }
    } catch (error) {
      console.error('Error updating meal log:', error);
      throw error;
    }
  }

  async deleteMealLog(id: number): Promise<void> {
    try {
      const mealLogs = await this.getMealLogs();
      const filteredMealLogs = mealLogs.filter(log => log.id !== id);
      await AsyncStorage.setItem(this.MEAL_LOGS_KEY, JSON.stringify(filteredMealLogs));
    } catch (error) {
      console.error('Error deleting meal log:', error);
      throw error;
    }
  }

  // Métodos para DailyUsage
  async saveDailyUsage(usage: DailyUsage): Promise<void> {
    try {
      const usages = await this.getDailyUsages();
      const existingIndex = usages.findIndex(u => u.userId === usage.userId && u.date === usage.date);
      if (existingIndex !== -1) {
        usages[existingIndex] = usage;
      } else {
        usages.push(usage);
      }
      await AsyncStorage.setItem(this.DAILY_USAGE_KEY, JSON.stringify(usages));
    } catch (error) {
      console.error('Error saving daily usage:', error);
      throw error;
    }
  }

  async getDailyUsages(): Promise<DailyUsage[]> {
    try {
      const data = await AsyncStorage.getItem(this.DAILY_USAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting daily usages:', error);
      return [];
    }
  }

  async getDailyUsageByUserId(userId: string, date: string): Promise<DailyUsage | null> {
    try {
      const usages = await this.getDailyUsages();
      return usages.find(usage => usage.userId === userId && usage.date === date) || null;
    } catch (error) {
      console.error('Error getting daily usage by user and date:', error);
      return null;
    }
  }

  async incrementDailyUsage(userId: string, date: string): Promise<void> {
    try {
      const existingUsage = await this.getDailyUsageByUserId(userId, date);
      const newUsage: DailyUsage = {
        userId,
        date,
        usageCount: (existingUsage?.usageCount || 0) + 1
      };
      await this.saveDailyUsage(newUsage);
    } catch (error) {
      console.error('Error incrementing daily usage:', error);
      throw error;
    }
  }

  // Métodos de limpieza
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.RECORDS_KEY,
        this.NUTRITION_CONFIG_KEY,
        this.MEAL_LOGS_KEY,
        this.DAILY_USAGE_KEY
      ]);
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    // AsyncStorage no necesita cerrar conexión
    console.log('✅ AsyncStorage database closed');
  }
}

export default new SQLiteService();
