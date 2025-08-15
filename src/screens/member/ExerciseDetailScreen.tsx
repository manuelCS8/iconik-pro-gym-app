import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";
import { COLORS, SIZES } from "../../utils/theme";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RouteParams = {
  ExerciseDetail: {
    exerciseId: string;
    exerciseName?: string;
  };
};

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups?: string[];
  equipment: string;
  difficulty: string;
  description?: string;
  instructions?: string;
  tips?: string;
  mediaType?: string;
  mediaURL?: string;
  thumbnailURL?: string;
  imageURL?: string;
  isActive?: boolean;
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const ExerciseDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, "ExerciseDetail">>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { exerciseId } = route.params;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'historia' | 'instrucciones'>('resumen');

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Cargando ejercicio con ID: ${exerciseId}`);
      
      const exerciseRef = doc(db, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);
      
      if (exerciseSnap.exists()) {
        const data = exerciseSnap.data();
        const exerciseData: Exercise = {
          id: exerciseSnap.id,
          name: data.name || '',
          primaryMuscleGroups: Array.isArray(data.primaryMuscleGroups) 
            ? data.primaryMuscleGroups 
            : (data.muscleGroup ? [data.muscleGroup] : []),
          secondaryMuscleGroups: Array.isArray(data.secondaryMuscleGroups) 
            ? data.secondaryMuscleGroups 
            : [],
          equipment: data.equipment || '',
          difficulty: data.difficulty || 'Principiante',
          description: data.description || '',
          instructions: data.instructions || '',
          tips: data.tips || '',
          mediaType: data.mediaType || '',
          mediaURL: data.mediaURL || '',
          thumbnailURL: data.thumbnailURL || '',
          imageURL: data.imageURL || '',
          isActive: data.isActive !== false,
        };
        
        setExercise(exerciseData);
        console.log('✅ Ejercicio cargado:', exerciseData.name);
      } else {
        setError('Ejercicio no encontrado');
        console.log('❌ Ejercicio no encontrado en Firestore');
      }
    } catch (error) {
      console.error('Error cargando ejercicio:', error);
      setError('Error al cargar el ejercicio');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResumenTab = () => (
    <View style={styles.tabContent}>
      {/* Información básica */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Equipo</Text>
            <Text style={styles.infoValue}>{exercise?.equipment || 'No especificado'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dificultad</Text>
            <Text style={[styles.infoValue, { color: getDifficultyColor(exercise?.difficulty || '') }]}>
              {exercise?.difficulty || 'Principiante'}
            </Text>
          </View>
        </View>
      </View>

      {/* Video/Imagen del ejercicio */}
      <View style={styles.mediaCard}>
        {exercise?.mediaType && (exercise?.mediaType === 'video' || exercise?.mediaType.startsWith('video/')) && exercise?.mediaURL ? (
          <Video
            source={{ uri: exercise.mediaURL }}
            style={styles.video}
            resizeMode="cover"
            useNativeControls={false}
            isLooping={true}
            shouldPlay={true}
            isMuted={true}
            onError={(error) => {
              console.log(`❌ Error cargando video en detalle: ${exercise.mediaURL}`, error);
              console.log(`🔍 MediaType: ${exercise.mediaType}, MediaURL: ${exercise.mediaURL}`);
            }}
            onLoad={() => {
              console.log(`✅ Video cargado en detalle: ${exercise.mediaURL}`);
              console.log(`🔍 MediaType: ${exercise.mediaType}, MediaURL: ${exercise.mediaURL}`);
            }}
          />
        ) : exercise?.mediaType && (exercise?.mediaType === 'image' || exercise?.mediaType.startsWith('image/')) && exercise?.mediaURL ? (
          <Image
            source={{ uri: exercise.mediaURL }}
            style={styles.video}
            resizeMode="cover"
            onError={(error) => {
              console.log(`❌ Error cargando imagen en detalle: ${exercise.mediaURL}`, error);
              console.log(`🔍 MediaType: ${exercise.mediaType}, MediaURL: ${exercise.mediaURL}`);
            }}
            onLoad={() => {
              console.log(`✅ Imagen cargada en detalle: ${exercise.mediaURL}`);
              console.log(`🔍 MediaType: ${exercise.mediaType}, MediaURL: ${exercise.mediaURL}`);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="fitness" size={64} color={COLORS.gray} />
            <Text style={styles.placeholderText}>
              {exercise?.mediaURL ? 'Media no compatible' : 'Sin media disponible'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {exercise?.mediaType ? `Tipo: ${exercise.mediaType}` : 'Sin tipo configurado'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {exercise?.mediaURL ? `URL: ${exercise.mediaURL.substring(0, 50)}...` : 'Sin URL'}
            </Text>
          </View>
        )}
      </View>

      {/* Nombre del ejercicio y músculos */}
      <View style={styles.exerciseInfoCard}>
        <Text style={styles.exerciseName}>{exercise?.name}</Text>
        
        {/* Información de músculos primarios y secundarios */}
        <View style={styles.muscleInfoContainer}>
          {/* Músculos Primarios */}
          <View style={styles.muscleGroupContainer}>
            <Text style={styles.muscleInfo}>
              <Text style={styles.muscleLabel}>
                <Ionicons name="star" size={14} color={COLORS.primary} /> Primarios: 
              </Text>
              <Text style={styles.primaryMuscleValue}>
                {exercise?.primaryMuscleGroups && exercise.primaryMuscleGroups.length > 0 
                  ? exercise.primaryMuscleGroups.join(', ') 
                  : 'No especificado'}
              </Text>
            </Text>
          </View>
          
          {/* Músculos Secundarios */}
          {exercise?.secondaryMuscleGroups && exercise.secondaryMuscleGroups.length > 0 && (
            <View style={styles.muscleGroupContainer}>
              <Text style={styles.muscleInfo}>
                <Text style={styles.muscleLabel}>
                  <Ionicons name="star-outline" size={14} color={COLORS.gray} /> Secundarios: 
                </Text>
                <Text style={styles.secondaryMuscleValue}>
                  {exercise.secondaryMuscleGroups.join(', ')}
                </Text>
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Records Personales */}
      <View style={styles.recordsCard}>
        <Text style={styles.recordsTitle}>Records Personales</Text>
        
        <View style={styles.recordItem}>
          <Text style={styles.recordLabel}>Registro Mayor Peso</Text>
          <Text style={styles.recordValue}>-</Text>
        </View>
        <View style={styles.recordSeparator} />
        
        <View style={styles.recordItem}>
          <Text style={styles.recordLabel}>Calculo 1RM</Text>
          <Text style={styles.recordValue}>-</Text>
        </View>
        <View style={styles.recordSeparator} />
        
        <View style={styles.recordItem}>
          <Text style={styles.recordLabel}>Mejor Serie</Text>
          <Text style={styles.recordValue}>-</Text>
        </View>
        <View style={styles.recordSeparator} />
        
        <View style={styles.recordItem}>
          <Text style={styles.recordLabel}>Mejor Volumen Total</Text>
          <Text style={styles.recordValue}>-</Text>
        </View>
      </View>
    </View>
  );

  const renderHistoriaTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>Historial de Entrenamiento</Text>
        <View style={styles.emptyHistoryContainer}>
          <Ionicons name="time-outline" size={48} color={COLORS.gray} />
          <Text style={styles.emptyHistoryText}>No hay historial disponible</Text>
          <Text style={styles.emptyHistorySubtext}>
            Comienza a entrenar para ver tu progreso
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInstruccionesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.instructionsCard}>
        <Text style={styles.cardTitle}>Instrucciones</Text>
        {exercise?.instructions ? (
          <Text style={styles.instructionsText}>{exercise.instructions}</Text>
        ) : (
          <Text style={styles.noInstructionsText}>No hay instrucciones disponibles</Text>
        )}
      </View>

      {exercise?.tips && (
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>💡 Consejos</Text>
          <Text style={styles.tipsText}>{exercise.tips}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando ejercicio...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ejercicio no encontrado</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resumen' && styles.activeTab]}
          onPress={() => setActiveTab('resumen')}
        >
          <Text style={[styles.tabText, activeTab === 'resumen' && styles.activeTabText]}>
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'historia' && styles.activeTab]}
          onPress={() => setActiveTab('historia')}
        >
          <Text style={[styles.tabText, activeTab === 'historia' && styles.activeTabText]}>
            Historia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'instrucciones' && styles.activeTab]}
          onPress={() => setActiveTab('instrucciones')}
        >
          <Text style={[styles.tabText, activeTab === 'instrucciones' && styles.activeTabText]}>
            Instrucciones
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'resumen' && renderResumenTab()}
        {activeTab === 'historia' && renderHistoriaTab()}
        {activeTab === 'instrucciones' && renderInstruccionesTab()}
      </ScrollView>
    </SafeAreaView>
  );
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

export default ExerciseDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding, // Volver al valor original
    backgroundColor: "#000", // Negro como en las imágenes
  },
  headerTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40, // Espacio para balancear el diseño
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#000", // Negro como en las imágenes
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: SIZES.padding,
  },
  tab: {
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: 8,
    flex: 1,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary, // Rojo para pestaña activa
  },
  tabText: {
    fontSize: 14, // Tamaño más pequeño para que quepan todas
    fontWeight: "bold",
    color: COLORS.gray, // Gris para pestañas inactivas
  },
  activeTabText: {
    color: COLORS.white, // Blanco para pestaña activa
  },
  content: {
    flex: 1,
    backgroundColor: "#000", // Fondo negro
  },
  tabContent: {
    padding: SIZES.padding,
  },
  infoCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.white,
  },
  mediaCard: {
    position: "relative",
    width: "100%",
    height: (windowWidth - SIZES.padding * 2) * 0.6,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white, // Solo el video en blanco
    marginBottom: SIZES.padding,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  placeholderText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: SIZES.padding / 2,
  },
  placeholderSubtext: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: SIZES.padding / 4,
    textAlign: "center",
  },
  pauseButton: {
    position: "absolute",
    top: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 8,
  },
  musclesCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  cardTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: SIZES.padding / 2,
  },
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.padding / 2,
  },
  muscleLabel: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginRight: 8,
    minWidth: 80,
  },
  primaryMuscleTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
  },
  primaryMuscleText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    fontWeight: "bold",
  },
  secondaryMuscleText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
  },
  historyCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  emptyHistoryContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding * 2,
  },
  emptyHistoryText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.white,
    marginTop: SIZES.padding,
  },
  emptyHistorySubtext: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginTop: SIZES.padding / 2,
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  instructionsText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.white,
    lineHeight: 22,
  },
  noInstructionsText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: SIZES.padding,
  },
  tipsCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  tipsText: {
    fontSize: SIZES.fontRegular,
    color: COLORS.white,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.grayDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.grayDark,
    textAlign: "center",
    marginBottom: SIZES.padding,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
  exerciseInfoCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  exerciseName: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SIZES.padding / 2,
  },
  muscleInfo: {
    fontSize: SIZES.fontRegular,
    color: COLORS.white,
    marginBottom: SIZES.padding / 2,
  },
  muscleLabel: {
    fontWeight: "bold",
    color: COLORS.white,
  },
  muscleValue: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  muscleInfoContainer: {
    marginBottom: SIZES.padding / 2,
  },
  muscleGroupContainer: {
    marginBottom: SIZES.padding / 3,
  },
  primaryMuscleValue: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  secondaryMuscleValue: {
    fontWeight: "500",
    color: COLORS.gray,
  },
  recordsCard: {
    backgroundColor: "#000", // Fondo negro
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  recordsTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SIZES.padding / 2,
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.padding / 2,
  },
  recordLabel: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
  },
  recordValue: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  recordSeparator: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginVertical: SIZES.padding / 2,
  },
}); 