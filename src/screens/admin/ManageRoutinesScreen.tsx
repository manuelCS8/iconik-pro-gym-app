import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../utils/theme';

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  description: string;
  instructions: string;
  tips?: string;
  mediaType?: string;
  mediaURL?: string;
  isActive?: boolean;
}

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  series: number;
  reps: number;
  restTime: number; // en segundos
  order: number;
  notes?: string;
}

interface GymRoutine {
  id: string;
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: number; // en minutos
  exercises: RoutineExercise[];
  creatorType: 'GYM';
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  createdBy?: string;
  isActive: boolean;
}

interface NewRoutineForm {
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: string;
  exercises: RoutineExercise[];
}

const ManageRoutinesScreen: React.FC = () => {
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [filteredRoutines, setFilteredRoutines] = useState<GymRoutine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterLevel, setFilterLevel] = useState<'All' | 'Principiante' | 'Intermedio' | 'Avanzado'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<GymRoutine | null>(null);
  const [newRoutine, setNewRoutine] = useState<NewRoutineForm>({
    name: '',
    description: '',
    level: 'Principiante',
    objective: '',
    estimatedDuration: '60',
    exercises: [],
  });

  // Estados para selección de ejercicios
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);



  useEffect(() => {
    loadRoutines();
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [routines, searchText, filterLevel]);

  const loadExercises = async () => {
    try {
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const exercisesFromFirestore: Exercise[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          primaryMuscleGroups: data.primaryMuscleGroups || (data.muscleGroup ? [data.muscleGroup] : []),
          secondaryMuscleGroups: data.secondaryMuscleGroups || [],
          equipment: data.equipment || '',
          difficulty: data.difficulty || 'Principiante',
          description: data.description || '',
          instructions: data.instructions || '',
          tips: data.tips || '',
          mediaType: data.mediaType || '',
          mediaURL: data.mediaURL || '',
          isActive: data.isActive !== false,
        };
      });

      // Solo ejercicios activos
      const activeExercises = exercisesFromFirestore.filter(exercise => exercise.isActive);
      setAvailableExercises(activeExercises);
      console.log(`âœ… Cargados ${activeExercises.length} ejercicios activos para rutinas`);

    } catch (error) {
      console.error("Error loading exercises:", error);
      Alert.alert("Error", "No se pudieron cargar los ejercicios");
    }
  };

  const loadRoutines = async () => {
    try {
      setIsLoading(true);
      
      // Cargar rutinas reales de Firestore
      const routinesRef = collection(db, 'routines');
      const snapshot = await getDocs(routinesRef);
      
      const routinesFromFirestore: GymRoutine[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          description: data.description || '',
          level: data.level || 'Principiante',
          objective: data.objective || '',
          estimatedDuration: data.estimatedDuration || 60,
          exercises: data.exercises || [],
          creatorType: data.creatorType || 'GYM',
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || 'admin',
          isActive: data.isActive !== false,
        };
      });

      setRoutines(routinesFromFirestore);
      console.log(`âœ… Cargadas ${routinesFromFirestore.length} rutinas desde Firestore`);

    } catch (error) {
      console.error("Error loading routines:", error);
      Alert.alert("Error", "No se pudieron cargar las rutinas desde Firestore");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...routines];

    // Filtro por texto de bÃºsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(routine =>
        routine.name.toLowerCase().includes(search) ||
        routine.description.toLowerCase().includes(search) ||
        routine.objective.toLowerCase().includes(search)
      );
    }

    // Filtro por nivel
    if (filterLevel !== 'All') {
      filtered = filtered.filter(routine => routine.level === filterLevel);
    }

    setFilteredRoutines(filtered);
  };

  const getLevelColor = (level: GymRoutine['level']) => {
    switch (level) {
      case 'Principiante': return COLORS.success;
      case 'Intermedio': return COLORS.warning;
      case 'Avanzado': return COLORS.error;
      default: return COLORS.gray;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes} min`;
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
        creatorType: 'GYM',
        createdAt: serverTimestamp(),
        createdBy: 'admin',
        isActive: true,
        isPublic: true, // Hacer pública por defecto para que los miembros puedan verla
      };

      const docRef = await addDoc(collection(db, 'routines'), routineData);

      // Agregar a lista local
      const newRoutineData: GymRoutine = {
        id: docRef.id,
        ...routineData,
        createdAt: new Date(),
      };

      setRoutines(prev => [newRoutineData, ...prev]);
      setShowCreateModal(false);
      resetForm();

      Alert.alert("Éxito", "Rutina creada correctamente en Firestore");
      console.log("✅ Rutina creada en Firestore:", newRoutineData.name);

    } catch (error) {
      console.error("Error creating routine:", error);
      Alert.alert("Error", "No se pudo crear la rutina en Firestore");
    } finally {
      setIsLoading(false);
    }
  };



  const handleEditRoutine = (routine: GymRoutine) => {
    Alert.alert(
      "Editar Rutina",
      `¿Qué quieres hacer con "${routine.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Editar Información",
          onPress: () => {
            setEditingRoutine(routine);
            setNewRoutine({
              name: routine.name,
              description: routine.description,
              level: routine.level,
              objective: routine.objective,
              estimatedDuration: routine.estimatedDuration.toString(),
              exercises: routine.exercises || [],
            });
            setShowCreateModal(true);
          }
        },
        {
          text: "Gestionar Ejercicios",
          onPress: () => {
            Alert.alert(
              "Gestionar Ejercicios",
              "Esta funcionalidad abrirá una pantalla detallada para agregar/editar/reordenar ejercicios de la rutina.",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };

  const handleUpdateRoutine = async () => {
    if (!editingRoutine) return;

    try {
      setIsLoading(true);

      // Actualizar en Firestore
      const routineRef = doc(db, 'routines', editingRoutine.id);
      const updatedRoutineData = {
        name: newRoutine.name.trim(),
        description: newRoutine.description.trim(),
        level: newRoutine.level,
        objective: newRoutine.objective.trim(),
        estimatedDuration: parseInt(newRoutine.estimatedDuration) || 60,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(routineRef, updatedRoutineData);

      // Actualizar estado local
      const updatedRoutines = routines.map(routine =>
        routine.id === editingRoutine.id
          ? {
              ...routine,
              ...updatedRoutineData,
            }
          : routine
      );

      setRoutines(updatedRoutines);
      setEditingRoutine(null);
      setShowCreateModal(false);
      
      // Resetear formulario
      setNewRoutine({
        name: '',
        description: '',
        level: 'Principiante',
        objective: '',
        estimatedDuration: '60',
        exercises: [],
      });

      Alert.alert("Éxito", "Rutina actualizada correctamente en Firestore");
      console.log("✅ Rutina actualizada:", newRoutine.name);

    } catch (error) {
      console.error("Error updating routine:", error);
      Alert.alert("Error", "No se pudo actualizar la rutina en Firestore");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoutine = (routine: GymRoutine) => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Estás seguro de que quieres eliminar "${routine.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setRoutines(prev => prev.filter(r => r.id !== routine.id));
            Alert.alert("Éxito", `La rutina "${routine.name}" ha sido eliminada`);
            console.log("âŒ Rutina eliminada:", routine.name);
          }
        }
      ]
    );
  };

  const handleToggleActive = (routine: GymRoutine) => {
    const newStatus = !routine.isActive;
    const updatedRoutines = routines.map(r =>
      r.id === routine.id ? { ...r, isActive: newStatus } : r
    );
    setRoutines(updatedRoutines);
    
    Alert.alert(
      "Éxito",
      `Rutina "${routine.name}" ${newStatus ? 'activada' : 'desactivada'}`
    );
    console.log(`ðŸ”„ Rutina ${newStatus ? 'activada' : 'desactivada'}:`, routine.name);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadRoutines(), loadExercises()]);
    setIsRefreshing(false);
  };

  // Funciones para manejar ejercicios en rutinas
  const addExerciseToRoutine = (exercise: Exercise) => {
    const newRoutineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscleGroups: exercise.primaryMuscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      series: 3,
      reps: 12,
      restTime: 60, // 60 segundos por defecto
      order: newRoutine.exercises.length + 1,
      notes: '',
    };

    setNewRoutine(prev => ({
      ...prev,
      exercises: [...prev.exercises, newRoutineExercise]
    }));

    setShowExerciseSelector(false);
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

  const moveExerciseInRoutine = (fromIndex: number, toIndex: number) => {
    setNewRoutine(prev => {
      const exercises = [...prev.exercises];
      const [movedExercise] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, movedExercise);
      
      // Actualizar el orden
      const updatedExercises = exercises.map((exercise, index) => ({
        ...exercise,
        order: index + 1
      }));

      return {
        ...prev,
        exercises: updatedExercises
      };
    });
  };

  const resetForm = () => {
    setNewRoutine({
      name: '',
      description: '',
      level: 'Principiante',
      objective: '',
      estimatedDuration: '60',
      exercises: [],
    });
    setEditingRoutine(null);
  };

  const renderRoutine = ({ item }: { item: GymRoutine }) => (
    <View style={[styles.routineCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <View style={styles.routineTitleRow}>
            <Text style={styles.routineName}>{item.name}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
              <View style={styles.gymBadge}>
                <Text style={styles.gymBadgeText}>OFICIAL</Text>
              </View>
              {!item.isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>INACTIVA</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.routineDescription}>{item.description}</Text>
          
          <View style={styles.routineStats}>
            <View style={styles.statItem}>
              <Ionicons name="flag" size={16} color={COLORS.primary} />
              <Text style={styles.statText}>{item.objective}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.statText}>{formatDuration(item.estimatedDuration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="fitness" size={16} color={COLORS.primary} />
              <Text style={styles.statText}>{item.exercises ? item.exercises.length : 0} ejercicios</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.routineActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.isActive ? COLORS.warning : COLORS.success }]}
          onPress={() => handleToggleActive(item)}
        >
          <Ionicons 
            name={item.isActive ? "pause" : "play"} 
            size={16} 
            color={COLORS.white} 
          />
          <Text style={styles.actionButtonText}>
            {item.isActive ? "Desactivar" : "Activar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.info }]}
          onPress={() => handleEditRoutine(item)}
        >
          <Ionicons name="create" size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
          onPress={() => handleDeleteRoutine(item)}
        >
          <Ionicons name="trash" size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de ejercicios */}
      {item.exercises && item.exercises.length > 0 && (
        <View style={styles.exercisesPreview}>
          <Text style={styles.exercisesTitle}>Ejercicios:</Text>
          {item.exercises.slice(0, 3).map((exercise, index) => (
            <Text key={index} style={styles.exerciseItem}>
              {exercise.order}. {exercise.exerciseName} - {exercise.series}x{exercise.reps}
            </Text>
          ))}
          {item.exercises.length > 3 && (
            <Text style={styles.moreExercises}>
              y {item.exercises.length - 3} más...
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Rutinas Oficiales</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filtros y bÃºsqueda */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar rutinas..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.gray}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterTags}
        >
          <TouchableOpacity 
            style={[styles.filterTag, filterLevel === 'All' && styles.activeFilterTag]}
            onPress={() => setFilterLevel('All')}
          >
            <Text style={[styles.filterTagText, filterLevel === 'All' && styles.activeFilterTagText]}>
              Todas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTag, filterLevel === 'Principiante' && styles.activeFilterTag]}
            onPress={() => setFilterLevel('Principiante')}
          >
            <Text style={[styles.filterTagText, filterLevel === 'Principiante' && styles.activeFilterTagText]}>
              Principiante
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTag, filterLevel === 'Intermedio' && styles.activeFilterTag]}
            onPress={() => setFilterLevel('Intermedio')}
          >
            <Text style={[styles.filterTagText, filterLevel === 'Intermedio' && styles.activeFilterTagText]}>
              Intermedio
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTag, filterLevel === 'Avanzado' && styles.activeFilterTag]}
            onPress={() => setFilterLevel('Avanzado')}
          >
            <Text style={[styles.filterTagText, filterLevel === 'Avanzado' && styles.activeFilterTagText]}>
              Avanzado
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <Text style={styles.resultsText}>
        {filteredRoutines.length} rutina{filteredRoutines.length !== 1 ? 's' : ''} oficial{filteredRoutines.length !== 1 ? 'es' : ''}
      </Text>
    </View>

    {/* Lista de rutinas */}
    <FlatList
      data={filteredRoutines}
      renderItem={renderRoutine}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      // Remover RefreshControl temporalmente para evitar el error de texto suelto
      // refreshControl={
      //   <RefreshControl 
      //     refreshing={isRefreshing} 
      //     onRefresh={onRefresh}
      //     colors={[COLORS.primary]}
      //     tintColor={COLORS.primary}
      //   />
      // }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>No se encontraron rutinas</Text>
          <Text style={styles.emptySubtext}>
            {searchText ? "Prueba con otros tÃ©rminos de bÃºsqueda" : "Agrega la primera rutina"}
          </Text>
        </View>
      }
    />

    {/* Modal para crear/editar rutina */}
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowCreateModal(false);
            setEditingRoutine(null);
            setNewRoutine({
              name: '',
              description: '',
              level: 'Principiante',
              objective: '',
              estimatedDuration: '60',
              exercises: [],
            });
          }}>
            <Ionicons name="close" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingRoutine ? "Editar Rutina Oficial" : "Crear Rutina Oficial"}
          </Text>
          <TouchableOpacity 
            onPress={editingRoutine ? handleUpdateRoutine : handleCreateRoutine}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.disabledButton]}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Guardando..." : editingRoutine ? "Actualizar" : "Crear"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nombre de la Rutina *</Text>
            <TextInput
              style={styles.formInput}
              value={newRoutine.name}
              onChangeText={(text) => setNewRoutine(prev => ({ ...prev, name: text }))}
              placeholder="Ej: Pecho y Tríceps Avanzado"
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={newRoutine.description}
              onChangeText={(text) => setNewRoutine(prev => ({ ...prev, description: text }))}
              placeholder="Describe los objetivos y características de esta rutina..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nivel de Dificultad</Text>
            <View style={styles.levelSelector}>
              {(['Principiante', 'Intermedio', 'Avanzado'] as const).map((level) => (
                <TouchableOpacity 
                  key={level}
                  style={[
                    styles.levelOption, 
                    newRoutine.level === level && styles.activeLevelOption,
                    { backgroundColor: newRoutine.level === level ? getLevelColor(level) : COLORS.grayLight }
                  ]}
                  onPress={() => setNewRoutine(prev => ({ ...prev, level }))}
                >
                  <Text style={[
                    styles.levelOptionText, 
                    newRoutine.level === level && styles.activeLevelOptionText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Objetivo Principal</Text>
            <TextInput
              style={styles.formInput}
              value={newRoutine.objective}
              onChangeText={(text) => setNewRoutine(prev => ({ ...prev, objective: text }))}
              placeholder="Ej: Desarrollo muscular, Fuerza, Resistencia"
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Duración Estimada (minutos)</Text>
            <TextInput
              style={styles.formInput}
              value={newRoutine.estimatedDuration}
              onChangeText={(text) => setNewRoutine(prev => ({ ...prev, estimatedDuration: text }))}
              placeholder="60"
              placeholderTextColor={COLORS.gray}
              keyboardType="numeric"
            />
          </View>

          {/* SecciÃ³n de Ejercicios */}
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.formLabel}>Ejercicios de la Rutina *</Text>
              <TouchableOpacity 
                style={styles.addExerciseButton}
                onPress={() => setShowExerciseSelector(true)}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.addExerciseButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.exerciseCount}>
              {newRoutine.exercises.length} ejercicio{newRoutine.exercises.length !== 1 ? 's' : ''} agregado{newRoutine.exercises.length !== 1 ? 's' : ''}
            </Text>

            {/* Lista de ejercicios */}
            {newRoutine.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.primaryMuscleGroups.join(', ')} • {exercise.equipment}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeExerciseFromRoutine(index)}
                  >
                    <Ionicons name="trash" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.exerciseConfig}>
                  <View style={styles.configRow}>
                    <View style={styles.configItem}>
                      <Text style={styles.configLabel}>Series</Text>
                      <TextInput
                        style={styles.configInput}
                        value={exercise.series.toString()}
                        onChangeText={(text) => updateExerciseInRoutine(index, 'series', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.gray}
                      />
                    </View>
                    <View style={styles.configItem}>
                      <Text style={styles.configLabel}>Reps</Text>
                      <TextInput
                        style={styles.configInput}
                        value={exercise.reps.toString()}
                        onChangeText={(text) => updateExerciseInRoutine(index, 'reps', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.gray}
                      />
                    </View>
                    <View style={styles.configItem}>
                      <Text style={styles.configLabel}>Descanso (seg)</Text>
                      <TextInput
                        style={styles.configInput}
                        value={exercise.restTime.toString()}
                        onChangeText={(text) => updateExerciseInRoutine(index, 'restTime', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.gray}
                      />
                    </View>
                  </View>
                  
                  <TextInput
                    style={styles.notesInput}
                    value={exercise.notes || ''}
                    onChangeText={(text) => updateExerciseInRoutine(index, 'notes', text)}
                    placeholder="Notas adicionales (opcional)"
                    placeholderTextColor={COLORS.gray}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ))}

            {newRoutine.exercises.length === 0 && (
              <View style={styles.emptyExercises}>
                <Ionicons name="fitness-outline" size={48} color={COLORS.gray} />
                <Text style={styles.emptyExercisesText}>No hay ejercicios agregados</Text>
                <Text style={styles.emptyExercisesSubtext}>
                  Presiona "Agregar" para seleccionar ejercicios de la base de datos
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>

    {/* Modal para seleccionar ejercicios */}
    <Modal
      visible={showExerciseSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowExerciseSelector(false)}>
            <Ionicons name="close" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicios..."
            placeholderTextColor={COLORS.gray}
          />
        </View>
        
        <FlatList
          data={availableExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.exerciseOption}
              onPress={() => addExerciseToRoutine(item)}
            >
              <View style={styles.exerciseOptionInfo}>
                <Text style={styles.exerciseOptionName}>{item.name}</Text>
                <Text style={styles.exerciseOptionDetails}>
                  {item.primaryMuscleGroups.join(', ')} • {item.equipment} • {item.difficulty}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          style={styles.exerciseList}
        />
      </View>
    </Modal>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#181818',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding / 2,
  },
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },

  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  filtersContainer: {
    marginBottom: SIZES.padding,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding / 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.padding / 2,
    fontSize: SIZES.fontRegular,
    color: '#fff',
    backgroundColor: '#181818',
  },
  filterTags: {
    flexDirection: 'row',
  },
  filterTag: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: '#222',
    borderRadius: SIZES.radius,
    marginRight: SIZES.padding / 2,
  },
  activeFilterTag: {
    backgroundColor: '#ff4444',
  },
  filterTagText: {
    fontSize: SIZES.fontSmall,
    color: '#ccc',
    fontWeight: '600',
  },
  activeFilterTagText: {
    color: '#fff',
  },
  resultsText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: SIZES.padding / 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.padding,
  },
  routineCard: {
    backgroundColor: '#181818',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  routineHeader: {
    marginBottom: SIZES.padding,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding / 2,
  },
  routineName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: SIZES.padding / 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  levelText: {
    fontSize: SIZES.fontSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  gymBadge: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 4,
    marginBottom: 4,
  },
  gymBadgeText: {
    fontSize: SIZES.fontSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  inactiveBadge: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginBottom: 4,
  },
  inactiveText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  routineDescription: {
    fontSize: SIZES.fontRegular,
    color: '#ccc',
    marginBottom: SIZES.padding / 2,
    lineHeight: 20,
  },
  routineStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding,
    marginBottom: 4,
  },
  statText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginLeft: 4,
  },
  routineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding / 2,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  exercisesPreview: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: SIZES.padding / 2,
  },
  exercisesTitle: {
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  exerciseItem: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 2,
  },
  moreExercises: {
    fontSize: SIZES.fontSmall,
    color: COLORS.info,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyText: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  emptySubtext: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  formGroup: {
    marginBottom: SIZES.padding,
  },
  formLabel: {
    fontSize: SIZES.fontRegular,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.padding / 2,
  },
  formInput: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    fontSize: SIZES.fontRegular,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  levelSelector: {
    flexDirection: 'row',
  },
  levelOption: {
    flex: 1,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginRight: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  activeLevelOption: {
    // Color dinÃ¡mico aplicado inline
  },
  levelOptionText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  activeLevelOptionText: {
    color: COLORS.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.grayLight,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginLeft: SIZES.padding / 2,
    lineHeight: 18,
  },
  // Estilos para gestiÃ³n de ejercicios
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: SIZES.padding / 3,
    borderRadius: SIZES.radius,
  },
  addExerciseButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  exerciseCount: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  exerciseItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
  removeButton: {
    padding: 4,
  },
  exerciseConfig: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: SIZES.padding,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  configItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  configLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 4,
  },
  configInput: {
    backgroundColor: COLORS.grayLight,
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius / 2,
    fontSize: SIZES.fontSmall,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: COLORS.grayLight,
    padding: SIZES.padding,
    borderRadius: SIZES.radius / 2,
    fontSize: SIZES.fontSmall + 1,
    color: COLORS.secondary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  emptyExercises: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingLarge,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
  },
  emptyExercisesText: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  emptyExercisesSubtext: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  // Estilos para selector de ejercicios
  exerciseList: {
    flex: 1,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    backgroundColor: COLORS.white,
  },
  exerciseOptionInfo: {
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  exerciseOptionDetails: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
  },
});

export default ManageRoutinesScreen;