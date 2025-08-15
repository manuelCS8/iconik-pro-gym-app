import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import UsageLimitService from '../../services/usageLimitService';

interface UsageLimitIndicatorProps {
  showDetails?: boolean;
  onLimitReached?: () => void;
}

const UsageLimitIndicator: React.FC<UsageLimitIndicatorProps> = ({ 
  showDetails = true, 
  onLimitReached 
}) => {
  const [usageStats, setUsageStats] = useState({
    current: { date: '', count: 0, limit: 0 },
    percentage: 0,
    isOverLimit: false,
    nextReset: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const stats = await UsageLimitService.getUsageStats();
      setUsageStats(stats);
      
      // Notificar si se alcanzó el límite
      if (stats.isOverLimit && onLimitReached) {
        onLimitReached();
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeUntilReset = (nextReset: string): string => {
    try {
      const now = new Date();
      const reset = new Date(nextReset);
      const diff = reset.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return '24h';
    }
  };

  const getProgressColor = (percentage: number, isOverLimit: boolean): string => {
    if (isOverLimit) return '#FF4444'; // Rojo cuando excede
    if (percentage >= 80) return '#FF8800'; // Naranja cuando está cerca
    if (percentage >= 50) return '#FFAA00'; // Amarillo
    return '#4CAF50'; // Verde
  };

  const getStatusText = (): string => {
    if (usageStats.isOverLimit) {
      return `${usageStats.current.count} Usados (Límite excedido)`;
    }
    
    const remaining = usageStats.current.limit - usageStats.current.count;
    if (remaining === 0) {
      return `${usageStats.current.count} Usados (Sin restantes)`;
    }
    
    return `${remaining} Restantes hoy`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Análisis Restantes</Text>
        <View style={[styles.badge, { backgroundColor: usageStats.isOverLimit ? '#FF4444' : '#4CAF50' }]}>
          <Text style={styles.badgeText}>BÁSICO</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, usageStats.percentage)}%`,
                backgroundColor: getProgressColor(usageStats.percentage, usageStats.isOverLimit)
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: usageStats.isOverLimit ? '#FF4444' : '#666' }]}>
          {getStatusText()}
        </Text>
      </View>

      {showDetails && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{usageStats.current.count}</Text>
            <Text style={styles.statLabel}>Usados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{usageStats.current.limit}</Text>
            <Text style={styles.statLabel}>Límite</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: usageStats.isOverLimit ? '#FF4444' : '#4CAF50' }]}>
              {Math.round(usageStats.percentage)}%
            </Text>
            <Text style={styles.statLabel}>Progreso</Text>
          </View>
        </View>
      )}

      {/* Información de reset */}
      {usageStats.isOverLimit && (
        <View style={styles.resetInfo}>
          <Text style={styles.resetText}>
            Próximo análisis disponible en: {formatTimeUntilReset(usageStats.nextReset)}
          </Text>
        </View>
      )}

      {/* Botón de reset (solo para desarrollo) */}
      {__DEV__ && (
        <View style={styles.devContainer}>
          <Text 
            style={styles.devButton}
            onPress={() => {
              Alert.alert(
                'Reset Usage (DEV)',
                '¿Resetear el contador de uso de hoy?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Resetear', 
                    style: 'destructive',
                    onPress: async () => {
                      await UsageLimitService.resetToday();
                      loadUsageStats();
                    }
                  }
                ]
              );
            }}
          >
            🔄 Reset Usage (DEV)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resetInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  resetText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    fontWeight: '500',
  },
  devContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  devButton: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default UsageLimitIndicator; 