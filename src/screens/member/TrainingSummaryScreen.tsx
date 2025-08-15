import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useTraining } from '../../contexts/TrainingContext';
import { trainingHistoryService } from '../../services/trainingHistoryService';

interface ExerciseSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  isFailureSet: boolean;
}

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  notes?: string;
  muscleGroup?: string;
  equipment?: string;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number;
  createdBy: string;
  exercises: Exercise[];
  isUserRoutine?: boolean;
}

type TrainingSummaryRouteProp = RouteProp<{
  TrainingSummary: { 
    routine: Routine;
    exerciseSets: {[key: string]: ExerciseSet[]};
    elapsedTime: number;
    completedSets: number;
  };
}, 'TrainingSummary'>;

const TrainingSummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TrainingSummaryRouteProp>();
  const { routine, exerciseSets, elapsedTime, completedSets } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const { hideTabBar, showTabBar } = useTraining();
  
  const [duration, setDuration] = useState(Math.floor(elapsedTime / 60));
  const [description, setDescription] = useState('');
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  // Mantener la barra de navegación oculta durante el proceso de guardado
  useEffect(() => {
    hideTabBar();
  }, [hideTabBar]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs.toString().padStart(2, '0')}s`;
  };

  const calculateTotalVolume = () => {
    let totalVolume = 0;
    Object.values(exerciseSets).forEach(sets => {
      sets.forEach(set => {
        if (set.weight && set.reps && set.completed) {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps);
          if (!isNaN(weight) && !isNaN(reps)) {
            totalVolume += weight * reps;
          }
        }
      });
    });
    return Math.round(totalVolume);
  };

  const handleSave = async () => {
    try {
      // Obtener el número actual de entrenamientos guardados
      const { uid } = useSelector((state: RootState) => state.auth);
      let currentTrainingCount = 0;
      
      if (uid) {
        try {
          const existingSessions = await trainingHistoryService.getTrainingSessions(uid);
          currentTrainingCount = existingSessions.length;
        } catch (error) {
          console.log('No se pudieron obtener las sesiones existentes, usando 0 como base');
        }
      }
      
      // El nuevo entrenamiento será el siguiente número
      const newTrainingNumber = currentTrainingCount + 1;
      
      // Aquí se guardaría la información del entrenamiento
      navigation.navigate('TrainingSuccess' as never, {
        trainingNumber: newTrainingNumber,
        routine,
        exerciseSets,
        elapsedTime,
        completedSets,
        description,
      } as never);
    } catch (error) {
      console.error('Error obteniendo número de entrenamientos:', error);
      // En caso de error, usar un número por defecto
      navigation.navigate('TrainingSuccess' as never, {
        trainingNumber: 1,
        routine,
        exerciseSets,
        elapsedTime,
        completedSets,
        description,
      } as never);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Descartar Entrenamiento',
      '¿Estás seguro de que quieres descartar este entrenamiento? No se guardará ningún progreso.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            showTabBar();
            navigation.navigate('InicioTab' as never);
          },
        },
      ]
    );
  };

  const handleDurationEdit = () => {
    setIsEditingDuration(true);
  };

  const handleDurationSave = () => {
    setIsEditingDuration(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guardar</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workout Title */}
        <View style={styles.titleSection}>
          <Text style={styles.workoutTitle}>Iconik Pro Gym</Text>
        </View>

        {/* Workout Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duración</Text>
            {isEditingDuration ? (
              <View style={styles.durationEditContainer}>
                <TextInput
                  style={styles.durationInput}
                  value={duration.toString()}
                  onChangeText={(text) => setDuration(parseInt(text) || 0)}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.durationUnit}>min</Text>
                <TouchableOpacity 
                  style={styles.durationSaveButton}
                  onPress={handleDurationSave}
                >
                  <Ionicons name="checkmark" size={16} color="#E31C1F" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.durationDisplay}
                onPress={handleDurationEdit}
              >
                <Text style={styles.statValue}>{duration}min</Text>
                <Ionicons name="pencil" size={14} color="#E31C1F" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volumen</Text>
            <Text style={styles.statValue}>{calculateTotalVolume()} kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Series</Text>
            <Text style={styles.statValue}>{completedSets}</Text>
          </View>
        </View>

        {/* When Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>¿Cuándo fue?</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}, {new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Media Section */}
        <View style={styles.section}>
          <View style={styles.mediaContainer}>
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="camera" size={32} color="#666666" />
            </View>
            <Text style={styles.mediaText}>Agregar una foto / video</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Descripción</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="¿Cómo ha ido tu entrenamiento? Deja algunas notas aquí..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Discard Button al final de la lista */}
        <View style={styles.bottomFinishContainer}>
          <TouchableOpacity 
            style={styles.discardButton}
            onPress={handleDiscard}
          >
            <Text style={styles.discardButtonText}>Descartar Entreno</Text>
          </TouchableOpacity>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#E31C1F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E31C1F',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#E31C1F',
    fontSize: 18,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
  },
  durationUnit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E31C1F',
  },
  durationSaveButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#E31C1F',
  },
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mediaPlaceholder: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#666666',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  mediaText: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  descriptionInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
  },
  bottomFinishContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000000',
    marginTop: 10,
    marginBottom: 20,
  },
  discardButton: {
    backgroundColor: '#E31C1F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discardButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default TrainingSummaryScreen; 