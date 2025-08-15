import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import trainingHistoryService, { TrainingSession } from '../../services/trainingHistoryService';

type TrainingDetailRouteProp = RouteProp<{
  TrainingDetail: { 
    sessionId: string;
  };
}, 'TrainingDetail'>;

const TrainingDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TrainingDetailRouteProp>();
  const { sessionId } = route.params;
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingSession();
  }, [sessionId]);

  const loadTrainingSession = async () => {
    try {
      console.log('🔄 Cargando detalles del entrenamiento...');
      
      // Verificar estado de la base de datos
      const dbStatus = await trainingHistoryService.checkDatabaseStatus();
      if (!dbStatus) {
        console.log('⚠️ Base de datos no disponible, intentando reinicializar...');
        await trainingHistoryService.reinitialize();
      }
      
      const trainingSession = await trainingHistoryService.getTrainingSession(sessionId);
      setSession(trainingSession);
      
      if (!trainingSession) {
        Alert.alert('Error', 'No se encontró el entrenamiento especificado.');
      }
    } catch (error) {
      console.error('❌ Error loading training session:', error);
      
      // Intentar reinicializar si hay error
      try {
        console.log('🔄 Intentando reinicializar base de datos...');
        await trainingHistoryService.reinitialize();
        const trainingSession = await trainingHistoryService.getTrainingSession(sessionId);
        setSession(trainingSession);
      } catch (reinitError) {
        console.error('❌ Error reinicializando:', reinitError);
        Alert.alert(
          'Error',
          'No se pudo cargar el entrenamiento. Intenta reiniciar la aplicación.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
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

  const getExerciseIcon = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('banca')) {
      return '🏋️‍♂️';
    } else if (name.includes('remo') || name.includes('row')) {
      return '🚣‍♂️';
    } else if (name.includes('sentadilla') || name.includes('squat')) {
      return '🏋️‍♀️';
    } else if (name.includes('curl')) {
      return '💪';
    } else if (name.includes('extension') || name.includes('tricep')) {
      return '💪';
    } else {
      return '🏋️‍♂️';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de Entrenamiento</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de Entrenamiento</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró el entrenamiento</Text>
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
        <Text style={styles.headerTitle}>Detalle de Entrenamiento</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User and Workout Summary */}
        <View style={styles.summarySection}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={24} color="#ffffff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{session.userName}</Text>
              <Text style={styles.workoutDate}>
                {formatDate(session.date)} - {formatTime(session.date)}
              </Text>
            </View>
          </View>

          <View style={styles.workoutTitle}>
            <Text style={styles.routineName}>{session.routineName}</Text>
            <Text style={styles.routineEmoji}>{getRoutineEmoji(session.routineName)}</Text>
          </View>

          {/* Key Statistics */}
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

          
        </View>

                 {/* Exercises Section */}
         <View style={styles.exercisesSection}>
           <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Entrenamiento</Text>
           </View>

          {session.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseBlock}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIcon}>
                  <Text style={styles.exerciseIconText}>{getExerciseIcon(exercise.exerciseName)}</Text>
                </View>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              </View>

              {/* Sets Table */}
              <View style={styles.setsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>SERIE</Text>
                  <Text style={styles.headerCell}>PESO Y REPS</Text>
                </View>

                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.tableRow}>
                    <Text style={[
                      styles.serieCell,
                      set.isFailureSet && styles.failureSet
                    ]}>
                      {set.isFailureSet ? 'F' : (setIndex + 1).toString()}
                    </Text>
                    <Text style={styles.weightRepsCell}>
                      {set.weight}kg x {set.reps} reps
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E31C1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutDate: {
    color: '#888888',
    fontSize: 14,
  },
  workoutTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  routineEmoji: {
    fontSize: 24,
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
  
  exercisesSection: {
    marginBottom: 24,
  },
     sectionHeader: {
     marginBottom: 16,
   },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  exerciseBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseIconText: {
    fontSize: 16,
  },
  exerciseName: {
    color: '#E31C1F',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerCell: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serieCell: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  failureSet: {
    color: '#E31C1F',
  },
  weightRepsCell: {
    color: '#ffffff',
    fontSize: 14,
    flex: 2,
  },
});

export default TrainingDetailScreen; 