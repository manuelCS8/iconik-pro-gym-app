import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { COLORS, SIZES } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { UserRoutineExercise } from "../../redux/slices/userRoutinesSlice";
import userRoutineService from "../../services/userRoutineService";
import { addRoutine, setLoading, setError } from "../../redux/slices/userRoutinesSlice";
import ExerciseCard from "../../components/routine/ExerciseCard";

const CreateRoutineScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.userRoutines);
  
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fuerza");
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [duration, setDuration] = useState("45");
  const [exercises, setExercises] = useState<UserRoutineExercise[]>([]);

  const categories = ["Fuerza", "Cardio", "Flexibilidad", "Hipertrofia", "Pérdida de Peso", "Funcional"];
  const difficulties = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' }
  ];

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para la rutina");
      return;
    }

    if (!uid) {
      Alert.alert("Error", "Usuario no autenticado");
      return;
    }

    dispatch(setLoading(true));
    try {
      const routineData = {
        name: routineName.trim(),
        description: description.trim(),
        category,
        difficulty,
        duration: parseInt(duration) || 45,
        exercises,
        isPublic: false
      };

      const routineId = await userRoutineService.createUserRoutine(uid, routineData);
      
      const newRoutine = {
        id: routineId,
        ...routineData,
        createdBy: uid,
        createdAt: new Date().toISOString(), // Convertir a string ISO para Redux
        isActive: true,
        isPublic: false
      };

      dispatch(addRoutine(newRoutine));

      Alert.alert(
        "¡Rutina Creada!", 
        `Rutina "${routineName}" creada exitosamente. Serás redirigido a la pantalla principal.`,
        [
          {
            text: "OK",
            onPress: () => {
              console.log('🔄 Regresando a pantalla principal después de crear rutina');
              navigation.navigate('EntrenarHome');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating routine:', error);
      dispatch(setError('Error al crear la rutina'));
      Alert.alert("Error", "No se pudo crear la rutina. Intenta de nuevo.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAddExercise = () => {
    console.log('🔄 Navegando a lista de ejercicios...');
    navigation.navigate('ExercisesList', {
      onExerciseSelect: (exercise: any) => {
        console.log('✅ Ejercicio seleccionado en CreateRoutine:', exercise.name);
        
        // Crear ejercicio con valores por defecto
        const defaultExercise: UserRoutineExercise = {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: 3,
          reps: 12,
          weight: 0,
          restTime: 60,
          notes: ''
        };
        
        console.log('✅ Ejercicio agregado con valores por defecto:', defaultExercise);
        setExercises([...exercises, defaultExercise]);
        
        // Mostrar mensaje de confirmación
        Alert.alert(
          "Ejercicio Agregado",
          `${exercise.name} agregado a la rutina con valores por defecto (3x12). Puedes editarlo después.`,
          [{ text: "OK" }]
        );
      }
    });
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleEditExercise = (index: number, exercise: UserRoutineExercise) => {
    navigation.navigate('ConfigureExercise', {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      initialValues: {
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight || 0,
        restTime: exercise.restTime,
        notes: exercise.notes || ''
      },
      onExerciseConfigured: (configuredExercise: UserRoutineExercise) => {
        const newExercises = [...exercises];
        newExercises[index] = configuredExercise;
        setExercises(newExercises);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Rutina</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButton}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              style={styles.input}
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Ej: Rutina de Fuerza"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe tu rutina..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Categoría */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.optionsContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionButton,
                    category === cat && styles.optionButtonSelected
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.optionText,
                    category === cat && styles.optionTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dificultad */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dificultad</Text>
            <View style={styles.optionsContainer}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.value}
                  style={[
                    styles.optionButton,
                    difficulty === diff.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setDifficulty(diff.value)}
                >
                  <Text style={[
                    styles.optionText,
                    difficulty === diff.value && styles.optionTextSelected
                  ]}>
                    {diff.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duración */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Duración (minutos)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="45"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Ejercicios */}
          <View style={styles.exercisesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ejercicios ({exercises.length})</Text>
              <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addExerciseText}>Agregar</Text>
              </TouchableOpacity>
            </View>
            
            {exercises.length === 0 ? (
              <View style={styles.placeholder}>
                <Ionicons name="fitness-outline" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>No hay ejercicios agregados</Text>
                <Text style={styles.placeholderSubtext}>
                  Toca "Agregar" para seleccionar ejercicios
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={index}
                    exercise={exercise}
                    index={index}
                    onEdit={handleEditExercise}
                    onRemove={handleRemoveExercise}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRoutineScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    fontSize: 16,
    color: '#E31C1F',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  exercisesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  placeholder: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 15,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addExerciseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addExerciseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exercisesList: {
    gap: 8,
  },
  exerciseItem: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  exerciseDetailText: {
    fontSize: 14,
    color: '#ccc',
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editExerciseButton: {
    padding: 8,
  },
  removeExerciseButton: {
    padding: 8,
  },
}); 