import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { serverTimestamp } from 'firebase/firestore';

interface Exercise {
  id: string;
  name: string;
  mediaType?: string;
  mediaURL?: string;
  imageURL?: string;
  thumbnailURL?: string;
}

class ExerciseMediaFixService {
  /**
   * Encuentra ejercicios con inconsistencias en mediaType y mediaURL
   */
  async findMediaInconsistencies(): Promise<Exercise[]> {
    try {
      console.log('🔍 Buscando inconsistencias en medios...');
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      const inconsistencies: Exercise[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const exercise: Exercise = {
          id: doc.id,
          name: data.name || '',
          mediaType: data.mediaType,
          mediaURL: data.mediaURL,
          imageURL: data.imageURL,
          thumbnailURL: data.thumbnailURL,
        };
        
        // Detectar inconsistencias
        if (exercise.mediaType === 'video' && exercise.mediaURL) {
          if (exercise.mediaURL.includes('.jpg') || exercise.mediaURL.includes('.jpeg') || exercise.mediaURL.includes('.png')) {
            inconsistencies.push(exercise);
            console.log(`❌ Inconsistencia encontrada: ${exercise.name} - mediaType: video, mediaURL: ${exercise.mediaURL}`);
          }
        }
      });
      
      console.log(`📊 Total de inconsistencias encontradas: ${inconsistencies.length}`);
      return inconsistencies;
    } catch (error) {
      console.error('❌ Error buscando inconsistencias:', error);
      throw error;
    }
  }

  /**
   * Arregla las URLs de medios inconsistentes
   */
  async fixMediaURLs(): Promise<{ fixed: number; errors: number }> {
    try {
      console.log('🔧 Iniciando arreglo de URLs de medios...');
      
      const inconsistencies = await this.findMediaInconsistencies();
      let fixed = 0;
      let errors = 0;
      
      for (const exercise of inconsistencies) {
        try {
          // Buscar el video correspondiente en Firebase Storage
          const videoURL = await this.findVideoURL(exercise);
          
          if (videoURL) {
            // Actualizar el documento en Firestore
            const exerciseRef = doc(db, 'exercises', exercise.id);
            await updateDoc(exerciseRef, {
              mediaURL: videoURL,
              updatedAt: new Date()
            });
            
            console.log(`✅ Arreglado: ${exercise.name} - Nueva URL: ${videoURL}`);
            fixed++;
          } else {
            console.log(`⚠️ No se encontró video para: ${exercise.name}`);
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error arreglando ${exercise.name}:`, error);
          errors++;
        }
      }
      
      console.log(`📊 Resultado: ${fixed} arreglados, ${errors} errores`);
      return { fixed, errors };
    } catch (error) {
      console.error('❌ Error en fixMediaURLs:', error);
      throw error;
    }
  }

  /**
   * Busca la URL del video correspondiente
   */
  private async findVideoURL(exercise: Exercise): Promise<string | null> {
    try {
      // Estrategia 1: Buscar en la misma carpeta pero con extensión .mp4
      if (exercise.mediaURL) {
        const baseURL = exercise.mediaURL.split('?')[0]; // Remover parámetros
        const videoURL = baseURL.replace(/\.(jpg|jpeg|png)$/, '.mp4');
        
        // Verificar si el video existe haciendo una petición HEAD
        const response = await fetch(videoURL, { method: 'HEAD' });
        if (response.ok) {
          return videoURL;
        }
      }
      
      // Estrategia 2: Buscar en la carpeta videos
      if (exercise.mediaURL) {
        const baseURL = exercise.mediaURL.split('?')[0];
        const pathParts = baseURL.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const videoFileName = fileName.replace(/\.(jpg|jpeg|png)$/, '.mp4');
        
        // Construir URL en carpeta videos
        const videoURL = baseURL.replace('/images/', '/videos/').replace(fileName, videoFileName);
        
        const response = await fetch(videoURL, { method: 'HEAD' });
        if (response.ok) {
          return videoURL;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error buscando video URL:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de medios
   */
  async getMediaStats(): Promise<{
    total: number;
    videos: number;
    images: number;
    inconsistencies: number;
    noMedia: number;
  }> {
    try {
      console.log('📊 Obteniendo estadísticas de medios...');
      
      const exercisesRef = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesRef);
      
      let total = 0;
      let videos = 0;
      let images = 0;
      let inconsistencies = 0;
      let noMedia = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        
        if (data.mediaType === 'video' && data.mediaURL) {
          if (data.mediaURL.includes('.mp4')) {
            videos++;
          } else {
            inconsistencies++;
          }
        } else if (data.mediaType === 'image' && data.mediaURL) {
          images++;
        } else if (!data.mediaURL) {
          noMedia++;
        }
      });
      
      const stats = { total, videos, images, inconsistencies, noMedia };
      console.log('📊 Estadísticas de medios:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

/**
 * Genera thumbnails automáticamente para ejercicios que no los tienen
 */
export async function generateMissingThumbnails(): Promise<{ generated: number; errors: number }> {
  try {
    console.log('🔄 Iniciando generación de thumbnails faltantes...');
    
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    let generated = 0;
    let errors = 0;
    
    for (const docSnap of snapshot.docs) {
      try {
        const exercise = { id: docSnap.id, ...docSnap.data() };
        
        // Solo procesar ejercicios que no tienen thumbnail pero sí tienen imagen
        if (!exercise.thumbnailURL && exercise.imageURL && exercise.imageURL.startsWith('https://')) {
          console.log(`📸 Generando thumbnail para: ${exercise.name}`);
          
          // Crear thumbnail URL basado en la imagen existente
          // Esto es un placeholder - en una implementación real necesitarías
          // un servicio de procesamiento de imágenes
          const thumbnailURL = exercise.imageURL; // Por ahora usar la misma imagen
          
          // Actualizar el ejercicio con el thumbnail
          await updateDoc(doc(db, 'exercises', exercise.id), {
            thumbnailURL: thumbnailURL,
            updatedAt: serverTimestamp()
          });
          
          generated++;
          console.log(`✅ Thumbnail generado para: ${exercise.name}`);
        }
      } catch (error) {
        console.error(`❌ Error generando thumbnail para ejercicio ${docSnap.id}:`, error);
        errors++;
      }
    }
    
    console.log(`📊 Thumbnails generados: ${generated}, Errores: ${errors}`);
    return { generated, errors };
    
  } catch (error) {
    console.error('❌ Error en generateMissingThumbnails:', error);
    throw error;
  }
}

/**
 * Migra imágenes de mediaURL a imageURL para ejercicios que no tienen imageURL
 */
export async function migrateMediaURLToImageURL(): Promise<{ migrated: number; errors: number }> {
  try {
    console.log('🔄 Iniciando migración de mediaURL a imageURL...');
    
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    let migrated = 0;
    let errors = 0;
    
    for (const docSnap of snapshot.docs) {
      try {
        const exercise = { id: docSnap.id, ...docSnap.data() };
        
        // Solo procesar ejercicios que tienen mediaURL de imagen pero no imageURL
        if (exercise.mediaURL && 
            exercise.mediaType === 'image' && 
            exercise.mediaURL.startsWith('https://') && 
            !exercise.imageURL) {
          
          console.log(`🔄 Migrando imagen para: ${exercise.name}`);
          
          // Copiar mediaURL a imageURL
          await updateDoc(doc(db, 'exercises', exercise.id), {
            imageURL: exercise.mediaURL,
            updatedAt: serverTimestamp()
          });
          
          migrated++;
          console.log(`✅ Imagen migrada para: ${exercise.name}`);
        }
      } catch (error) {
        console.error(`❌ Error migrando imagen para ejercicio ${docSnap.id}:`, error);
        errors++;
      }
    }
    
    console.log(`📊 Imágenes migradas: ${migrated}, Errores: ${errors}`);
    return { migrated, errors };
    
  } catch (error) {
    console.error('❌ Error en migrateMediaURLToImageURL:', error);
    throw error;
  }
}

export const exerciseMediaFixService = new ExerciseMediaFixService(); 