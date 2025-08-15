import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import trainingHistoryService, { TrainingSession } from '../../services/trainingHistoryService';

const TrainingHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { uid, user } = useSelector((state: RootState) => state.auth);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrainingHistory();
  }, []);

    const loadTrainingHistory = async () => {
    try {
      if (!uid) return;

      console.log('🔄 Cargando historial de entrenamientos...');
      
      // Verificar estado de la base de datos
      const dbStatus = await trainingHistoryService.checkDatabaseStatus();
      if (!dbStatus) {
        console.log('⚠️ Base de datos no disponible, intentando reinicializar...');
        await trainingHistoryService.reinitialize();
      }
      
      const sessions = await trainingHistoryService.getTrainingSessions(uid);
      console.log(`✅ Cargados ${sessions.length} entrenamientos`);
      setTrainingSessions(sessions);
    } catch (error) {
      console.error('❌ Error loading training history:', error);

      // Intentar reinicializar si hay error
      try {
        console.log('🔄 Intentando reinicializar base de datos...');
        await trainingHistoryService.reinitialize();
        const sessions = await trainingHistoryService.getTrainingSessions(uid);
        setTrainingSessions(sessions);
      } catch (reinitError) {
        console.error('❌ Error reinicializando:', reinitError);
        
        // Como último recurso, intentar resetear completamente la base de datos
        try {
          console.log('🔄 Intentando resetear completamente la base de datos...');
          await trainingHistoryService.resetDatabase();
          const sessions = await trainingHistoryService.getTrainingSessions(uid);
          setTrainingSessions(sessions);
        } catch (resetError) {
          console.error('❌ Error reseteando base de datos:', resetError);
          Alert.alert(
            'Error Crítico',
            'No se pudo cargar el historial de entrenamientos. Intenta reiniciar la aplicación.',
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrainingHistory();
    setRefreshing(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Eliminar Entrenamiento',
      '¿Estás seguro de que quieres eliminar este entrenamiento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await trainingHistoryService.deleteTrainingSession(sessionId);
              await loadTrainingHistory();
              Alert.alert('✅ Eliminado', 'El entrenamiento ha sido eliminado.');
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'No se pudo eliminar el entrenamiento.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K kg`;
    }
    return `${volume} kg`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getRoutineEmoji = (routineName: string) => {
    const name = routineName.toLowerCase();
    if (name.includes('upper') || name.includes('torso') || name.includes('pecho') || name.includes('brazo')) {
      return '💪💪';
    } else if (name.includes('lower') || name.includes('pierna') || name.includes('leg')) {
      return '🍗🍗';
    } else if (name.includes('full') || name.includes('completo')) {
      return '🏋️‍♂️';
    } else {
      return '💪';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles de Entrenamientos</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de Entrenamientos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TrainingHistoryDetail' as never)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {trainingSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>No hay entrenamientos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Completa un entrenamiento y guárdalo para ver tu historial aquí
            </Text>
          </View>
        ) : (
          trainingSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => navigation.navigate('TrainingDetail' as never, { sessionId: session.id } as never)}
            >
              {/* Header con usuario y fecha */}
              <View style={styles.sessionHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.userName}>{session.userName}</Text>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.date)}, {formatTime(session.date)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteSession(session.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#E31C1F" />
                </TouchableOpacity>
              </View>

              {/* Nombre de la rutina */}
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{session.routineName}</Text>
                <Text style={styles.routineEmoji}>{getRoutineEmoji(session.routineName)}</Text>
              </View>

              {/* Estadísticas */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tiempo</Text>
                  <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Volumen</Text>
                  <Text style={styles.statValue}>{formatVolume(session.volume)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Series</Text>
                  <Text style={styles.statValue}>
                    {session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
                  </Text>
                </View>
              </View>

              {/* Ejercicios */}
              <View style={styles.exercisesContainer}>
                {session.exercises.slice(0, 3).map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="barbell-outline" size={16} color="#E31C1F" />
                    </View>
                    <Text style={styles.exerciseText}>
                      {exercise.sets.length} serie{exercise.sets.length !== 1 ? 's' : ''} {exercise.exerciseName}
                    </Text>
                  </View>
                ))}
                {session.exercises.length > 3 && (
                  <Text style={styles.moreExercises}>
                    Ver {session.exercises.length - 3} más ejercicios
                  </Text>
                )}
              </View>

              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E31C1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    color: '#888888',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  routineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  routineEmoji: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#E31C1F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exercisesContainer: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  moreExercises: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
});

export default TrainingHistoryScreen; 