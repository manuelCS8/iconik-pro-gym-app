import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { migrateExerciseMedia, checkMigrationStatus } from '../../services/migrateImagesService';

const MigrateImagesScreen: React.FC = () => {
  const [migrationStats, setMigrationStats] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setIsLoading(true);
      const stats = await checkMigrationStatus();
      setMigrationStats(stats);
    } catch (error) {
      console.error('Error cargando estado de migración:', error);
      Alert.alert('Error', 'No se pudo cargar el estado de migración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!migrationStats || migrationStats.withLocalMedia === 0) {
      Alert.alert('Info', 'No hay ejercicios que necesiten migración');
      return;
    }

    Alert.alert(
      'Confirmar Migración',
      `¿Estás seguro de que quieres migrar ${migrationStats.withLocalMedia} ejercicios? Esta acción puede tomar varios minutos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Migrar', onPress: startMigration }
      ]
    );
  };

  const startMigration = async () => {
    try {
      setIsMigrating(true);
      setMigrationProgress(0);

      const result = await migrateExerciseMedia((progress) => {
        setMigrationProgress(progress);
      });

      if (result.success) {
        Alert.alert(
          'Migración Completada',
          `✅ ${result.migrated} ejercicios migrados exitosamente\n❌ ${result.errors} errores`,
          [{ text: 'OK', onPress: loadMigrationStatus }]
        );
      } else {
        Alert.alert('Error', `Error en migración: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en migración:', error);
      Alert.alert('Error', 'Error durante la migración');
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E31C1F" />
        <Text style={styles.loadingText}>Cargando estado de migración...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Migración de Media</Text>
        <Text style={styles.subtitle}>
          Migra imágenes y videos de ejercicios a Firebase Storage
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Estado Actual</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total de ejercicios:</Text>
          <Text style={styles.statValue}>{migrationStats?.total || 0}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Con media local:</Text>
          <Text style={[styles.statValue, styles.warning]}>
            {migrationStats?.withLocalMedia || 0}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Con media en Firebase:</Text>
          <Text style={[styles.statValue, styles.success]}>
            {migrationStats?.withFirebaseMedia || 0}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Sin media:</Text>
          <Text style={styles.statValue}>{migrationStats?.withoutMedia || 0}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Ya migrados:</Text>
          <Text style={[styles.statValue, styles.success]}>
            {migrationStats?.migrated || 0}
          </Text>
        </View>
      </View>

      {migrationStats?.withLocalMedia > 0 && (
        <View style={styles.actionContainer}>
          <Text style={styles.actionTitle}>
            Acción Requerida
          </Text>
          <Text style={styles.actionDescription}>
            Hay {migrationStats.withLocalMedia} ejercicios con media local que necesitan ser migrados a Firebase Storage para funcionar correctamente.
          </Text>
          
          <TouchableOpacity
            style={[styles.migrateButton, isMigrating && styles.disabledButton]}
            onPress={handleMigrate}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.progressText}>
                  Migrando... {migrationProgress.toFixed(1)}%
                </Text>
              </View>
            ) : (
              <Text style={styles.migrateButtonText}>
                Iniciar Migración
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {migrationStats?.withLocalMedia === 0 && (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✅ Todo Actualizado</Text>
          <Text style={styles.successDescription}>
            Todos los ejercicios ya tienen su media migrado a Firebase Storage.
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Información</Text>
        <Text style={styles.infoText}>
          • La migración sube archivos a Firebase Storage{'\n'}
          • Los archivos originales se mantienen como backup{'\n'}
          • El proceso puede tomar varios minutos{'\n'}
          • Se requiere conexión a internet estable
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#181818',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warning: {
    color: '#FFA500',
  },
  success: {
    color: '#4CAF50',
  },
  actionContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
    lineHeight: 20,
  },
  migrateButton: {
    backgroundColor: '#E31C1F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  migrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  infoContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#181818',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default MigrateImagesScreen; 