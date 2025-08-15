import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS, SIZES } from '../../utils/theme';

interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups?: string[];
  mediaType?: string;
  mediaURL?: string;
  thumbnailURL?: string;
  imageURL?: string;
}

const TestThumbnailsScreen: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando ejercicios para prueba de thumbnails...');
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const exercisesData: Exercise[] = [];
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) {
                          exercisesData.push({
                  id: docSnap.id,
                  name: data.name,
                  primaryMuscleGroups: Array.isArray(data.primaryMuscleGroups) 
                    ? data.primaryMuscleGroups 
                    : [],
                  secondaryMuscleGroups: Array.isArray(data.secondaryMuscleGroups) 
                    ? data.secondaryMuscleGroups 
                    : [],
                  mediaType: data.mediaType || '',
                  mediaURL: data.mediaURL || '',
                  thumbnailURL: data.thumbnailURL || '',
                  imageURL: data.imageURL || '',
                });
        }
      });
      
      console.log(`✅ ${exercisesData.length} ejercicios cargados para prueba`);
      setExercises(exercisesData);
      
    } catch (error) {
      console.error('❌ Error cargando ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setIsLoading(false);
    }
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

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
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
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image
              source={{ uri: imageSource }}
              style={styles.exerciseImage}
              resizeMode="cover"
              onError={() => {
                console.log(`❌ Error cargando imagen (${imageType}) para: ${item.name}`);
              }}
              onLoad={() => {
                console.log(`✅ Imagen cargada (${imageType}) para: ${item.name}`);
              }}
            />
          ) : (
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
          <View style={styles.urlInfo}>
            <Text style={styles.urlText}>
              ImageURL: {item.imageURL ? '✅' : '❌'}
            </Text>
            <Text style={styles.urlText}>
              MediaURL: {item.mediaURL ? '✅' : '❌'}
            </Text>
            <Text style={styles.urlText}>
              ThumbnailURL: {item.thumbnailURL ? '✅' : '❌'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando ejercicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prueba de Thumbnails</Text>
        <Text style={styles.subtitle}>
          Verificando visualización de imágenes en ejercicios
        </Text>
      </View>

      <FlatList
        data={exercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grayDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayDark,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    marginTop: SIZES.padding,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.padding / 2,
  },
  subtitle: {
    fontSize: SIZES.fontSmall,
    color: COLORS.white,
    opacity: 0.8,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: '#181818',
    borderRadius: 12,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#fff',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: SIZES.fontSmall,
    color: '#666',
    textAlign: 'center',
  },
  cardInfo: {
    padding: SIZES.padding,
    backgroundColor: '#333',
  },
  exerciseName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  muscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginBottom: 8,
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
  },
  primaryMuscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.primary,
    fontWeight: "500",
  },
  secondaryMuscleGroups: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    fontWeight: "400",
  },
  urlInfo: {
    gap: 2,
  },
  urlText: {
    fontSize: SIZES.fontExtraSmall,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
});

export default TestThumbnailsScreen; 