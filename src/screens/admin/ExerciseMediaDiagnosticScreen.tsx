import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../utils/theme';
import { exerciseMediaFixService, generateMissingThumbnails, migrateMediaURLToImageURL } from '../../services/exerciseMediaFixService';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface MediaStats {
  total: number;
  videos: number;
  images: number;
  inconsistencies: number;
  noMedia: number;
}

const ExerciseMediaDiagnosticScreen: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    withMedia: 0,
    withImages: 0,
    withVideos: 0,
    withThumbnails: 0,
    withImageURL: 0,
    noMedia: 0,
  });
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isMigratingImages, setIsMigratingImages] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const mediaStats = await exerciseMediaFixService.getMediaStats();
      setStats(mediaStats);
      
      const inconsistenciesList = await exerciseMediaFixService.findMediaInconsistencies();
      setInconsistencies(inconsistenciesList);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeExercises = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Iniciando análisis de ejercicios...');
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📊 Analizando ${exercises.length} ejercicios...`);
      
      let stats = {
        total: exercises.length,
        withMedia: 0,
        withImages: 0,
        withVideos: 0,
        withThumbnails: 0,
        withImageURL: 0,
        noMedia: 0,
      };
      
      const inconsistencies: any[] = [];
      
      exercises.forEach(exercise => {
        const hasMedia = !!(exercise.mediaURL && exercise.mediaURL.trim());
        const hasThumbnail = !!(exercise.thumbnailURL && exercise.thumbnailURL.trim());
        const hasImageURL = !!(exercise.imageURL && exercise.imageURL.trim());
        const isImage = exercise.mediaType === 'image' || exercise.mediaType?.startsWith('image/');
        const isVideo = exercise.mediaType === 'video' || exercise.mediaType?.startsWith('video/');
        
        if (hasMedia) {
          stats.withMedia++;
          if (isImage) stats.withImages++;
          if (isVideo) stats.withVideos++;
        }
        
        if (hasThumbnail) {
          stats.withThumbnails++;
        }
        
        if (hasImageURL) {
          stats.withImageURL++;
        }
        
        if (!hasMedia && !hasThumbnail && !hasImageURL) {
          stats.noMedia++;
        }
        
        // Detectar inconsistencias
        if (isVideo && exercise.mediaURL && exercise.mediaURL.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          inconsistencies.push({
            id: exercise.id,
            name: exercise.name,
            mediaURL: exercise.mediaURL,
            mediaType: exercise.mediaType,
            issue: 'Marcado como video pero URL es imagen'
          });
        }
        
        if (isImage && exercise.mediaURL && exercise.mediaURL.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
          inconsistencies.push({
            id: exercise.id,
            name: exercise.name,
            mediaURL: exercise.mediaURL,
            mediaType: exercise.mediaType,
            issue: 'Marcado como imagen pero URL es video'
          });
        }
      });
      
      console.log('📈 Estadísticas calculadas:', stats);
      console.log('⚠️ Inconsistencias encontradas:', inconsistencies.length);
      
      setStats(stats);
      setInconsistencies(inconsistencies);
      
    } catch (error) {
      console.error('❌ Error analizando ejercicios:', error);
      Alert.alert('Error', 'No se pudo analizar los ejercicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixMediaURLs = async () => {
    Alert.alert(
      'Confirmar Arreglo',
      `¿Estás seguro de que quieres arreglar ${inconsistencies.length} inconsistencias de medios?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arreglar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsFixing(true);
              const result = await exerciseMediaFixService.fixMediaURLs();
              
              Alert.alert(
                'Arreglo Completado',
                `✅ ${result.fixed} arreglados\n❌ ${result.errors} errores`,
                [{ text: 'OK', onPress: analyzeExercises }]
              );
            } catch (error) {
              console.error('Error arreglando medios:', error);
              Alert.alert('Error', 'No se pudieron arreglar los medios');
            } finally {
              setIsFixing(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateThumbnails = async () => {
    Alert.alert(
      'Confirmar Generación',
      '¿Estás seguro de que quieres generar thumbnails para ejercicios que no los tienen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          style: 'default',
          onPress: async () => {
            try {
              setIsGeneratingThumbnails(true);
              const result = await generateMissingThumbnails();
              
              Alert.alert(
                'Generación Completada',
                `✅ ${result.generated} thumbnails generados\n❌ ${result.errors} errores`,
                [{ text: 'OK', onPress: analyzeExercises }]
              );
            } catch (error) {
              console.error('Error generando thumbnails:', error);
              Alert.alert('Error', 'No se pudieron generar los thumbnails');
            } finally {
              setIsGeneratingThumbnails(false);
            }
          },
        },
      ]
    );
  };

  const handleMigrateImages = async () => {
    Alert.alert(
      'Confirmar Migración',
      '¿Estás seguro de que quieres migrar mediaURL a imageURL para ejercicios que no tienen imageURL?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Migrar',
          style: 'default',
          onPress: async () => {
            try {
              setIsMigratingImages(true);
              const result = await migrateMediaURLToImageURL();
              
              Alert.alert(
                'Migración Completada',
                `✅ ${result.migrated} imágenes migradas\n❌ ${result.errors} errores`,
                [{ text: 'OK', onPress: analyzeExercises }]
              );
            } catch (error) {
              console.error('Error migrando imágenes:', error);
              Alert.alert('Error', 'No se pudieron migrar las imágenes');
            } finally {
              setIsMigratingImages(false);
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnóstico de Medios</Text>
        <Text style={styles.subtitle}>Análisis de videos e imágenes de ejercicios</Text>
      </View>

      {/* Estadísticas Generales */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Estadísticas Generales</Text>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={analyzeExercises}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#fff" />
            )}
            <Text style={styles.analyzeButtonText}>
              {isLoading ? 'Analizando...' : 'Analizar Ejercicios'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Ejercicios"
            value={stats.total}
            color={COLORS.primary}
            icon="fitness"
          />
          <StatCard
            title="Con Media"
            value={stats.withMedia}
            color={COLORS.success}
            icon="checkmark-circle"
          />
          <StatCard
            title="Sin Media"
            value={stats.noMedia}
            color={COLORS.gray}
            icon="close-circle"
          />
          <StatCard
            title="Videos"
            value={stats.withVideos}
            color={COLORS.success}
            icon="videocam"
          />
          <StatCard
            title="Imágenes"
            value={stats.withImages}
            color={COLORS.info}
            icon="image"
          />
          <StatCard
            title="Thumbnails"
            value={stats.withThumbnails}
            color={COLORS.warning}
            icon="images"
          />
          <StatCard
            title="ImageURL"
            value={stats.withImageURL}
            color={COLORS.secondary}
            icon="link"
          />
        </View>
      </View>

      {/* Acciones de Migración */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔧 Acciones de Migración</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, isMigratingImages && styles.actionButtonDisabled]}
            onPress={handleMigrateImages}
            disabled={isMigratingImages}
          >
            {isMigratingImages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="images" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isMigratingImages ? 'Migrando...' : 'Migrar mediaURL → imageURL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isGeneratingThumbnails && styles.actionButtonDisabled]}
            onPress={handleGenerateThumbnails}
            disabled={isGeneratingThumbnails}
          >
            {isGeneratingThumbnails ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="image" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isGeneratingThumbnails ? 'Generando...' : 'Generar Thumbnails Faltantes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inconsistencias */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚠️ Inconsistencias Detectadas</Text>
          <Text style={styles.inconsistencyCount}>{inconsistencies.length}</Text>
        </View>
        
        {inconsistencies.length > 0 ? (
          <>
            <Text style={styles.sectionDescription}>
              Ejercicios marcados como "video" pero con URL de imagen
            </Text>
            
            <TouchableOpacity
              style={[styles.fixButton, isFixing && styles.fixButtonDisabled]}
              onPress={handleFixMediaURLs}
              disabled={isFixing}
            >
              {isFixing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="construct" size={20} color="#fff" />
              )}
              <Text style={styles.fixButtonText}>
                {isFixing ? 'Arreglando...' : 'Arreglar Inconsistencias'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inconsistenciesList}>
              {inconsistencies.slice(0, 10).map((exercise, index) => (
                <View key={exercise.id} style={styles.inconsistencyItem}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseURL} numberOfLines={1}>
                    {exercise.mediaURL}
                  </Text>
                </View>
              ))}
              {inconsistencies.length > 10 && (
                <Text style={styles.moreText}>
                  ... y {inconsistencies.length - 10} más
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noIssuesContainer}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.noIssuesText}>¡No hay inconsistencias!</Text>
            <Text style={styles.noIssuesSubtext}>
              Todos los medios están correctamente configurados
            </Text>
          </View>
        )}
      </View>

      {/* Botón de Recarga */}
      <TouchableOpacity style={styles.reloadButton} onPress={loadStats}>
        <Ionicons name="refresh" size={20} color={COLORS.primary} />
        <Text style={styles.reloadButtonText}>Recargar Estadísticas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
  },
  header: {
    marginBottom: SIZES.padding * 2,
  },
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding / 2,
  },
  subtitle: {
    fontSize: SIZES.fontMedium,
    color: COLORS.gray,
  },
  section: {
    marginBottom: SIZES.padding * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  sectionDescription: {
    fontSize: SIZES.fontMedium,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  inconsistencyCount: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.error,
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  statTitle: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    marginLeft: SIZES.padding / 2,
  },
  statValue: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  fixButtonDisabled: {
    opacity: 0.6,
  },
  fixButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginLeft: SIZES.padding / 2,
  },
  inconsistenciesList: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  inconsistencyItem: {
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  exerciseName: {
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding / 4,
  },
  exerciseURL: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
  moreText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: SIZES.fontMedium,
    marginTop: SIZES.padding,
  },
  noIssuesContainer: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
  },
  noIssuesText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: SIZES.padding,
  },
  noIssuesSubtext: {
    fontSize: SIZES.fontMedium,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SIZES.padding / 2,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SIZES.padding,
  },
  reloadButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginLeft: SIZES.padding / 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    marginLeft: SIZES.padding / 2,
  },
  actionButtons: {
    gap: SIZES.padding,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontMedium,
    fontWeight: 'bold',
    marginLeft: SIZES.padding / 2,
  },
});

export default ExerciseMediaDiagnosticScreen; 