import AsyncStorage from '@react-native-async-storage/async-storage';

interface UsageData {
  date: string;
  count: number;
  limit: number;
}

class UsageLimitService {
  private readonly STORAGE_KEY = 'ai_analysis_usage';
  private readonly DEFAULT_LIMIT = 7; // Límite por defecto: 7 análisis por día

  /**
   * Obtiene el límite diario configurado
   */
  async getDailyLimit(): Promise<number> {
    try {
      const limit = await AsyncStorage.getItem('ai_analysis_daily_limit');
      return limit ? parseInt(limit, 10) : this.DEFAULT_LIMIT;
    } catch (error) {
      console.error('Error getting daily limit:', error);
      return this.DEFAULT_LIMIT;
    }
  }

  /**
   * Configura el límite diario
   */
  async setDailyLimit(limit: number): Promise<void> {
    try {
      await AsyncStorage.setItem('ai_analysis_daily_limit', limit.toString());
      console.log(`✅ Daily limit set to: ${limit}`);
    } catch (error) {
      console.error('Error setting daily limit:', error);
    }
  }

  /**
   * Obtiene el uso actual del día
   */
  async getCurrentUsage(): Promise<UsageData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (usageData) {
        const parsed: UsageData = JSON.parse(usageData);
        
        // Si es un día diferente, resetear contador
        if (parsed.date !== today) {
          const limit = await this.getDailyLimit();
          const newUsage: UsageData = {
            date: today,
            count: 0,
            limit
          };
          await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUsage));
          return newUsage;
        }
        
        return parsed;
      }
      
      // Primera vez, crear registro
      const limit = await this.getDailyLimit();
      const newUsage: UsageData = {
        date: today,
        count: 0,
        limit
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUsage));
      return newUsage;
    } catch (error) {
      console.error('Error getting current usage:', error);
      const limit = await this.getDailyLimit();
      return {
        date: new Date().toISOString().split('T')[0],
        count: 0,
        limit
      };
    }
  }

  /**
   * Incrementa el contador de uso
   */
  async incrementUsage(): Promise<UsageData> {
    try {
      const currentUsage = await this.getCurrentUsage();
      const newUsage: UsageData = {
        ...currentUsage,
        count: currentUsage.count + 1
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUsage));
      console.log(`📊 Usage incremented: ${newUsage.count}/${newUsage.limit}`);
      
      return newUsage;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  /**
   * Verifica si se puede realizar un análisis
   */
  async canPerformAnalysis(): Promise<{ can: boolean; usage: UsageData; remaining: number }> {
    try {
      const usage = await this.getCurrentUsage();
      const can = usage.count < usage.limit;
      const remaining = Math.max(0, usage.limit - usage.count);
      
      console.log(`🔍 Can perform analysis: ${can} (${usage.count}/${usage.limit}, ${remaining} remaining)`);
      
      return { can, usage, remaining };
    } catch (error) {
      console.error('Error checking analysis permission:', error);
      return { can: false, usage: { date: '', count: 0, limit: 0 }, remaining: 0 };
    }
  }

  /**
   * Fuerza un análisis (para casos especiales)
   */
  async forceAnalysis(): Promise<UsageData> {
    console.log('⚠️ Force analysis requested');
    return await this.incrementUsage();
  }

  /**
   * Resetea el contador del día actual
   */
  async resetToday(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const limit = await this.getDailyLimit();
      const resetUsage: UsageData = {
        date: today,
        count: 0,
        limit
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(resetUsage));
      console.log('🔄 Today usage reset');
    } catch (error) {
      console.error('Error resetting today usage:', error);
    }
  }

  /**
   * Obtiene estadísticas de uso
   */
  async getUsageStats(): Promise<{
    current: UsageData;
    percentage: number;
    isOverLimit: boolean;
    nextReset: string;
  }> {
    try {
      const usage = await this.getCurrentUsage();
      const percentage = Math.min(100, (usage.count / usage.limit) * 100);
      const isOverLimit = usage.count >= usage.limit;
      
      // Calcular próximo reset (mañana a las 00:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        current: usage,
        percentage,
        isOverLimit,
        nextReset: tomorrow.toISOString()
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        current: { date: '', count: 0, limit: 0 },
        percentage: 0,
        isOverLimit: false,
        nextReset: ''
      };
    }
  }
}

export default new UsageLimitService();
