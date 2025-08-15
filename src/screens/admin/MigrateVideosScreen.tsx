import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../utils/theme';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { migrateLocalVideosToStorage } from '../../services/exerciseMediaService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Exercise {
  id: string;
  name: string;
  mediaType?: string;
  mediaURL?: string;
}

const MigrateVideosScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [migratedCount, setMigratedCount] = useState(0);

  useEffect(() => {
    loadExercisesWithLocalVideos();
  }, []);

  const loadExercisesWithLocalVideos = async () => {
    try {
      setLoading(true);
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const exercisesWithLocalVideos: Exercise[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.mediaType === 'video' && data.mediaURL && data.mediaURL.startsWith('file://')) {
          exercisesWithLocalVideos.push({
            id: doc.id,
            name: data.name || '',
            mediaType: data.mediaType,
            mediaURL: data.mediaURL,
          });
        }
      });
      
      setExercises(exercisesWithLocalVideos);
      console.log(`📊 Encontrados ${exercisesWithLocalVideos.length} ejercicios con videos locales`);
      
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  };

  const migrateVideo = async (exercise: Exercise) => {
    if (!exercise.mediaURL) return;
    
    try {
      setMigrating(exercise.id);
      
      await migrateLocalVideosToStorage(
        exercise.id,
        exercise.mediaURL,
        'admin'
      );
      
      setMigratedCount(prev => prev + 1);
      Alert.alert('Éxito', `Video migrado: ${exercise.name}`);
      
      // Recargar lista
      await loadExercisesWithLocalVideos();
      
    } catch (error) {
      console.error('Error migrando video:', error);
      Alert.alert('Error', `No se pudo migrar el video: ${exercise.name}`);
    } finally {
      setMigrating(null);
    }
  };

  const migrateAllVideos = async () => {
    if (exercises.length === 0) {
      Alert.alert('Info', 'No hay videos para migrar');
      return;
    }
    
    Alert.alert(
      'Migrar Todos los Videos',
      `¿Estás seguro de que quieres migrar ${exercises.length} videos? Esto puede tomar varios minutos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Migrar',
          style: 'destructive',
          onPress: async () => {
            try {
              setMigrating('all');
              let successCount = 0;
              
              for (const exercise of exercises) {
                try {
                  await migrateLocalVideosToStorage(
                    exercise.id,
                    exercise.mediaURL!,
                    'admin'
                  );
                  successCount++;
                  setMigratedCount(successCount);
                } catch (error) {
                  console.error(`Error migrando ${exercise.name}:`, error);
                }
              }
              
              Alert.alert(
                'Migración Completada',
                `Se migraron ${successCount} de ${exercises.length} videos exitosamente.`
              );
              
              await loadExercisesWithLocalVideos();
              
            } catch (error) {
              console.error('Error en migración masiva:', error);
              Alert.alert('Error', 'Hubo un error durante la migración masiva');
            } finally {
              setMigrating(null);
            }
          },
        },
      ]
    );
  };

  const renderExerciseItem = (exercise: Exercise) => {
    const isMigrating = migrating === exercise.id;
    
    return (
      <View key={exercise.id} style={styles.exerciseItem}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseUrl} numberOfLines={1}>
            {exercise.mediaURL}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.migrateButton, isMigrating && styles.migratingButton]}
          onPress={() => migrateVideo(exercise)}
          disabled={isMigrating}
        >
          {isMigrating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
          )}
          <Text style={styles.migrateButtonText}>
            {isMigrating ? 'Migrando...' : 'Migrar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando ejercicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Migrar Videos Locales</Text>
        <Text style={styles.subtitle}>
          {exercises.length} videos locales encontrados
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{migratedCount}</Text>
          <Text style={styles.statLabel}>Migrados</Text>
        </View>
      </View>

      {/* Migrate All Button */}
      {exercises.length > 0 && (
        <TouchableOpacity
          style={[styles.migrateAllButton, migrating === 'all' && styles.migratingButton]}
          onPress={migrateAllVideos}
          disabled={migrating === 'all'}
        >
          {migrating === 'all' ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.white} />
          )}
          <Text style={styles.migrateAllButtonText}>
            {migrating === 'all' ? 'Migrando Todos...' : 'Migrar Todos los Videos'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Exercises List */}
      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>¡No hay videos locales para migrar!</Text>
            <Text style={styles.emptySubtext}>
              Todos los videos ya están en Firebase Storage
            </Text>
          </View>
        ) : (
          exercises.map(renderExerciseItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: SIZES.largeTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.largeTitle,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 5,
  },
  migrateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  migratingButton: {
    backgroundColor: COLORS.gray,
  },
  migrateAllButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  exercisesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 15,
  },
  exerciseName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  exerciseUrl: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
  migrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  migrateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default MigrateVideosScreen; 