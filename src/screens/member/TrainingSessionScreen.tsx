import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setWeightUnit } from '../../redux/slices/userPreferencesSlice';
import { COLORS } from '../../utils/theme';
import { routineService } from '../../services/routineService';
import userRoutineService from '../../services/userRoutineService';
import userPreferencesService from '../../services/userPreferencesService';
import WeightUnitSelector from '../../components/WeightUnitSelector';
import { useTraining } from '../../contexts/TrainingContext';
import trainingHistoryService from '../../services/trainingHistoryService';

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

interface ExerciseSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  isFailureSet: boolean;
}

type TrainingSessionRouteProp = RouteProp<{
  TrainingSession: { routineId: string; isUserRoutine: boolean };
}, 'TrainingSession'>;

const TrainingSessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TrainingSessionRouteProp>();
  const { routineId, isUserRoutine } = route.params;
  const { uid } = useSelector((state: RootState) => state.auth);
  const { weightUnit } = useSelector((state: RootState) => state.userPreferences);
  const dispatch = useDispatch();
  const { hideTabBar, showTabBar } = useTraining();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseSets, setExerciseSets] = useState<{[key: string]: ExerciseSet[]}>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Ocultar la barra de navegación cuando se inicia el entrenamiento
  useEffect(() => {
    hideTabBar();
    
    // Mostrar la barra de navegación cuando se sale de la pantalla
    return () => {
      showTabBar();
    };
  }, [hideTabBar, showTabBar]);

  // Cargar rutina
  useEffect(() => {
    const loadRoutine = async () => {
      if (!routineId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Cargando rutina para entrenamiento:', routineId, 'isUserRoutine:', isUserRoutine);
        
        let routineData: Routine | null = null;
        
        if (isUserRoutine) {
          // Cargar rutina de usuario
          const userRoutine = await userRoutineService.getUserRoutineById(routineId);
          if (userRoutine) {
            routineData = {
              id: userRoutine.id!,
              name: userRoutine.name,
              description: userRoutine.description,
              category: userRoutine.category,
              difficulty: userRoutine.difficulty,
              duration: userRoutine.duration,
              createdBy: userRoutine.createdBy,
              exercises: userRoutine.exercises,
              isUserRoutine: true
            };
          }
        } else {
          // Cargar rutina del gimnasio
          const gymRoutine = await routineService.getRoutineById(routineId);
          if (gymRoutine) {
            // Mapear ejercicios del gimnasio al formato correcto
            const mappedExercises = (gymRoutine.exercises || []).map(ex => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              sets: ex.series || ex.sets || 3, // Usar 'series' si existe, sino 'sets', sino 3 por defecto
              reps: ex.reps,
              weight: ex.weight,
              restTime: ex.restTime,
              notes: ex.notes,
              muscleGroup: ex.primaryMuscleGroups?.[0] || 'No especificado',
              equipment: ex.equipment || 'No especificado'
            }));
            
            routineData = {
              id: gymRoutine.id!,
              name: gymRoutine.name,
              description: gymRoutine.description || '',
              category: gymRoutine.category,
              difficulty: gymRoutine.difficulty,
              duration: gymRoutine.duration,
              createdBy: gymRoutine.createdBy || 'Gimnasio',
              exercises: mappedExercises,
              isUserRoutine: false
            };
          }
        }
        
        if (routineData) {
          console.log('✅ Rutina cargada para entrenamiento:', routineData.name);
          setRoutine(routineData);
        } else {
          console.log('❌ Rutina no encontrada');
          Alert.alert("Error", "Rutina no encontrada");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error loading routine for training:", error);
        Alert.alert("Error", "No se pudo cargar la rutina");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, [routineId, isUserRoutine]);

  // Cargar preferencias del usuario
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!uid) return;
      
      try {
        const userWeightUnit = await userPreferencesService.getWeightUnit(uid);
        dispatch(setWeightUnit(userWeightUnit));
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [uid, dispatch]);

  // Inicializar entrenamiento cuando se carga la rutina
  useEffect(() => {
    if (!routine) {
      return;
    }

    // Inicializar sets para cada ejercicio
    const initialSets: {[key: string]: ExerciseSet[]} = {};
    routine.exercises.forEach(exercise => {
      console.log(`🎯 Creando ${exercise.sets} series para: ${exercise.exerciseName}`);
      const sets: ExerciseSet[] = [];
      for (let i = 0; i < exercise.sets; i++) {
        sets.push({
          id: `set_${Date.now()}_${exercise.exerciseId}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          weight: '',
          reps: '',
          completed: false,
          isFailureSet: false,
        });
      }
      initialSets[exercise.exerciseId] = sets;
    });
    setExerciseSets(initialSets);
    
    // Calcular total de sets
    const total = routine.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    console.log(`📊 Total de series creadas: ${total}`);
    setTotalSets(total);
    
    // Iniciar timer
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [routine]);



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSetComplete = (exerciseId: string, setId: string) => {
    setExerciseSets(prev => {
      const newSets = { ...prev };
      const exerciseSets = newSets[exerciseId];
      const setIndex = exerciseSets.findIndex(set => set.id === setId);
      
      if (setIndex !== -1) {
        exerciseSets[setIndex].completed = !exerciseSets[setIndex].completed;
        
        // Contar sets completados
        const completed = Object.values(newSets).flat().filter(set => set.completed).length;
        setCompletedSets(completed);
      }
      
      return newSets;
    });
  };

  const handleSetTypeToggle = (exerciseId: string, setId: string) => {
    setExerciseSets(prev => {
      const newSets = { ...prev };
      const exerciseSets = newSets[exerciseId];
      const setIndex = exerciseSets.findIndex(set => set.id === setId);
      
      if (setIndex !== -1) {
        exerciseSets[setIndex].isFailureSet = !exerciseSets[setIndex].isFailureSet;
      }
      
      return newSets;
    });
  };

  const handleFinishTraining = () => {
    if (!routine) return;
    
    navigation.navigate('TrainingSummary' as never, {
      routine,
      exerciseSets,
      elapsedTime,
      completedSets
    } as never);
  };

  const handleExercisePress = (exercise: Exercise) => {
    // Navegar al detalle del ejercicio
    navigation.navigate('ExerciseDetail' as never, { 
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName 
    } as never);
  };

  const handleUnitChange = async (newUnit: 'KG' | 'LBS') => {
    if (!uid) return;
    
    try {
      await userPreferencesService.updateWeightUnit(uid, newUnit);
      dispatch(setWeightUnit(newUnit));
    } catch (error) {
      console.error('Error updating weight unit:', error);
      Alert.alert('Error', 'No se pudo actualizar la unidad de peso');
    }
  };





  // Mostrar loading mientras se carga la rutina
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cargando rutina...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Validar que routine existe después de cargar
  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: No se encontró la rutina</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
                 <TouchableOpacity 
           style={styles.previousButton}
           onPress={() => {
             // Navegar al historial completo de entrenamientos
             navigation.navigate('TrainingHistoryStack' as never);
           }}
         >
          <Text style={styles.previousButtonText}>Anteriores</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={handleFinishTraining}
        >
          <Text style={styles.finishButtonText}>Terminar</Text>
        </TouchableOpacity>
      </View>

      {/* Workout Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ejercicios</Text>
          <Text style={styles.summaryValue}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Series</Text>
          <Text style={[styles.summaryValue, { color: '#ffffff' }]}>{completedSets}</Text>
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
        {routine.exercises.map((exercise, index) => (
          <View key={`${exercise.exerciseId}-${index}`} style={styles.exerciseBlock}>
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIcon}>
                <View style={styles.iconCircle}>
                  <Ionicons name="fitness" size={18} color="#ffffff" />
                </View>
              </View>
              <TouchableOpacity 
                style={styles.exerciseNameContainer}
                onPress={() => handleExercisePress(exercise)}
              >
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Exercise Info Row */}
            <View style={styles.exerciseInfoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={14} color="#96CEB4" />
                <Text style={styles.infoText}>{exercise.restTime}s descanso</Text>
              </View>
              {exercise.equipment && (
                <View style={styles.infoItem}>
                  <Ionicons name="construct" size={14} color="#FF6B6B" />
                  <Text style={styles.infoText}>{exercise.equipment}</Text>
                </View>
              )}
            </View>

            {/* Exercise Sets Table */}
            <View style={styles.setsTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>SERIE</Text>
                <View style={styles.weightHeaderContainer}>
                  <Text style={styles.headerCell}>PESO</Text>
                  <WeightUnitSelector
                    currentUnit={weightUnit}
                    onUnitChange={handleUnitChange}
                    size="small"
                  />
                </View>
                <Text style={styles.headerCell}>REPS</Text>
                <View style={styles.checkboxHeader} />
              </View>

              {/* Table Rows */}
              {exerciseSets[exercise.exerciseId]?.map((set, setIndex) => (
                <View key={`${set.id}-${setIndex}`} style={[
                  styles.tableRow,
                  set.completed && styles.completedRow
                ]}>
                  <TouchableOpacity
                    style={styles.serieCellContainer}
                    onPress={() => handleSetTypeToggle(exercise.exerciseId, set.id)}
                  >
                    <Text style={[
                      styles.serieCell,
                      set.isFailureSet && styles.failureSet
                    ]}>
                      {set.isFailureSet ? 'F' : setIndex + 1}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.inputCell}
                    value={set.weight}
                    onChangeText={(text) => {
                      const newSets = { ...exerciseSets };
                      newSets[exercise.exerciseId][setIndex].weight = text;
                      setExerciseSets(newSets);
                    }}
                    placeholder="-"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={set.reps}
                    onChangeText={(text) => {
                      const newSets = { ...exerciseSets };
                      newSets[exercise.exerciseId][setIndex].reps = text;
                      setExerciseSets(newSets);
                    }}
                    placeholder="-"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      set.completed && styles.checkboxCompleted
                    ]}
                    onPress={() => handleSetComplete(exercise.exerciseId, set.id)}
                  >
                    {set.completed && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Exercise Notes */}
            {exercise.notes && exercise.notes.trim() && (
              <View style={styles.notesContainer}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text" size={16} color="#E31C1F" />
                  <Text style={styles.notesLabel}>Notas:</Text>
                </View>
                <Text style={styles.notesText}>{exercise.notes}</Text>
              </View>
            )}
          </View>
        ))}
        
        {/* Botón Terminar al final de la lista */}
        <View style={styles.bottomFinishContainer}>
          <TouchableOpacity 
            style={styles.bottomFinishButton}
            onPress={handleFinishTraining}
          >
            <Text style={styles.bottomFinishButtonText}>Terminar Rutina</Text>
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
    paddingVertical: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  previousButton: {
    backgroundColor: '#E31C1F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  previousButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#E31C1F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E31C1F',
  },
  exercisesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  exerciseBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIcon: {
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E31C1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E31C1F',
  },
  moreButton: {
    marginLeft: 10,
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    marginLeft: 5,
    fontWeight: '500',
  },
  setsTable: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333333',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  checkboxHeader: {
    width: 40,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  completedRow: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  serieCellContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(227, 28, 31, 0.1)',
  },
  serieCell: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  failureSet: {
    color: '#E31C1F',
    fontWeight: 'bold',
  },
  inputCell: {
    flex: 1,
    height: 44,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E31C1F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxCompleted: {
    backgroundColor: '#E31C1F',
  },
  notesContainer: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E31C1F',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E31C1F',
    marginLeft: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E31C1F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
     weightHeaderContainer: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
   },
   bottomFinishContainer: {
     paddingHorizontal: 20,
     paddingVertical: 20,
     backgroundColor: '#000000',
     marginTop: 10,
     marginBottom: 20,
   },
   bottomFinishButton: {
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
   bottomFinishButtonText: {
     color: '#ffffff',
     fontSize: 18,
     fontWeight: 'bold',
     letterSpacing: 0.5,
   },
 });

export default TrainingSessionScreen; 