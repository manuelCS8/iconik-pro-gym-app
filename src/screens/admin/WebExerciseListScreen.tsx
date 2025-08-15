import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../utils/theme';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  instructions: string;
  mediaURL?: string;
  mediaType?: string;
  createdAt: any;
  isActive?: boolean;
}

const WebExerciseListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const muscleGroups = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 
    'Antebrazos', 'Piernas', 'Glúteos', 'Abdominales', 
    'Pantorrillas', 'Cardio', 'Otros'
  ];

  const difficulties = [
    'beginner', 'intermediate', 'advanced'
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, searchText, filterMuscle, filterDifficulty]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const exercisesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];

      // Ordenar por fecha de creación (más recientes primero)
      exercisesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setExercises(exercisesData);
      console.log(`✅ Cargados ${exercisesData.length} ejercicios desde Firestore`);
    } catch (error) {
      console.error('❌ Error cargando ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = exercises;

    // Filtro por búsqueda
    if (searchText.trim()) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchText.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtro por grupo muscular
    if (filterMuscle !== 'All') {
      filtered = filtered.filter(exercise =>
        exercise.muscleGroup === filterMuscle
      );
    }

    // Filtro por dificultad
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(exercise =>
        exercise.difficulty === filterDifficulty
      );
    }

    setFilteredExercises(filtered);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar "${exercise.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteExercise(exercise.id) }
      ]
    );
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      await deleteDoc(doc(db, 'exercises', exerciseId));
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
      Alert.alert('Éxito', 'Ejercicio eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      Alert.alert('Error', 'No se pudo eliminar el ejercicio');
    }
  };

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      await updateDoc(doc(db, 'exercises', exercise.id), {
        isActive: !exercise.isActive
      });
      
      setExercises(exercises.map(ex => 
        ex.id === exercise.id 
          ? { ...ex, isActive: !ex.isActive }
          : ex
      ));
    } catch (error) {
      console.error('Error actualizando ejercicio:', error);
      Alert.alert('Error', 'No se pudo actualizar el ejercicio');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadExercises();
    setIsRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return difficulty;
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={[styles.exerciseCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={styles.exerciseMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>
                {getDifficultyText(item.difficulty)}
              </Text>
            </View>
            {item.muscleGroup && (
              <View style={styles.muscleBadge}>
                <Text style={styles.muscleText}>{item.muscleGroup}</Text>
              </View>
            )}
          </View>
        </View>
        
        {item.mediaURL && (
          <View style={styles.mediaPreview}>
            {item.mediaType?.startsWith('image/') ? (
              <Image 
                source={{ uri: item.mediaURL }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoPreview}>
                <Ionicons name="videocam" size={24} color="#666" />
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={styles.exerciseDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.isActive ? '#FF9800' : '#4CAF50' }]}
          onPress={() => handleToggleActive(item)}
        >
          <Ionicons 
            name={item.isActive ? "pause" : "play"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>
            {item.isActive ? 'Pausar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('WebExerciseUpload', { exerciseId: item.id });
          }}
        >
          <Ionicons name="create" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => handleDeleteExercise(item)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>📋 Lista de Ejercicios (Web)</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('WebExerciseUpload');
            }}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicios..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#666"
          />
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Grupo Muscular:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[styles.filterOption, filterMuscle === 'All' && styles.activeFilterOption]}
                onPress={() => setFilterMuscle('All')}
              >
                <Text style={[styles.filterOptionText, filterMuscle === 'All' && styles.activeFilterOptionText]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity 
                  key={muscle}
                  style={[styles.filterOption, filterMuscle === muscle && styles.activeFilterOption]}
                  onPress={() => setFilterMuscle(muscle)}
                >
                  <Text style={[styles.filterOptionText, filterMuscle === muscle && styles.activeFilterOptionText]}>
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Dificultad:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[styles.filterOption, filterDifficulty === 'All' && styles.activeFilterOption]}
                onPress={() => setFilterDifficulty('All')}
              >
                <Text style={[styles.filterOptionText, filterDifficulty === 'All' && styles.activeFilterOptionText]}>
                  Todas
                </Text>
              </TouchableOpacity>
              {difficulties.map((diff) => (
                <TouchableOpacity 
                  key={diff}
                  style={[styles.filterOption, filterDifficulty === diff && styles.activeFilterOption]}
                  onPress={() => setFilterDifficulty(diff)}
                >
                  <Text style={[styles.filterOptionText, filterDifficulty === diff && styles.activeFilterOptionText]}>
                    {getDifficultyText(diff)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.resultsText}>
          {filteredExercises.length} ejercicios encontrados
        </Text>
      </View>

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#E31C1F']}
            tintColor="#E31C1F"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#181818',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31C1F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#222',
    borderRadius: 16,
  },
  activeFilterOption: {
    backgroundColor: '#E31C1F',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#ccc',
  },
  activeFilterOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inactiveCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  muscleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  muscleText: {
    fontSize: 12,
    color: '#ccc',
  },
  mediaPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default WebExerciseListScreen; 