import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import UsageLimitService from '../services/usageLimitService';

interface UsageStats {
  current: {
    date: string;
    count: number;
    limit: number;
  };
  percentage: number;
  isOverLimit: boolean;
  nextReset: string;
}

export const useUsageLimit = () => {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    current: { date: '', count: 0, limit: 0 },
    percentage: 0,
    isOverLimit: false,
    nextReset: ''
  });
  const [loading, setLoading] = useState(true);

  const loadUsageStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await UsageLimitService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCanAnalyze = useCallback(async (): Promise<boolean> => {
    try {
      const { can, usage, remaining } = await UsageLimitService.canPerformAnalysis();
      
      if (!can) {
        const errorMessage = `Has alcanzado tu límite diario de ${usage.limit} análisis. 
        
Próximo análisis disponible mañana a las 00:00.

Usado hoy: ${usage.count}/${usage.limit}`;
        
        Alert.alert(
          'Límite Diario Alcanzado',
          errorMessage,
          [{ text: 'Entendido', style: 'default' }]
        );
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking analysis permission:', error);
      return false;
    }
  }, []);

  const incrementUsage = useCallback(async () => {
    try {
      await UsageLimitService.incrementUsage();
      await loadUsageStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }, [loadUsageStats]);

  const resetToday = useCallback(async () => {
    try {
      await UsageLimitService.resetToday();
      await loadUsageStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error resetting today usage:', error);
    }
  }, [loadUsageStats]);

  const setDailyLimit = useCallback(async (limit: number) => {
    try {
      await UsageLimitService.setDailyLimit(limit);
      await loadUsageStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error setting daily limit:', error);
    }
  }, [loadUsageStats]);

  useEffect(() => {
    loadUsageStats();
  }, [loadUsageStats]);

  return {
    usageStats,
    loading,
    checkCanAnalyze,
    incrementUsage,
    resetToday,
    setDailyLimit,
    loadUsageStats
  };
};
