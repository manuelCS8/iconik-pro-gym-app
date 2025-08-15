// src/screens/member/ExercisesScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { Video } from 'expo-av';

import { COLORS, SIZES } from "../../utils/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups?: string[];
  equipment: string;
  difficulty: string;
  category?: string;
  description?: string;
  instructions?: string;
  mediaType?: string;
  mediaURL?: string;
  thumbnailURL?: string; // Nuevo campo para thumbnails
  imageURL?: string; // Nuevo campo para imágenes migradas
  isActive?: boolean;
}

// Opciones para filtros
const muscleGroups = [
  { id: "all", name: "Todos los músculos" },
  { id: "Pecho", name: "Pecho" },
  { id: "Espalda", name: "Espalda" },
  { id: "Piernas", name: "Piernas" },
  { id: "Hombros", name: "Hombros" },
  { id: "Brazos", name: "Brazos" },
  { id: "Core", name: "Core" },
  { id: "Glúteos", name: "Glúteos" },
  { id: "Pantorrillas", name: "Pantorrillas" },
  { id: "Cardio", name: "Cardio" },
  { id: "Funcional", name: "Funcional" },
  // Agregando grupos musculares adicionales basados en la imagen
  { id: "Abdominales", name: "Abdominales" },
  { id: "Abductores", name: "Abductores" },
  { id: "Antebrazos", name: "Antebrazos" },
  { id: "Bíceps", name: "Bíceps" },
  { id: "Cuádriceps", name: "Cuádriceps" },
  { id: "Dorsales", name: "Dorsales" },
  { id: "Isquiotibiales", name: "Isquiotibiales" },
  { id: "Lumbares", name: "Lumbares" },
  { id: "Trapecios", name: "Trapecios" },
  { id: "Tríceps", name: "Tríceps" },
];

const equipmentTypes = [
  { id: "all", name: "Todo el equipamiento" },
  { id: "peso_libre", name: "Peso libre" },
  { id: "maquina", name: "Máquina" },
  { id: "calistenia", name: "Calistenia" },
  { id: "cardio", name: "Cardio" },
  { id: "cable", name: "Cable" },
  { id: "funcional", name: "Funcional" },
  { id: "barra", name: "Barra" },
  { id: "mancuernas", name: "Mancuernas" },
  { id: "disco", name: "Disco" },
  { id: "bandas_resistencia", name: "Bandas de resistencia" },
  { id: "peso_rusa", name: "Peso rusa" },
  { id: "barra_z", name: "Barra Z" },
  { id: "banda_suspendida", name: "Banda suspendida" },
  { id: "ninguno", name: "Ninguno" },
  { id: "poleas", name: "Poleas" },
];

const difficultyLevels = [
  { id: "all", name: "Todas las dificultades" },
  { id: "principiante", name: "Principiante" },
  { id: "intermedio", name: "Intermedio" },
  { id: "avanzado", name: "Avanzado" },
];

const ExercisesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  // Obtener parámetros de navegación
  const { onExerciseSelect } = route.params || {};
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const videoRefs = useRef<{ [key: string]: any }>({});
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para filtros
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  // Estados para modales
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [videoAnimations] = useState(() => new Map());


  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchText, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Iniciando carga de ejercicios...");
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      console.log(`📊 Encontrados ${snapshot.docs.length} documentos en Firestore`);
      
      const exercisesFromFirestore: Exercise[] = [];
      
      // Procesar ejercicios de forma más segura
      snapshot.docs.forEach((docSnap, index) => {
        try {
          const data = docSnap.data();
          
          // Solo procesar ejercicios con nombre válido
          if (data.name && data.isActive !== false) {
            const exercise = {
              id: docSnap.id,
              name: data.name || '',
              primaryMuscleGroups: Array.isArray(data.primaryMuscleGroups) 
                ? data.primaryMuscleGroups 
                : (data.muscleGroup ? [data.muscleGroup] : []),
              secondaryMuscleGroups: Array.isArray(data.secondaryMuscleGroups) 
                ? data.secondaryMuscleGroups 
                : [],
              equipment: data.equipment || '',
              difficulty: data.difficulty || 'Principiante',
              category: 'Fuerza',
              description: data.description || '',
              instructions: data.instructions || data.description || '',
              mediaType: data.mediaType || '',
              mediaURL: data.mediaURL || '',
              thumbnailURL: data.thumbnailURL || '',
              imageURL: data.imageURL || '',
              isActive: true,
            };
            

            
            exercisesFromFirestore.push(exercise);
          }
        } catch (exerciseError) {
          console.error(`❌ Error procesando ejercicio ${index + 1}:`, exerciseError);
          // Continuar con el siguiente ejercicio en lugar de fallar
        }
      });
      
      // Ordenar por nombre para mejor rendimiento
      exercisesFromFirestore.sort((a, b) => a.name.localeCompare(b.name));
      
      // Debug: Log de ejercicios con media
      console.log('🔍 DEBUG - Ejercicios con media:');
      exercisesFromFirestore.slice(0, 5).forEach((exercise) => {
        console.log(`📋 ${exercise.name}:`, {
          mediaURL: exercise.mediaURL,
          mediaType: exercise.mediaType,
          hasMedia: !!exercise.mediaURL,
          isLocal: exercise.mediaURL?.startsWith('file://'),
          isFirebase: exercise.mediaURL?.startsWith('https://')
        });
      });
      
      console.log(`✅ ${exercisesFromFirestore.length} ejercicios válidos procesados`);
      
      // Debug: Log de todos los músculos disponibles
      const allMuscles = new Set<string>();
      exercisesFromFirestore.forEach(exercise => {
        exercise.primaryMuscleGroups?.forEach(muscle => allMuscles.add(muscle));
      });
      console.log('🏋️ Músculos disponibles en la base de datos:', Array.from(allMuscles));
      
      setExercises(exercisesFromFirestore);
      setFilteredExercises(exercisesFromFirestore);
      
    } catch (error) {
      console.error("❌ Error loading exercises:", error);
      // En caso de error, usar array vacío
      setExercises([]);
      setFilteredExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Filtro por búsqueda
    if (searchText) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (exercise.primaryMuscleGroups && exercise.primaryMuscleGroups.some(muscle => 
          muscle.toLowerCase().includes(searchText.toLowerCase())
        ))
      );
    }

    // Filtro por músculo
    if (selectedMuscle !== 'all') {
      filtered = filtered.filter(exercise => {
        if (!exercise.primaryMuscleGroups) return false;
        
        return exercise.primaryMuscleGroups.some(muscle => 
          muscle === selectedMuscle
        );
      });
    }

    // Filtro por equipo
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(exercise =>
        exercise.equipment.toLowerCase().includes(selectedEquipment.toLowerCase())
      );
    }

    // Filtro por dificultad
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(exercise =>
        exercise.difficulty.toLowerCase() === selectedDifficulty
      );
    }

    // Debug: Log para ver qué ejercicios se están filtrando
    if (selectedMuscle !== 'all') {
      console.log(`🔍 Filtrando por músculo: ${selectedMuscle}`);
      console.log(`📊 Ejercicios encontrados: ${filtered.length}`);
      if (filtered.length > 0) {
        console.log('📋 Primeros 3 ejercicios encontrados:');
        filtered.slice(0, 3).forEach(exercise => {
          console.log(`  - ${exercise.name}: ${exercise.primaryMuscleGroups?.join(', ')}`);
        });
      }
    }
    
    setFilteredExercises(filtered);
  };

  const onExercisePress = (exercise: Exercise) => {
    console.log(`🎯 Ejercicio seleccionado: ${exercise.name}`);
    console.log(`📋 onExerciseSelect existe:`, !!onExerciseSelect);
    console.log(`📋 onExerciseSelect tipo:`, typeof onExerciseSelect);
    
    // Si hay un callback de selección (viene desde creación de rutina)
    if (onExerciseSelect) {
      console.log(`✅ Ejecutando callback de selección...`);
      try {
        onExerciseSelect(exercise);
        console.log(`✅ Callback ejecutado, regresando...`);
        navigation.goBack();
        return;
      } catch (error) {
        console.error(`❌ Error en callback:`, error);
      }
    }
    
    // Si no hay callback, navegar al detalle del ejercicio
    console.log(`📱 Navegando a detalle del ejercicio...`);
    navigation.navigate("ExerciseDetail" as never, { exerciseId: exercise.id } as never);
  };





  const getVideoAnimation = (exerciseId: string) => {
    if (!videoAnimations.has(exerciseId)) {
      const animatedValue = new Animated.Value(0);
      videoAnimations.set(exerciseId, animatedValue);
      
      // Crear animación de "video" que simule reproducción
      const videoAnimation = () => {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => videoAnimation()); // Repetir infinitamente
      };
      
      videoAnimation();
    }
    return videoAnimations.get(exerciseId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Principiante":
        return "#4CAF50"; // Verde
      case "Intermedio":
        return "#FF9800"; // Naranja
      case "Avanzado":
        return "#F44336"; // Rojo
      default:
        return COLORS.gray;
    }
  };

  const getExerciseIcon = (exerciseName: string, muscleGroups: string[]) => {
    const name = exerciseName.toLowerCase();
    const muscles = muscleGroups?.map(m => m.toLowerCase()) || [];

    // Iconos por tipo de ejercicio
    if (name.includes('prensa') || name.includes('sentadilla') || muscles.includes('cuádriceps')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('press') || name.includes('banca') || muscles.includes('pecho')) {
      return <Ionicons name="fitness" size={40} color={COLORS.primary} />;
    }
    if (name.includes('curl') || muscles.includes('bíceps')) {
      return <Ionicons name="hand-right" size={40} color={COLORS.primary} />;
    }
    if (name.includes('remo') || muscles.includes('dorsales')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('femoral') || muscles.includes('femorales')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('pantorrilla') || muscles.includes('pantorrilla')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('hombro') || muscles.includes('hombro')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('abdominal') || muscles.includes('abdominales')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    if (name.includes('flexion') || name.includes('fondos')) {
      return <Ionicons name="body" size={40} color={COLORS.primary} />;
    }
    
    // Icono por defecto
    return <Ionicons name="fitness" size={40} color={COLORS.gray} />;
  };

  const getExerciseThumbnail = (exerciseName: string, muscleGroups: string[]) => {
    const name = exerciseName.toLowerCase();
    const muscles = muscleGroups?.map(m => m.toLowerCase()) || [];

    // Colores de fondo para diferentes tipos de ejercicios
    if (name.includes('prensa') || name.includes('sentadilla') || muscles.includes('cuádriceps')) {
      return { backgroundColor: '#FF6B6B', icon: 'body', color: '#fff' };
    }
    if (name.includes('press') || name.includes('banca') || muscles.includes('pecho')) {
      return { backgroundColor: '#4ECDC4', icon: 'fitness', color: '#fff' };
    }
    if (name.includes('curl') || muscles.includes('bíceps')) {
      return { backgroundColor: '#45B7D1', icon: 'hand-right', color: '#fff' };
    }
    if (name.includes('remo') || muscles.includes('dorsales')) {
      return { backgroundColor: '#96CEB4', icon: 'body', color: '#fff' };
    }
    if (name.includes('femoral') || muscles.includes('femorales')) {
      return { backgroundColor: '#FFEAA7', icon: 'body', color: '#2D3436' };
    }
    if (name.includes('pantorrilla') || muscles.includes('pantorrilla')) {
      return { backgroundColor: '#DDA0DD', icon: 'body', color: '#fff' };
    }
    if (name.includes('hombro') || muscles.includes('hombro')) {
      return { backgroundColor: '#98D8C8', icon: 'body', color: '#fff' };
    }
    if (name.includes('abdominal') || muscles.includes('abdominales')) {
      return { backgroundColor: '#F7DC6F', icon: 'body', color: '#2D3436' };
    }
    if (name.includes('flexion') || name.includes('fondos')) {
      return { backgroundColor: '#BB8FCE', icon: 'body', color: '#fff' };
    }
    
    // Por defecto
    return { backgroundColor: '#95A5A6', icon: 'fitness', color: '#fff' };
  };

  // Componente de video optimizado para evitar crashes
  const ExerciseVideo = ({ mediaURL, mediaType, exerciseId }: { 
    mediaURL?: string; 
    mediaType?: string;
    exerciseId: string;
  }) => {
    const videoRef = useRef<any>(null);

    // Mostrar video si es una URL válida
    if (mediaType && (mediaType === 'video' || mediaType.startsWith('video/')) && mediaURL) {
      return (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: mediaURL }}
            style={styles.exerciseVideo}
            resizeMode="cover"
            shouldPlay={true}
            isMuted={true}
            isLooping={true}
            useNativeControls={false}
            onError={(error) => {
              console.log(`❌ Error cargando video: ${mediaURL}`, error);
              console.log(`🔍 MediaType: ${mediaType}, MediaURL: ${mediaURL}`);
            }}
            onLoad={() => {
              console.log(`✅ Video cargado exitosamente: ${mediaURL}`);
              console.log(`🔍 MediaType: ${mediaType}, MediaURL: ${mediaURL}`);
            }}
          />
          {/* Overlay con icono de play para indicar que es un video */}
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={30} color="#fff" />
          </View>
        </View>
      );
    }
    
    // Mostrar imagen si es una URL válida
    if (mediaType && (mediaType === 'image' || mediaType.startsWith('image/')) && mediaURL) {
      return (
        <View style={styles.videoContainer}>
          <Image
            source={{ uri: mediaURL }}
            style={styles.exerciseVideo}
            resizeMode="cover"
            onError={(error) => {
              console.log(`❌ Error cargando imagen: ${mediaURL}`, error);
              console.log(`🔍 MediaType: ${mediaType}, MediaURL: ${mediaURL}`);
            }}
            onLoad={() => {
              console.log(`✅ Imagen cargada exitosamente: ${mediaURL}`);
              console.log(`🔍 MediaType: ${mediaType}, MediaURL: ${mediaURL}`);
            }}
          />
        </View>
      );
    }
    
    // Placeholder mejorado para videos locales o sin video
    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderIconContainer}>
          {mediaType && (mediaType === 'video' || mediaType.startsWith('video/')) ? (
            <Ionicons name="videocam" size={40} color="#666" />
          ) : (
            <Ionicons name="image" size={40} color="#666" />
          )}
        </View>
        <Text style={styles.placeholderText}>
          {mediaURL && mediaURL.startsWith('file://') ? 'Media Local' : 'Media Disponible'}
        </Text>
        <Text style={styles.placeholderSubtext}>
          {mediaType ? `Tipo: ${mediaType}` : 'Sin media configurado'}
        </Text>
        <Text style={styles.placeholderSubtext}>
          {mediaURL ? `URL: ${mediaURL.substring(0, 30)}...` : 'Sin URL'}
        </Text>
      </View>
    );
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
    // Verificación de seguridad para evitar errores de renderizado
    if (!item || !item.id) {
      console.warn("⚠️ Ejercicio inválido detectado:", item);
      return null;
    }
    
    try {
      // Determinar qué imagen mostrar con prioridad
      let imageSource = null;
      let imageType = 'none';
      
      if (item.imageURL && item.imageURL.startsWith('https://')) {
        imageSource = item.imageURL;
        imageType = 'imageURL';
      } else if (item.mediaURL && item.mediaType === 'image' && item.mediaURL.startsWith('http')) {
        imageSource = item.mediaURL;
        imageType = 'mediaURL';
      } else if (item.thumbnailURL && item.thumbnailURL.startsWith('http')) {
        imageSource = item.thumbnailURL;
        imageType = 'thumbnailURL';
      }
      
      return (
      <TouchableOpacity 
        style={[styles.card, onExerciseSelect && styles.cardSelectable]}
        onPress={() => onExercisePress(item)}
        activeOpacity={0.8}
      >
      {/* Video/Imagen del ejercicio */}
      <View style={styles.videoContainer}>
        {imageSource ? (
          // Mostrar imagen si tenemos una URL válida
          <Image
            source={{ uri: imageSource }}
            style={styles.exerciseImage}
            resizeMode="cover"
            onError={() => {
              console.log(`❌ Error cargando imagen (${imageType}) para ejercicio: ${item.name}`);
            }}
            onLoad={() => {
              console.log(`✅ Imagen cargada (${imageType}) para ejercicio: ${item.name}`);
            }}
          />
        ) : item.mediaURL && item.mediaType && (item.mediaType === 'video' || item.mediaType.startsWith('video/')) ? (
          // Mostrar video si no hay imagen pero hay video
          <ExerciseVideo 
            mediaURL={item.mediaURL}
            mediaType={item.mediaType}
            exerciseId={item.id}
          />
        ) : (
          // Placeholder con icono y color según el tipo de ejercicio
          <View style={styles.placeholderContainer}>
            <View style={[
              styles.placeholderIconContainer, 
              { backgroundColor: getExerciseThumbnail(item.name, item.primaryMuscleGroups).backgroundColor }
            ]}>
              <Ionicons 
                name={getExerciseThumbnail(item.name, item.primaryMuscleGroups).icon as any} 
                size={40} 
                color={getExerciseThumbnail(item.name, item.primaryMuscleGroups).color} 
              />
            </View>
            <Text style={styles.placeholderText}>
              {item.primaryMuscleGroups && item.primaryMuscleGroups.length > 0 
                ? item.primaryMuscleGroups[0] 
                : 'Ejercicio'}
            </Text>
          </View>
        )}
        {onExerciseSelect && (
          <View style={styles.selectIndicator}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="star-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Información del ejercicio */}
      <View style={styles.cardInfo}>
        <Text style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </Text>
        {/* Información de músculos primarios y secundarios */}
        <View style={styles.muscleInfoContainer}>
          {/* Músculos Primarios */}
          <View style={styles.muscleGroupContainer}>
            <Text style={styles.muscleGroupLabel}>
              <Ionicons name="star" size={12} color={COLORS.primary} /> Primarios:
            </Text>
            <Text style={styles.primaryMuscleGroups}>
              {item.primaryMuscleGroups && item.primaryMuscleGroups.length > 0 
                ? item.primaryMuscleGroups.join(', ') 
                : 'No especificado'}
            </Text>
          </View>
          
          {/* Músculos Secundarios */}
          {item.secondaryMuscleGroups && item.secondaryMuscleGroups.length > 0 && (
            <View style={styles.muscleGroupContainer}>
              <Text style={styles.muscleGroupLabel}>
                <Ionicons name="star-outline" size={12} color={COLORS.gray} /> Secundarios:
              </Text>
              <Text style={styles.secondaryMuscleGroups}>
                {item.secondaryMuscleGroups.join(', ')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.badgeText}>{item.difficulty}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    );
    } catch (error) {
      console.error(`❌ Error renderizando tarjeta de ejercicio ${item.name}:`, error);
      // Retornar una tarjeta de fallback simple
      return (
        <TouchableOpacity 
          style={[styles.card, onExerciseSelect && styles.cardSelectable]}
          onPress={() => onExercisePress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.videoContainer}>
            <View style={styles.placeholderContainer}>
              <Ionicons name="heart" size={40} color={COLORS.red} />
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="star-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {item.name}
            </Text>
            {/* Información de músculos primarios y secundarios */}
            <View style={styles.muscleInfoContainer}>
              {/* Músculos Primarios */}
              <View style={styles.muscleGroupContainer}>
                <Text style={styles.muscleGroupLabel}>
                  <Ionicons name="star" size={12} color={COLORS.primary} /> Primarios:
                </Text>
                <Text style={styles.primaryMuscleGroups}>
                  {item.primaryMuscleGroups && item.primaryMuscleGroups.length > 0 
                    ? item.primaryMuscleGroups.join(', ') 
                    : 'No especificado'}
                </Text>
              </View>
              
              {/* Músculos Secundarios */}
              {item.secondaryMuscleGroups && item.secondaryMuscleGroups.length > 0 && (
                <View style={styles.muscleGroupContainer}>
                  <Text style={styles.muscleGroupLabel}>
                    <Ionicons name="star-outline" size={12} color={COLORS.gray} /> Secundarios:
                  </Text>
                  <Text style={styles.secondaryMuscleGroups}>
                    {item.secondaryMuscleGroups.join(', ')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.badgeContainer}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                <Text style={styles.badgeText}>{item.difficulty}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedMuscle("all");
    setSelectedEquipment("all");
    setSelectedDifficulty("all");
  };

  const getFilterButtonText = (type: 'muscle' | 'equipment' | 'difficulty') => {
    switch (type) {
      case 'muscle':
        const muscle = muscleGroups.find(m => m.id === selectedMuscle);
        return muscle ? muscle.name : "Todos los músculos";
      case 'equipment':
        const equipment = equipmentTypes.find(e => e.id === selectedEquipment);
        return equipment ? equipment.name : "Todo el equipamiento";
      case 'difficulty':
        const difficulty = difficultyLevels.find(d => d.id === selectedDifficulty);
        return difficulty ? difficulty.name : "Todas las dificultades";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con "Buscar" */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {onExerciseSelect ? 'Seleccionar Ejercicio' : 'Buscar'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicio"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Filtros tipo píldora */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersRow}>
          <TouchableOpacity 
            style={[styles.filterPill, selectedMuscle === 'all' && selectedEquipment === 'all' && styles.filterPillActive]}
            onPress={() => {
              setSelectedMuscle('all');
              setSelectedEquipment('all');
            }}
          >
            <Text style={styles.filterPillText}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, selectedMuscle !== 'all' && styles.filterPillActive]}
            onPress={() => setShowMuscleModal(true)}
          >
            <Text style={styles.filterPillText}>Grupos Musculares</Text>
            {selectedMuscle !== 'all' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, selectedEquipment !== 'all' && styles.filterPillActive]}
            onPress={() => setShowEquipmentModal(true)}
          >
            <Text style={styles.filterPillText}>Equipo</Text>
            {selectedEquipment !== 'all' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>



      {/* Lista de ejercicios */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onError={(error) => {
          console.error("❌ Error en FlatList:", error);
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color={COLORS.white} />
            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? "Prueba con otros términos de búsqueda" : "No hay ejercicios disponibles"}
            </Text>
          </View>
        }
      />



      {/* Modal para filtro de músculos */}
      <Modal
        visible={showMuscleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMuscleModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Grupos musculares</Text>
              <TouchableOpacity onPress={() => {
                setSelectedMuscle('all');
                setShowMuscleModal(false);
              }}>
                <Text style={styles.clearButton}>Limpiar</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedMuscle(muscle.id);
                    setShowMuscleModal(false);
                  }}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      selectedMuscle === muscle.id && styles.checkboxSelected
                    ]}>
                      {selectedMuscle === muscle.id && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.modalItemText}>{muscle.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowMuscleModal(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para filtro de equipamiento */}
      <Modal
        visible={showEquipmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEquipmentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Equipos</Text>
              <TouchableOpacity onPress={() => {
                setSelectedEquipment('all');
                setShowEquipmentModal(false);
              }}>
                <Text style={styles.clearButton}>Limpiar</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {equipmentTypes.map((equipment) => (
                <TouchableOpacity
                  key={equipment.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedEquipment(equipment.id);
                    setShowEquipmentModal(false);
                  }}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      selectedEquipment === equipment.id && styles.checkboxSelected
                    ]}>
                      {selectedEquipment === equipment.id && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.modalItemText}>{equipment.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowEquipmentModal(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Fondo negro
  },
  header: {
    marginBottom: 12, // Menos espacio entre header y filtros
    paddingHorizontal: 16, // Padding horizontal más pequeño para que la barra sea más ancha
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10, // Volver al valor original
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    flex: 1,
  },
  headerPlaceholder: {
    width: 40, // Placeholder para el espacio entre el botón de regreso y el título
  },
  searchSection: {
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10, // Bordes más redondeados como en la imagen
    paddingHorizontal: 16, // Más padding horizontal para el icono y texto
    paddingVertical: 8, // Menos padding vertical
    borderWidth: 0, // Sin borde para un look más limpio
    height: 44, // Altura reducida
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 12, // Tamaño de fuente más pequeño
    color: '#000', // Color negro para máximo contraste
    marginLeft: 12, // Más espacio entre icono y texto
    height: "100%", // Ocupar toda la altura del container
    fontWeight: '500', // Peso de fuente medio para mejor visibilidad
    paddingVertical: 0, // Sin padding vertical para mejor control
  },
  filtersContainer: {
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25, // Forma de píldora
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: COLORS.primary, // Naranja/rojo cuando está activo
    borderColor: COLORS.white,
  },
  filterPillText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  filterBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
  },

  listContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: (windowWidth - SIZES.padding * 3) / 2, // Ancho de cada tarjeta con espacio entre ellas
    backgroundColor: "#000", // Cuadrado negro como fondo
    marginBottom: SIZES.padding,
    borderRadius: 12, // Bordes redondeados del cuadrado negro
    borderWidth: 1,
    borderColor: COLORS.white,
    overflow: "hidden", // Para que el contenido respete los bordes redondeados
  },
  videoContainer: {
    width: "100%",
    height: 120, // Altura fija para el video
    overflow: "hidden",
    backgroundColor: "#fff", // Fondo blanco para la sección del video
    borderTopLeftRadius: 12, // Bordes redondeados en la parte superior
    borderTopRightRadius: 12,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  exerciseVideo: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // Fondo blanco para el placeholder
    borderTopLeftRadius: 12, // Bordes redondeados en la parte superior
    borderTopRightRadius: 12,
  },
  placeholderText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: SIZES.fontExtraSmall,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: "center",
  },
  placeholderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20, // Círculo perfecto
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cardInfo: {
    padding: SIZES.padding,
    backgroundColor: "#333", // Fondo gris para la información
    borderBottomLeftRadius: 12, // Bordes redondeados en la parte inferior
    borderBottomRightRadius: 12,
  },
  exerciseName: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.white, // Texto blanco sobre fondo negro
    marginBottom: 5,
    textAlign: "center",
  },
  muscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray, // Texto gris para los grupos musculares
    marginBottom: 8,
    textAlign: "center",
  },
  muscleInfoContainer: {
    marginBottom: 8,
  },
  muscleGroupContainer: {
    marginBottom: 4,
  },
  muscleGroupLabel: {
    fontSize: SIZES.fontExtraSmall,
    color: COLORS.gray,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  primaryMuscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.primary,
    fontWeight: "500",
    textAlign: "center",
  },
  secondaryMuscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    fontWeight: "400",
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8, // Bordes redondeados para el badge
    backgroundColor: "#4CAF50", // Verde como en las imágenes
  },
  badgeText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.white,
    marginTop: SIZES.padding,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    marginTop: SIZES.padding / 2,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Fondo semi-transparente
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.grayDark, // Fondo gris oscuro acorde a la paleta
    marginTop: 100, // Dejar espacio arriba
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  clearButton: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  checkbox: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: "transparent",
  },
  checkboxSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  modalItemText: {
    color: COLORS.white,
    fontSize: 16,
    flex: 1,
  },
  applyButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },

  applyButtonText: {
    color: COLORS.primary, // Texto rojo para contraste con fondo blanco
    fontSize: 18,
    fontWeight: "bold",
  },
  videoContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exerciseVideo: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },


  cardSelectable: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(227, 28, 31, 0.05)',
  },
  selectIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
});

export default ExercisesScreen; 