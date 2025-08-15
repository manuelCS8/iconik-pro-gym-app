import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SIZES } from '../../utils/theme';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface ExerciseVideoParams {
  exerciseId: string;
}

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  description: string;
  instructions?: string;
  tips?: string;
  mediaType?: string;
  mediaURL?: string;
  isActive?: boolean;
}

const ExerciseVideoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: ExerciseVideoParams }, 'params'>>();
  const { exerciseId } = route.params;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadExerciseDetails();
  }, [exerciseId]);

  const loadExerciseDetails = async () => {
    try {
      setIsLoading(true);
      const exerciseRef = doc(db, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);

      if (exerciseSnap.exists()) {
        const data = exerciseSnap.data();
        const exerciseData: Exercise = {
          id: exerciseSnap.id,
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
        setExercise(exerciseData);
      } else {
        Alert.alert('Error', 'Ejercicio no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      Alert.alert('Error', 'No se pudo cargar el ejercicio');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return COLORS.success;
      case 'Intermedio': return COLORS.warning;
      case 'Avanzado': return COLORS.danger;
      default: return COLORS.gray;
    }
  };

  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
    setIsPlaying(status.isPlaying);
  };

  const togglePlayPause = () => {
    if (videoStatus.isPlaying) {
      // Pausar video
      setIsPlaying(false);
    } else {
      // Reproducir video
      setIsPlaying(true);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando ejercicio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ejercicio no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video del Ejercicio</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          {exercise.mediaURL && exercise.mediaType === 'video' ? (
            <Video
              source={{ uri: exercise.mediaURL }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              isMuted
              onPlaybackStatusUpdate={handleVideoStatusUpdate}
              onError={(error) => {
                console.log('Error de video:', error);
                Alert.alert('Error', 'No se pudo cargar el video');
              }}
            />
          ) : (
            <View style={styles.noVideoContainer}>
              <Ionicons name="videocam-off" size={64} color={COLORS.gray} />
              <Text style={styles.noVideoText}>No hay video disponible</Text>
              <Text style={styles.noVideoSubtext}>
                Este ejercicio no tiene video asociado
              </Text>
            </View>
          )}
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.muscleBadge}>
              <Text style={styles.badgeText}>
                <Ionicons name="star" size={12} color="#fff" /> {exercise.primaryMuscleGroups.join(', ')}
              </Text>
            </View>
            {exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.length > 0 && (
              <View style={styles.secondaryMuscleBadge}>
                <Text style={styles.secondaryBadgeText}>
                  <Ionicons name="star-outline" size={12} color="#ccc" /> {exercise.secondaryMuscleGroups.join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.equipmentBadge}>
              <Text style={styles.badgeText}>{exercise.equipment}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
              <Text style={styles.badgeText}>{exercise.difficulty}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{exercise.description}</Text>
          </View>

          {/* Instructions */}
          {exercise.instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instrucciones</Text>
              <Text style={styles.instructionsText}>{exercise.instructions}</Text>
            </View>
          )}

          {/* Tips */}
          {exercise.tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consejos</Text>
              <Text style={styles.tipsText}>{exercise.tips}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    backgroundColor: '#181818',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: windowHeight * 0.4,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  noVideoText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
  },
  noVideoSubtext: {
    color: COLORS.gray,
    fontSize: SIZES.fontRegular,
    textAlign: 'center',
    marginTop: SIZES.padding / 2,
  },
  exerciseInfo: {
    padding: SIZES.padding,
  },
  exerciseName: {
    color: COLORS.white,
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    marginBottom: SIZES.padding,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.padding,
  },
  muscleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  secondaryMuscleBadge: {
    backgroundColor: '#333',
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  equipmentBadge: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
  },
  secondaryBadgeText: {
    color: '#ccc',
    fontSize: SIZES.fontSmall,
    fontWeight: '500',
  },
  section: {
    marginBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginBottom: SIZES.padding / 2,
  },
  descriptionText: {
    color: COLORS.gray,
    fontSize: SIZES.fontRegular,
    lineHeight: 24,
  },
  instructionsText: {
    color: COLORS.gray,
    fontSize: SIZES.fontRegular,
    lineHeight: 24,
  },
  tipsText: {
    color: COLORS.gray,
    fontSize: SIZES.fontRegular,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  videoPlaceholderText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
  },
  videoPlaceholderSubtext: {
    color: COLORS.gray,
    fontSize: SIZES.fontRegular,
    textAlign: 'center',
    marginTop: SIZES.padding / 2,
  },
});

export default ExerciseVideoScreen; 