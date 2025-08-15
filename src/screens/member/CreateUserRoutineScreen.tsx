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
import { COLORS, SIZES } from '../../utils/theme';
import { addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


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

interface NewRoutineForm {
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: string;
  exercises: RoutineExercise[];
}

const CreateUserRoutineScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  const [newRoutine, setNewRoutine] = useState<NewRoutineForm>({
    name: '',
    description: '',
    level: 'Principiante',
    objective: '',
    estimatedDuration: '60',
    exercises: [],
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
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

  const handleCreateRoutine = async () => {
    try {
      if (!newRoutine.name.trim() || !newRoutine.description.trim() || !newRoutine.objective.trim()) {
        Alert.alert("Error", "Por favor completa todos los campos obligatorios");
        return;
      }

      if (newRoutine.exercises.length === 0) {
        Alert.alert("Error", "Debes agregar al menos un ejercicio a la rutina");
        return;
      }

      setIsLoading(true);

      // Crear rutina en Firestore
      const routineData = {
        name: newRoutine.name.trim(),
        description: newRoutine.description.trim(),
        level: newRoutine.level,
        objective: newRoutine.objective.trim(),
        estimatedDuration: parseInt(newRoutine.estimatedDuration) || 60,
        exercises: newRoutine.exercises,
        creatorType: 'USER', // Rutina creada por usuario
        createdAt: serverTimestamp(),
        createdBy: 'user', // TODO: Obtener el UID del usuario actual
        isActive: true,
        isPublic: false, // Las rutinas de usuario son privadas por defecto
      };

      const docRef = await addDoc(collection(db, 'routines'), routineData);

      Alert.alert(
        "✅ Rutina Creada", 
        `Tu rutina "${newRoutine.name}" ha sido creada exitosamente.\n\nID: ${docRef.id}`
      );
      
      // Resetear formulario
      setNewRoutine({
        name: '',
        description: '',
        level: 'Principiante',
        objective: '',
        estimatedDuration: '60',
        exercises: [],
      });

      console.log("✅ Rutina de usuario creada en Firestore:", newRoutine.name);

    } catch (error) {
      console.error("Error creating routine:", error);
      Alert.alert("Error", "No se pudo crear la rutina");
    } finally {
      setIsLoading(false);
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
      order: newRoutine.exercises.length + 1,
      notes: '',
    };

    setNewRoutine(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));

    setShowExerciseModal(false);
    setSelectedExercise(null);
  };

  const removeExerciseFromRoutine = (index: number) => {
    setNewRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExerciseInRoutine = (index: number, field: keyof RoutineExercise, value: any) => {
    setNewRoutine(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
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
      <Ionicons name="add-circle" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );

  const renderRoutineExercise = ({ item, index }: { item: RoutineExercise; index: number }) => (
    <View style={styles.routineExerciseCard}>
      <View style={styles.routineExerciseHeader}>
        <Text style={styles.routineExerciseName}>
          {index + 1}. {item.exerciseName}
        </Text>
        <TouchableOpacity 
          onPress={() => removeExerciseFromRoutine(index)}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.danger} />
        </TouchableOpacity>
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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📝 Crear Mi Rutina</Text>
          <Text style={styles.subtitle}>
            Crea tu rutina personalizada con ejercicios disponibles
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>📋 Información de la Rutina</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre de la rutina"
            value={newRoutine.name}
            onChangeText={(value) => setNewRoutine(prev => ({ ...prev, name: value }))}
            placeholderTextColor={COLORS.gray}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción de la rutina"
            value={newRoutine.description}
            onChangeText={(value) => setNewRoutine(prev => ({ ...prev, description: value }))}
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={3}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Objetivo (ej: Desarrollo muscular del pecho)"
            value={newRoutine.objective}
            onChangeText={(value) => setNewRoutine(prev => ({ ...prev, objective: value }))}
            placeholderTextColor={COLORS.gray}
          />
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Nivel:</Text>
              <View style={styles.levelButtons}>
                {(['Principiante', 'Intermedio', 'Avanzado'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      newRoutine.level === level && styles.activeLevelButton
                    ]}
                    onPress={() => setNewRoutine(prev => ({ ...prev, level }))}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      newRoutine.level === level && styles.activeLevelButtonText
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Duración (min):</Text>
              <TextInput
                style={styles.input}
                value={newRoutine.estimatedDuration}
                onChangeText={(value) => setNewRoutine(prev => ({ ...prev, estimatedDuration: value }))}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>
        </View>



        {/* Exercises Section */}
        <View style={styles.exercisesContainer}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionTitle}>💪 Ejercicios ({newRoutine.exercises.length})</Text>
            <TouchableOpacity 
              style={styles.addExerciseButton}
              onPress={() => setShowExerciseModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addExerciseButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          
          {newRoutine.exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Ionicons name="fitness" size={50} color={COLORS.gray} />
              <Text style={styles.emptyExercisesText}>
                No hay ejercicios agregados
              </Text>
              <Text style={styles.emptyExercisesSubtext}>
                Toca "Agregar" para seleccionar ejercicios
              </Text>
            </View>
          ) : (
            <FlatList
              data={newRoutine.exercises}
              renderItem={renderRoutineExercise}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, (!newRoutine.name || !newRoutine.description || newRoutine.exercises.length === 0) && styles.disabledButton]} 
          onPress={handleCreateRoutine}
          disabled={!newRoutine.name || !newRoutine.description || newRoutine.exercises.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
          )}
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creando...' : 'Crear Mi Rutina'}
          </Text>
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
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={exercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              style={styles.exercisesList}
              showsVerticalScrollIndicator={false}
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 20,
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
  formContainer: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputLabel: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeLevelButton: {
    backgroundColor: COLORS.primary,
  },
  levelButtonText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    fontWeight: '600',
  },
  activeLevelButtonText: {
    color: COLORS.white,
  },
  exercisesContainer: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addExerciseButtonText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyExercises: {
    alignItems: 'center',
    padding: 30,
  },
  emptyExercisesText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 10,
    fontWeight: '600',
  },
  emptyExercisesSubtext: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 5,
    textAlign: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.lightGray,
    marginBottom: 8,
    borderRadius: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  exerciseDetails: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 2,
  },
  routineExerciseCard: {
    backgroundColor: COLORS.lightGray,
    padding: 18,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routineExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineExerciseName: {
    fontSize: SIZES.body + 1,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    padding: 5,
  },
  exerciseInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 2,
  },
  notesInput: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    fontSize: SIZES.small + 1,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gray,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    width: '90%',
    height: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  exercisesList: {
    flex: 1,
  },

});

export default CreateUserRoutineScreen; 