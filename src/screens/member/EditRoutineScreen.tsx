import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { COLORS, SIZES } from '../../utils/theme';
import { doc, updateDoc, getDoc, collection, getDocs, serverTimestamp, getDocs as getDocsFirestore } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import userRoutineService from '../../services/userRoutineService';

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
}

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  series: number;
  reps: number;
  restTime: number;
  order: number;
  notes?: string;
}

interface RoutineForm {
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: string;
  exercises: RoutineExercise[];
}

type EditRoutineRouteProp = RouteProp<{
  EditRoutine: { routineId: string };
}, 'EditRoutine'>;

const EditRoutineScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditRoutineRouteProp>();
  const { routineId } = route.params;
  const insets = useSafeAreaInsets();
  const { uid } = useSelector((state: RootState) => state.auth);
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  const [routine, setRoutine] = useState<RoutineForm>({
    name: '',
    description: '',
    level: 'Principiante',
    objective: '',
    estimatedDuration: '60',
    exercises: [],
  });

  useEffect(() => {
    loadExercises();
    loadRoutine();
  }, [routineId]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocsFirestore(exercisesRef);
      
      const exercisesFromFirestore: Exercise[] = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '',
            primaryMuscleGroups: data.primaryMuscleGroups || [],
            equipment: data.equipment || '',
            difficulty: data.difficulty || 'Principiante',
          };
        })
        .filter(exercise => exercise.name && exercise.isActive !== false);

      setExercises(exercisesFromFirestore);
      console.log(`✅ Cargados ${exercisesFromFirestore.length} ejercicios activos`);
      
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutine = async () => {
    try {
      setIsLoading(true);
      
      const routineData = await userRoutineService.getUserRoutineById(routineId);
      
      if (!routineData) {
        Alert.alert('Error', 'Rutina no encontrada');
        navigation.goBack();
        return;
      }

      // Verificar que la rutina pertenece al usuario actual
      if (routineData.createdBy !== uid) {
        Alert.alert('Error', 'No tienes permisos para editar esta rutina');
        navigation.goBack();
        return;
      }

      setRoutine({
        name: routineData.name,
        description: routineData.description || '',
        level: routineData.difficulty as 'Principiante' | 'Intermedio' | 'Avanzado',
        objective: routineData.category,
        estimatedDuration: routineData.duration.toString(),
        exercises: routineData.exercises.map((exercise, index) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          primaryMuscleGroups: exercise.primaryMuscleGroups || [],
          equipment: exercise.equipment || '',
          difficulty: exercise.difficulty || 'Principiante',
          series: exercise.sets || 3,
          reps: exercise.reps || 12,
          restTime: exercise.restTime || 60,
          order: index + 1,
          notes: exercise.notes || '',
        })),
      });

      console.log('✅ Rutina cargada para edición:', routineData.name);
      
    } catch (error) {
      console.error('Error cargando rutina:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    try {
      if (!routine.name.trim() || !routine.description.trim() || !routine.objective.trim()) {
        Alert.alert("Error", "Por favor completa todos los campos obligatorios");
        return;
      }

      if (routine.exercises.length === 0) {
        Alert.alert("Error", "Debes agregar al menos un ejercicio a la rutina");
        return;
      }

      setIsSaving(true);

      // Actualizar rutina en Firestore
      const routineData = {
        name: routine.name.trim(),
        description: routine.description.trim(),
        difficulty: routine.level,
        category: routine.objective.trim(),
        duration: parseInt(routine.estimatedDuration) || 60,
        exercises: routine.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          primaryMuscleGroups: exercise.primaryMuscleGroups,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty,
          sets: exercise.series,
          reps: exercise.reps,
          restTime: exercise.restTime,
          notes: exercise.notes,
        })),
        updatedAt: serverTimestamp(),
      };

      await userRoutineService.updateUserRoutine(routineId, routineData);

      Alert.alert(
        "✅ Rutina Actualizada", 
        `Tu rutina "${routine.name}" ha sido actualizada exitosamente.`
      );
      
      navigation.goBack();

      console.log("✅ Rutina de usuario actualizada en Firestore:", routine.name);

    } catch (error) {
      console.error("Error updating routine:", error);
      Alert.alert("Error", "No se pudo actualizar la rutina");
    } finally {
      setIsSaving(false);
    }
  };

  const addExerciseToRoutine = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroups: exercise.primaryMuscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      series: 3,
      reps: 12,
      restTime: 60,
      order: routine.exercises.length + 1,
      notes: '',
    };

    setRoutine(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));

    setShowExerciseModal(false);
    setSelectedExercise(null);
  };

  const removeExerciseFromRoutine = (index: number) => {
    setRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExerciseInRoutine = (index: number, field: keyof RoutineExercise, value: any) => {
    setRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const moveExerciseUp = (index: number) => {
    if (index === 0) return;
    
    setRoutine(prev => {
      const newExercises = [...prev.exercises];
      const temp = newExercises[index];
      newExercises[index] = newExercises[index - 1];
      newExercises[index - 1] = temp;
      
      // Actualizar orden
      newExercises.forEach((exercise, i) => {
        exercise.order = i + 1;
      });
      
      return {
        ...prev,
        exercises: newExercises
      };
    });
  };

  const moveExerciseDown = (index: number) => {
    if (index === routine.exercises.length - 1) return;
    
    setRoutine(prev => {
      const newExercises = [...prev.exercises];
      const temp = newExercises[index];
      newExercises[index] = newExercises[index + 1];
      newExercises[index + 1] = temp;
      
      // Actualizar orden
      newExercises.forEach((exercise, i) => {
        exercise.order = i + 1;
      });
      
      return {
        ...prev,
        exercises: newExercises
      };
    });
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity 
      style={styles.exerciseItem}
      onPress={() => addExerciseToRoutine(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetails}>
          {item.primaryMuscleGroups.join(', ')} • {item.equipment}
        </Text>
      </View>
             <Ionicons name="add-circle" size={24} color="#E31C1F" />
    </TouchableOpacity>
  );

  const renderRoutineExercise = ({ item, index }: { item: RoutineExercise; index: number }) => (
    <View style={styles.routineExerciseCard}>
      <View style={styles.routineExerciseHeader}>
        <Text style={styles.routineExerciseName}>
          {index + 1}. {item.exerciseName}
        </Text>
        <View style={styles.exerciseActions}>
          <TouchableOpacity 
            onPress={() => moveExerciseUp(index)}
            style={[styles.moveButton, index === 0 && styles.disabledButton]}
            disabled={index === 0}
          >
                         <Ionicons name="chevron-up" size={16} color={index === 0 ? "#888888" : "#E31C1F"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => moveExerciseDown(index)}
            style={[styles.moveButton, index === routine.exercises.length - 1 && styles.disabledButton]}
            disabled={index === routine.exercises.length - 1}
          >
                         <Ionicons name="chevron-down" size={16} color={index === routine.exercises.length - 1 ? "#888888" : "#E31C1F"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => removeExerciseFromRoutine(index)}
            style={styles.removeButton}
          >
                         <Ionicons name="close-circle" size={20} color="#E31C1F" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.exerciseInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Series:</Text>
          <TextInput
            style={styles.input}
            value={item.series.toString()}
            onChangeText={(value) => updateExerciseInRoutine(index, 'series', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps:</Text>
          <TextInput
            style={styles.input}
            value={item.reps.toString()}
            onChangeText={(value) => updateExerciseInRoutine(index, 'reps', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="12"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Descanso (seg):</Text>
          <TextInput
            style={styles.input}
            value={item.restTime.toString()}
            onChangeText={(value) => updateExerciseInRoutine(index, 'restTime', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="60"
          />
        </View>
      </View>
      
      <TextInput
        style={styles.notesInput}
        value={item.notes}
        onChangeText={(value) => updateExerciseInRoutine(index, 'notes', value)}
        placeholder="Notas adicionales (opcional)"
        multiline
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E31C1F" />
          <Text style={styles.loadingText}>Cargando rutina...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
                     <TouchableOpacity 
             style={styles.backButton}
             onPress={() => navigation.goBack()}
           >
             <Ionicons name="arrow-back" size={24} color="#ffffff" />
           </TouchableOpacity>
          <Text style={styles.title}>✏️ Editar Rutina</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>📋 Información de la Rutina</Text>
          
                     <TextInput
             style={styles.input}
             placeholder="Nombre de la rutina"
             value={routine.name}
             onChangeText={(value) => setRoutine(prev => ({ ...prev, name: value }))}
             placeholderTextColor="#888888"
           />
          
                     <TextInput
             style={[styles.input, styles.textArea]}
             placeholder="Descripción de la rutina"
             value={routine.description}
             onChangeText={(value) => setRoutine(prev => ({ ...prev, description: value }))}
             placeholderTextColor="#888888"
             multiline
           />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Nivel:</Text>
              <View style={styles.pickerContainer}>
                {(['Principiante', 'Intermedio', 'Avanzado'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.pickerOption,
                      routine.level === level && styles.pickerOptionSelected
                    ]}
                    onPress={() => setRoutine(prev => ({ ...prev, level }))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      routine.level === level && styles.pickerOptionTextSelected
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Objetivo:</Text>
                             <TextInput
                 style={styles.input}
                 placeholder="Ej: Fuerza, Hipertrofia"
                 value={routine.objective}
                 onChangeText={(value) => setRoutine(prev => ({ ...prev, objective: value }))}
                 placeholderTextColor="#888888"
               />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Duración estimada (min):</Text>
                             <TextInput
                 style={styles.input}
                 placeholder="60"
                 value={routine.estimatedDuration}
                 onChangeText={(value) => setRoutine(prev => ({ ...prev, estimatedDuration: value }))}
                 keyboardType="numeric"
                 placeholderTextColor="#888888"
               />
            </View>
          </View>
        </View>

        {/* Exercises Section */}
        <View style={styles.exercisesSection}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionTitle}>💪 Ejercicios ({routine.exercises.length})</Text>
                         <TouchableOpacity
               style={styles.addExerciseButton}
               onPress={() => setShowExerciseModal(true)}
             >
               <Ionicons name="add" size={20} color="#ffffff" />
               <Text style={styles.addExerciseButtonText}>Agregar</Text>
             </TouchableOpacity>
          </View>

                     {routine.exercises.length === 0 ? (
             <View style={styles.emptyState}>
               <Ionicons name="fitness-outline" size={48} color="#888888" />
               <Text style={styles.emptyStateText}>No hay ejercicios en esta rutina</Text>
               <Text style={styles.emptyStateSubtext}>Toca "Agregar" para comenzar</Text>
             </View>
          ) : (
            <FlatList
              data={routine.exercises}
              renderItem={renderRoutineExercise}
              keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveRoutine}
          disabled={isSaving}
        >
                     {isSaving ? (
             <ActivityIndicator color="#ffffff" />
           ) : (
             <>
               <Ionicons name="save" size={20} color="#ffffff" />
               <Text style={styles.saveButtonText}>Guardar Cambios</Text>
             </>
           )}
        </TouchableOpacity>
      </ScrollView>

      {/* Exercise Selection Modal */}
      {showExerciseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
                             <TouchableOpacity
                 onPress={() => setShowExerciseModal(false)}
                 style={styles.closeButton}
               >
                 <Ionicons name="close" size={24} color="#ffffff" />
               </TouchableOpacity>
            </View>
            
            <FlatList
              data={exercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              style={styles.exerciseList}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#E31C1F',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  exercisesSection: {
    marginBottom: 30,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31C1F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
  },
  routineExerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routineExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineExerciseName: {
    color: '#E31C1F',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveButton: {
    padding: 4,
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  removeButton: {
    padding: 4,
  },
  exerciseInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  notesInput: {
    backgroundColor: '#000000',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#E31C1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    width: '90%',
    height: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    color: '#888888',
    fontSize: 14,
  },
});

export default EditRoutineScreen; 