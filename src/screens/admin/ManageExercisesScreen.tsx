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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SIZES } from '../../utils/theme';
import RoleGuard from '../../components/RoleGuard';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { uploadFile, generateStoragePath, validateFile } from '../../services/storage';

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[]; // Grupos musculares principales (1-3)
  secondaryMuscleGroups: string[]; // Grupos musculares secundarios (1-3)
  equipment: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string; // Descripción corta del ejercicio
  instructions: string; // Instrucciones paso a paso
  tips?: string;
  mediaType?: string;
  mediaURL?: string;
  imageURL?: string; // Campo para URLs públicas de imágenes
  thumbnailURL?: string; // Nuevo campo para thumbnails
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  createdBy?: string;
  isActive?: boolean;
}

interface NewExerciseForm {
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipment: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  instructions: string;
  tips: string;
}

const ManageExercisesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [filterEquipment, setFilterEquipment] = useState<string>('All');
  // Ordenamiento automático alfabético
  const sortOrder = 'name';
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newExercise, setNewExercise] = useState<NewExerciseForm>({
    name: '',
    primaryMuscleGroups: [],
    secondaryMuscleGroups: [],
    equipment: '',
    difficulty: 'Principiante',
    description: '',
    instructions: '',
    tips: '',
  });
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<{ uri: string; name: string }>({ uri: '', name: '' });
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');

  // Opciones para dropdowns
  const muscleGroups = [
    'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 
    'Glúteos', 'Pantorrillas', 'Cardio', 'Funcional',
    // Agregando grupos musculares adicionales basados en la imagen
    'Abdominales', 'Abductores', 'Antebrazos', 'Bíceps', 'Cuádriceps', 
    'Dorsales', 'Isquiotibiales', 'Lumbares', 'Trapecios', 'Tríceps'
  ];

  const equipmentOptions = [
    'Peso libre', 'Máquina', 'Calistenia', 'Cardio', 'Cable', 'Funcional',
    'Barra', 'Mancuernas', 'Disco', 'Bandas de resistencia', 'Peso rusa', 
    'Barra Z', 'Banda suspendida', 'Ninguno', 'Poleas'
  ];

  const difficultyLevels: Array<'Principiante' | 'Intermedio' | 'Avanzado'> = [
    'Principiante', 'Intermedio', 'Avanzado'
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, searchText, filterMuscle, filterDifficulty, filterEquipment]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      
      // Cargar ejercicios reales de Firestore
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
          imageURL: data.imageURL || '',
          thumbnailURL: data.thumbnailURL || '',
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || '',
          isActive: data.isActive !== false, // Por defecto true si no está definido
        };
      });

      setExercises(exercisesFromFirestore);
      console.log(`✅ Cargados ${exercisesFromFirestore.length} ejercicios desde Firestore`);

    } catch (error) {
      console.error("Error loading exercises:", error);
      Alert.alert("Error", "No se pudieron cargar los ejercicios desde Firestore");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Filtro por texto de búsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(search) ||
        exercise.primaryMuscleGroups.some(muscle => muscle.toLowerCase().includes(search)) ||
        exercise.secondaryMuscleGroups.some(muscle => muscle.toLowerCase().includes(search)) ||
        exercise.equipment.toLowerCase().includes(search)
      );
    }

    // Filtro por grupo muscular
    if (filterMuscle !== 'All') {
      filtered = filtered.filter(exercise => 
        exercise.primaryMuscleGroups.includes(filterMuscle) || 
        exercise.secondaryMuscleGroups.includes(filterMuscle)
      );
    }

    // Filtro por dificultad
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(exercise => exercise.difficulty === filterDifficulty);
    }

    // Filtro por tipo de equipo
    if (filterEquipment !== 'All') {
      filtered = filtered.filter(exercise => exercise.equipment === filterEquipment);
    }

    // Ordenamiento alfabético automático
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredExercises(filtered);
  };

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'Principiante': return COLORS.success;
      case 'Intermedio': return COLORS.warning;
      case 'Avanzado': return COLORS.danger;
      default: return COLORS.gray;
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permiso requerido", "Se necesita acceso a la galería para seleccionar imágenes.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validar tamaño (5MB máximo)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Archivo muy grande", "La imagen no puede ser mayor a 5MB");
          return;
        }
        
        setSelectedImage(asset.uri);
        Alert.alert("Éxito", "Imagen seleccionada correctamente");
      }
    } catch (error: any) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validar tamaño (50MB máximo)
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert("Archivo muy grande", "El video no puede ser mayor a 50MB");
          return;
        }
        
        setSelectedVideo({ uri: asset.uri, name: asset.name || "video.mp4" });
        Alert.alert("Éxito", "Video seleccionado correctamente");
      }
    } catch (error: any) {
      console.error("Error al seleccionar video:", error);
      Alert.alert("Error", "No se pudo seleccionar el video");
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedThumbnail(result.assets[0].uri);
        console.log('Thumbnail seleccionado');
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert("Error", "No se pudo seleccionar el thumbnail");
    }
  };

  const handleCreateExercise = async () => {
    try {
      if (!newExercise.name.trim() || newExercise.primaryMuscleGroups.length === 0 || !newExercise.equipment || !newExercise.description.trim() || !newExercise.instructions.trim()) {
        Alert.alert("Error", "Por favor completa todos los campos obligatorios");
        return;
      }

      setIsUploading(true);

      // Variables para URLs de archivos subidos
      let mediaURL = '';
      let thumbnailURL = '';
      let imageURL = '';

      // Subir video si existe
      if (selectedVideo.uri) {
        try {
          const videoFileName = selectedVideo.name || `video_${Date.now()}.mp4`;
          const videoPath = generateStoragePath(videoFileName, 'exercises/videos');
          
          const videoResult = await uploadFile(selectedVideo.uri, videoPath, (progress) => {
            console.log(`Subiendo video: ${progress.percent.toFixed(1)}%`);
          });
          
          mediaURL = videoResult.url;
          console.log("✅ Video subido a Firebase Storage:", mediaURL);
        } catch (error) {
          console.error("Error subiendo video:", error);
          Alert.alert("Error", "No se pudo subir el video a Firebase Storage");
          return;
        }
      }

      // Subir imagen si existe
      if (selectedImage) {
        try {
          const imageFileName = `image_${Date.now()}.jpg`;
          const imagePath = generateStoragePath(imageFileName, 'exercises/images');
          
          const imageResult = await uploadFile(selectedImage, imagePath, (progress) => {
            console.log(`Subiendo imagen: ${progress.percent.toFixed(1)}%`);
          });
          
          mediaURL = imageResult.url;
          imageURL = imageResult.url; // También guardar en imageURL para compatibilidad
          console.log("✅ Imagen subida a Firebase Storage:", mediaURL);
        } catch (error) {
          console.error("Error subiendo imagen:", error);
          Alert.alert("Error", "No se pudo subir la imagen a Firebase Storage");
          return;
        }
      }

      // Subir thumbnail si existe
      if (selectedThumbnail) {
        try {
          const thumbnailFileName = `thumbnail_${Date.now()}.jpg`;
          const thumbnailPath = generateStoragePath(thumbnailFileName, 'exercises/thumbnails');
          
          const thumbnailResult = await uploadFile(selectedThumbnail, thumbnailPath, (progress) => {
            console.log(`Subiendo thumbnail: ${progress.percent.toFixed(1)}%`);
          });
          
          thumbnailURL = thumbnailResult.url;
          console.log("✅ Thumbnail subido a Firebase Storage:", thumbnailURL);
        } catch (error) {
          console.error("Error subiendo thumbnail:", error);
          Alert.alert("Error", "No se pudo subir el thumbnail a Firebase Storage");
          return;
        }
      }

      // Crear ejercicio en Firestore con URLs públicas
      const exerciseData = {
        name: newExercise.name.trim(),
        primaryMuscleGroups: newExercise.primaryMuscleGroups,
        secondaryMuscleGroups: newExercise.secondaryMuscleGroups,
        equipment: newExercise.equipment,
        difficulty: newExercise.difficulty,
        description: newExercise.description.trim(),
        instructions: newExercise.instructions.trim(),
        tips: newExercise.tips.trim() || '',
        mediaType: selectedVideo.uri ? 'video' : selectedImage ? 'image' : '',
        mediaURL: mediaURL, // URL pública de Firebase Storage
        imageURL: imageURL, // URL pública de imagen para compatibilidad
        thumbnailURL: thumbnailURL, // URL pública de Firebase Storage
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin', // TODO: Obtener el UID del admin actual
        isActive: true,
      };

      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
      
      // Agregar a la lista local con el ID generado
      const newExerciseData: Exercise = {
        id: docRef.id,
        ...exerciseData,
        createdAt: new Date(),
      };

      setExercises(prev => [...prev, newExerciseData]);
      
      // Resetear formulario y cerrar modal
      resetForm();
      setShowCreateModal(false);

      Alert.alert("Éxito", `Ejercicio "${newExerciseData.name}" creado correctamente con media subido a Firebase Storage`);
      console.log("✅ Nuevo ejercicio creado en Firestore con URLs públicas:", newExerciseData.name);

    } catch (error) {
      console.error("Error creating exercise:", error);
      Alert.alert("Error", "No se pudo crear el ejercicio en Firestore");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;

    try {
      setIsUploading(true);

      // Actualizar en Firestore
      const exerciseRef = doc(db, 'exercises', editingExercise.id);
      const updateData = {
        name: newExercise.name.trim(),
        primaryMuscleGroups: newExercise.primaryMuscleGroups,
        secondaryMuscleGroups: newExercise.secondaryMuscleGroups,
        equipment: newExercise.equipment,
        difficulty: newExercise.difficulty,
        description: newExercise.description.trim(),
        instructions: newExercise.instructions.trim(),
        tips: newExercise.tips.trim() || '',
        updatedAt: serverTimestamp(),
        // Solo actualizar media si se seleccionaron nuevos archivos
        ...(selectedImage && { mediaType: 'image', mediaURL: selectedImage }),
        ...(selectedVideo.uri && { mediaType: 'video', mediaURL: selectedVideo.uri }),
      };

      await updateDoc(exerciseRef, updateData);

      // Actualizar lista local
      const updatedExercises = exercises.map(exercise =>
        exercise.id === editingExercise.id
          ? {
              ...exercise,
              ...updateData,
              updatedAt: new Date(),
            }
          : exercise
      );

      setExercises(updatedExercises);
      setEditingExercise(null);
      resetForm();
      setShowCreateModal(false);

      Alert.alert("Éxito", "Ejercicio actualizado correctamente en Firestore");
      console.log("✅ Ejercicio actualizado en Firestore:", newExercise.name);

    } catch (error) {
      console.error("Error updating exercise:", error);
      Alert.alert("Error", "No se pudo actualizar el ejercicio en Firestore");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      primaryMuscleGroups: exercise.primaryMuscleGroups,
      secondaryMuscleGroups: exercise.secondaryMuscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      description: exercise.description,
      instructions: exercise.instructions,
      tips: exercise.tips || '',
    });
    setSelectedImage(''); // No pre-cargar imagen existente
    setSelectedVideo({ uri: '', name: '' }); // No pre-cargar video existente
    setShowCreateModal(true);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    Alert.alert(
      "Eliminar Ejercicio",
      `¿Estás seguro de que quieres eliminar "${exercise.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Eliminar de Firestore
              await deleteDoc(doc(db, 'exercises', exercise.id));
              
              // Eliminar de lista local
              setExercises(prev => prev.filter(ex => ex.id !== exercise.id));
              Alert.alert("Éxito", `El ejercicio "${exercise.name}" ha sido eliminado de Firestore`);
              console.log("❌ Ejercicio eliminado de Firestore:", exercise.name);
            } catch (error) {
              console.error("Error deleting exercise:", error);
              Alert.alert("Error", "No se pudo eliminar el ejercicio de Firestore");
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      const newStatus = !exercise.isActive;
      
      // Actualizar en Firestore
      const exerciseRef = doc(db, 'exercises', exercise.id);
      await updateDoc(exerciseRef, { 
        isActive: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar lista local
      const updatedExercises = exercises.map(ex =>
        ex.id === exercise.id ? { ...ex, isActive: newStatus } : ex
      );
      setExercises(updatedExercises);
      
      Alert.alert(
        "Éxito",
        `Ejercicio "${exercise.name}" ${newStatus ? 'activado' : 'desactivado'} en Firestore`
      );
      console.log(`🔄 Ejercicio ${newStatus ? 'activado' : 'desactivado'} en Firestore:`, exercise.name);
    } catch (error) {
      console.error("Error toggling exercise status:", error);
      Alert.alert("Error", "No se pudo cambiar el estado del ejercicio");
    }
  };

  const resetForm = () => {
    setNewExercise({
      name: '',
      primaryMuscleGroups: [],
      secondaryMuscleGroups: [],
      equipment: '',
      difficulty: 'Principiante',
      description: '',
      instructions: '',
      tips: '',
    });
    setSelectedImage('');
    setSelectedVideo({ uri: '', name: '' });
    setSelectedThumbnail('');
    setEditingExercise(null);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadExercises();
    setIsRefreshing(false);
  };

  // Funciones para manejar selección múltiple de grupos musculares
  const togglePrimaryMuscleGroup = (muscle: string) => {
    setNewExercise(prev => {
      const current = prev.primaryMuscleGroups;
      const updated = current.includes(muscle) 
        ? current.filter(m => m !== muscle)
        : current.length < 3 
          ? [...current, muscle]
          : current;
      return { ...prev, primaryMuscleGroups: updated };
    });
  };

  const toggleSecondaryMuscleGroup = (muscle: string) => {
    setNewExercise(prev => {
      const current = prev.secondaryMuscleGroups;
      const updated = current.includes(muscle) 
        ? current.filter(m => m !== muscle)
        : current.length < 3 
          ? [...current, muscle]
          : current;
      return { ...prev, secondaryMuscleGroups: updated };
    });
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={[styles.exerciseCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        {item.thumbnailURL ? (
          <Image source={{ uri: item.thumbnailURL }} style={styles.thumbnail} />
        ) : item.mediaURL && item.mediaType === 'image' ? (
          <Image source={{ uri: item.mediaURL }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="fitness" size={32} color={COLORS.gray} />
          </View>
        )}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.muscleBadge}>
              <Text style={styles.badgeText}>{item.primaryMuscleGroups.join(', ')}</Text>
            </View>
            <View style={styles.equipmentBadge}>
              <Text style={styles.badgeText}>{item.equipment}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.badgeText}>{item.difficulty}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.badgeText}>INACTIVO</Text>
              </View>
            )}
          </View>
          <Text style={styles.instructions} numberOfLines={2}>
            {item.description || item.instructions} {/* Usar description o instructions */}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.isActive ? COLORS.warning : COLORS.success }]}
          onPress={() => handleToggleActive(item)}
        >
          <Ionicons 
            name={item.isActive ? "pause" : "play"} 
            size={16} 
            color={COLORS.white} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.info }]}
          onPress={() => handleEditExercise(item)}
        >
          <Ionicons name="create" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
          onPress={() => handleDeleteExercise(item)}
        >
          <Ionicons name="trash" size={16} color={COLORS.white} />
        </TouchableOpacity>

        {item.mediaURL && item.mediaType === 'video' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('ExerciseVideo', { exerciseId: item.id });
            }}
          >
            <Ionicons name="play-circle" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <RoleGuard 
      requiredRole="ADMIN" 
      fallbackMessage="Solo los administradores pueden gestionar los ejercicios del gimnasio."
    >
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Gestión de Ejercicios</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.createButton, styles.webButton]}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('WebExerciseUpload');
              }}
            >
              <Ionicons name="globe" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Crear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, styles.listButton]}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('WebExerciseList');
              }}
            >
              <Ionicons name="list" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Lista</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, styles.diagnosticButton]}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('ExerciseMediaDiagnostic');
              }}
            >
              <Ionicons name="bug" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Media</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.createButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filtros y búsqueda */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicios..."
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
              style={[styles.filterTag, filterMuscle === 'All' && styles.activeFilterTag]}
              onPress={() => setFilterMuscle('All')}
            >
              <Text style={[styles.filterTagText, filterMuscle === 'All' && styles.activeFilterTagText]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            {muscleGroups.map((muscle) => (
              <TouchableOpacity 
                key={muscle}
                style={[styles.filterTag, filterMuscle === muscle && styles.activeFilterTag]}
                onPress={() => setFilterMuscle(muscle)}
              >
                <Text style={[styles.filterTagText, filterMuscle === muscle && styles.activeFilterTagText]}>
                  {muscle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtros adicionales */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            {/* Filtro por tipo de equipo */}
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: COLORS.white, fontSize: 12, marginBottom: 5 }}>Tipo de Equipo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[styles.filterTag, filterEquipment === 'All' && styles.activeFilterTag]}
                  onPress={() => setFilterEquipment('All')}
                >
                  <Text style={[styles.filterTagText, filterEquipment === 'All' && styles.activeFilterTagText]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {equipmentOptions.map((equipment) => (
                  <TouchableOpacity 
                    key={equipment}
                    style={[styles.filterTag, filterEquipment === equipment && styles.activeFilterTag]}
                    onPress={() => setFilterEquipment(equipment)}
                  >
                    <Text style={[styles.filterTagText, filterEquipment === equipment && styles.activeFilterTagText]}>
                      {equipment}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>


          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.resultsText}>
            {`${filteredExercises.length} ejercicio${filteredExercises.length !== 1 ? 's' : ''} encontrado${filteredExercises.length !== 1 ? 's' : ''}`}
          </Text>
          <TouchableOpacity 
            style={{ padding: 8, backgroundColor: COLORS.primary, borderRadius: 4 }}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de ejercicios */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? "Prueba con otros términos de búsqueda" : "Agrega el primer ejercicio"}
            </Text>
          </View>
        )}
      />

      {/* Modal para crear/editar ejercicio */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingExercise ? "Editar Ejercicio" : "Agregar Ejercicio"}
            </Text>
            <TouchableOpacity 
              onPress={editingExercise ? handleUpdateExercise : handleCreateExercise}
              disabled={isUploading}
              style={[styles.saveButton, isUploading && styles.disabledButton]}
            >
              <Text style={styles.saveButtonText}>
                {isUploading ? "Guardando..." : editingExercise ? "Actualizar" : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre del Ejercicio *</Text>
              <TextInput
                style={styles.formInput}
                value={newExercise.name}
                onChangeText={(text) => setNewExercise(prev => ({ ...prev, name: text }))}
                placeholder="Ej: Press de banca con mancuernas"
                placeholderTextColor={COLORS.gray}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Grupos Musculares Principales * (1-3)</Text>
              <Text style={{ color: COLORS.gray, fontSize: 12, marginBottom: 8 }}>Seleccionados: {newExercise.primaryMuscleGroups.length}/3</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {muscleGroups.map((muscle) => (
                  <TouchableOpacity 
                    key={muscle}
                    style={[
                      styles.optionChip, 
                      newExercise.primaryMuscleGroups.includes(muscle) && styles.activeOptionChip
                    ]}
                    onPress={() => togglePrimaryMuscleGroup(muscle)}
                  >
                    <Text style={[
                      styles.optionChipText, 
                      newExercise.primaryMuscleGroups.includes(muscle) && styles.activeOptionChipText
                    ]}>
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Grupos Musculares Secundarios (1-3)</Text>
              <Text style={{ color: COLORS.gray, fontSize: 12, marginBottom: 8 }}>Seleccionados: {newExercise.secondaryMuscleGroups.length}/3</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {muscleGroups.map((muscle) => (
                  <TouchableOpacity 
                    key={muscle}
                    style={[
                      styles.optionChip, 
                      newExercise.secondaryMuscleGroups.includes(muscle) && styles.activeOptionChip
                    ]}
                    onPress={() => toggleSecondaryMuscleGroup(muscle)}
                  >
                    <Text style={[
                      styles.optionChipText, 
                      newExercise.secondaryMuscleGroups.includes(muscle) && styles.activeOptionChipText
                    ]}>
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo de Equipo *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {equipmentOptions.map((equipment) => (
                  <TouchableOpacity 
                    key={equipment}
                    style={[
                      styles.optionChip, 
                      newExercise.equipment === equipment && styles.activeOptionChip
                    ]}
                    onPress={() => setNewExercise(prev => ({ ...prev, equipment }))}
                  >
                    <Text style={[
                      styles.optionChipText, 
                      newExercise.equipment === equipment && styles.activeOptionChipText
                    ]}>
                      {equipment}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nivel de Dificultad *</Text>
              <View style={styles.difficultySelector}>
                {difficultyLevels.map((difficulty) => (
                  <TouchableOpacity 
                    key={difficulty}
                    style={[
                      styles.difficultyOption, 
                      newExercise.difficulty === difficulty && styles.activeDifficultyOption,
                      { backgroundColor: newExercise.difficulty === difficulty ? getDifficultyColor(difficulty) : COLORS.grayLight }
                    ]}
                    onPress={() => setNewExercise(prev => ({ ...prev, difficulty }))}
                  >
                    <Text style={[
                      styles.difficultyOptionText, 
                      newExercise.difficulty === difficulty && styles.activeDifficultyOptionText
                    ]}>
                      {difficulty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descripción Corta *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newExercise.description}
                onChangeText={(text) => setNewExercise(prev => ({ ...prev, description: text }))}
                placeholder="Descripción breve del ejercicio..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Instrucciones paso a paso *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newExercise.instructions}
                onChangeText={(text) => setNewExercise(prev => ({ ...prev, instructions: text }))}
                placeholder="1. Paso uno&#10;2. Paso dos&#10;3. Paso tres..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={6}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Consejos y Tips (opcional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newExercise.tips}
                onChangeText={(text) => setNewExercise(prev => ({ ...prev, tips: text }))}
                placeholder="Consejos importantes para la ejecución correcta..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Sección de multimedia */}
            <View style={styles.mediaSection}>
              <Text style={styles.sectionTitle}>Multimedia</Text>
              
              <View style={styles.mediaRow}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="image" size={24} color={COLORS.primary} />
                  <Text style={styles.mediaButtonText}>
                    {selectedImage ? "Cambiar Imagen" : "Seleccionar Imagen"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
                  <Ionicons name="videocam" size={24} color={COLORS.secondary} />
                  <Text style={styles.mediaButtonText}>
                    {selectedVideo.uri ? "Cambiar Video" : "Seleccionar Video"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mediaButton} onPress={pickThumbnail}>
                  <Ionicons name="image" size={24} color={COLORS.secondary} />
                  <Text style={styles.mediaButtonText}>
                    {selectedThumbnail ? "Cambiar Thumbnail" : "Agregar Thumbnail"}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedImage && (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <Text style={styles.previewLabel}>Imagen seleccionada</Text>
                </View>
              )}

              {selectedVideo.uri && (
                <View style={styles.mediaPreview}>
                  <View style={styles.videoPreview}>
                    <Ionicons name="videocam" size={32} color={COLORS.secondary} />
                    <Text style={styles.videoFileName}>{selectedVideo.name}</Text>
                  </View>
                  <Text style={styles.previewLabel}>Video seleccionado</Text>
                </View>
              )}

              {selectedThumbnail && (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: selectedThumbnail }} style={styles.imagePreview} />
                  <Text style={styles.previewLabel}>Thumbnail seleccionado</Text>
                </View>
              )}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                • La imagen debe ser máximo 5MB (recomendado 16:9){'\n'}
                • El video debe ser máximo 50MB (MP4, MOV o AVI){'\n'}
                • El thumbnail debe ser máximo 2MB (recomendado 16:9){'\n'}
                • Los archivos se subirán automáticamente al guardar
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
    </RoleGuard>
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
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  webButton: {
    backgroundColor: '#4CAF50',
  },
  listButton: {
    backgroundColor: '#2196F3',
  },
  diagnosticButton: {
    backgroundColor: '#FF9800',
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
  exerciseCard: {
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
    borderLeftColor: COLORS.danger,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: SIZES.padding,
    backgroundColor: COLORS.grayLight,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: SIZES.padding / 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.padding / 2,
  },
  muscleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  equipmentBadge: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  inactiveBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    height: 100,
    textAlignVertical: 'top',
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
    marginRight: SIZES.padding / 2,
  },
  activeOptionChip: {
    backgroundColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    fontWeight: '600',
  },
  activeOptionChipText: {
    color: COLORS.white,
  },
  difficultySelector: {
    flexDirection: 'row',
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginRight: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  activeDifficultyOption: {
    // Color dinámico aplicado inline
  },
  difficultyOptionText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  activeDifficultyOptionText: {
    color: COLORS.white,
  },
  mediaSection: {
    marginVertical: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.padding,
  },
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.grayLight,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
  },
  mediaButtonText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mediaPreview: {
    marginTop: SIZES.padding,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 120,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.grayLight,
  },
  videoPreview: {
    width: 200,
    height: 120,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFileName: {
    fontSize: SIZES.fontSmall,
    color: COLORS.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  previewLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: 4,
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
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageExercisesScreen; 