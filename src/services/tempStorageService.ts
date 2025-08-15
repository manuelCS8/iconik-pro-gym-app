import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TempMealLog {
  id: string;
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
  timestamp: string;
}

export interface TempNutritionConfig {
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
}

class TempStorageService {
  private readonly MEAL_LOGS_KEY = 'temp_meal_logs';
  private readonly NUTRITION_CONFIG_KEY = 'temp_nutrition_config';
  private readonly DAILY_USAGE_KEY = 'temp_daily_usage';

  // ===== MÉTODOS PARA MEAL LOGS =====

  async insertMealLog(meal: Omit<TempMealLog, 'id'>): Promise<void> {
    try {
      console.log('🔧 [TEMP] Starting meal log insertion...');
      console.log('📊 [TEMP] Meal data:', JSON.stringify(meal, null, 2));
      
      const mealLog: TempMealLog = {
        ...meal,
        id: Date.now().toString()
      };

      // Obtener logs existentes
      const existingLogs = await this.getMealLogs();
      existingLogs.unshift(mealLog);

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(this.MEAL_LOGS_KEY, JSON.stringify(existingLogs));
      
      console.log('✅ [TEMP] Meal log saved successfully');
    } catch (error) {
      console.error('❌ [TEMP] Error inserting meal log:', error);
      throw error;
    }
  }

  async getMealLogs(): Promise<TempMealLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.MEAL_LOGS_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('❌ [TEMP] Error getting meal logs:', error);
      return [];
    }
  }

  async getMealLogsByDate(userId: string, date: string): Promise<TempMealLog[]> {
    try {
      const allLogs = await this.getMealLogs();
      return allLogs.filter(log => log.userId === userId && log.date === date);
    } catch (error) {
      console.error('❌ [TEMP] Error getting meal logs by date:', error);
      return [];
    }
  }

  // ===== MÉTODOS PARA CONFIGURACIÓN NUTRICIONAL =====

  async saveNutritionConfig(config: TempNutritionConfig): Promise<void> {
    try {
      console.log('🔧 [TEMP] Saving nutrition config...');
      await AsyncStorage.setItem(this.NUTRITION_CONFIG_KEY, JSON.stringify(config));
      console.log('✅ [TEMP] Nutrition config saved successfully');
    } catch (error) {
      console.error('❌ [TEMP] Error saving nutrition config:', error);
      throw error;
    }
  }

  async getNutritionConfig(userId: string): Promise<TempNutritionConfig | null> {
    try {
      const configJson = await AsyncStorage.getItem(this.NUTRITION_CONFIG_KEY);
      if (!configJson) return null;
      
      const config = JSON.parse(configJson);
      return config.userId === userId ? config : null;
    } catch (error) {
      console.error('❌ [TEMP] Error getting nutrition config:', error);
      return null;
    }
  }

  // ===== MÉTODOS PARA USO DIARIO =====

  async getDailyUsage(userId: string, date: string): Promise<number> {
    try {
      const usageJson = await AsyncStorage.getItem(this.DAILY_USAGE_KEY);
      if (!usageJson) return 0;
      
      const usage = JSON.parse(usageJson);
      const key = `${userId}_${date}`;
      return usage[key] || 0;
    } catch (error) {
      console.error('❌ [TEMP] Error getting daily usage:', error);
      return 0;
    }
  }

  async incrementDailyUsage(userId: string, date: string): Promise<void> {
    try {
      const usageJson = await AsyncStorage.getItem(this.DAILY_USAGE_KEY);
      const usage = usageJson ? JSON.parse(usageJson) : {};
      const key = `${userId}_${date}`;
      
      usage[key] = (usage[key] || 0) + 1;
      
      await AsyncStorage.setItem(this.DAILY_USAGE_KEY, JSON.stringify(usage));
      console.log('✅ [TEMP] Daily usage incremented');
    } catch (error) {
      console.error('❌ [TEMP] Error incrementing daily usage:', error);
    }
  }

  // ===== MÉTODOS DE LIMPIEZA =====

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.MEAL_LOGS_KEY,
        this.NUTRITION_CONFIG_KEY,
        this.DAILY_USAGE_KEY
      ]);
      console.log('✅ [TEMP] All data cleared');
    } catch (error) {
      console.error('❌ [TEMP] Error clearing data:', error);
    }
  }
}

export default new TempStorageService(); 