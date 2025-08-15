import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadFile, generateStoragePath } from './storage';

interface Exercise {
  id: string;
  name: string;
  mediaURL?: string;
  mediaType?: string;
  [key: string]: any;
}

/**
 * Migra imágenes/videos de ejercicios existentes a Firebase Storage
 */
export const migrateExerciseMedia = async (onProgress?: (progress: number) => void) => {
  try {
    console.log('🔄 Iniciando migración de media de ejercicios...');
    
    // Obtener todos los ejercicios
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Exercise[];
    
    console.log(`📊 Encontrados ${exercises.length} ejercicios`);
    
    // Filtrar ejercicios que tienen media local
    const exercisesWithLocalMedia = exercises.filter(exercise => 
      exercise.mediaURL && 
      exercise.mediaURL.startsWith('file://') &&
      exercise.mediaType
    );
    
    console.log(`🎬 ${exercisesWithLocalMedia.length} ejercicios con media local encontrados`);
    
    if (exercisesWithLocalMedia.length === 0) {
      console.log('✅ No hay ejercicios que necesiten migración');
      return { success: true, migrated: 0, errors: 0 };
    }
    
    let migrated = 0;
    let errors = 0;
    
    for (let i = 0; i < exercisesWithLocalMedia.length; i++) {
      const exercise = exercisesWithLocalMedia[i];
      
      try {
        console.log(`🔄 Migrando ejercicio ${i + 1}/${exercisesWithLocalMedia.length}: ${exercise.name}`);
        
        // Generar nueva ruta en Storage (más simple)
        const fileName = `migrated_${Date.now()}_${exercise.id}`;
        const storagePath = `exercises/${fileName}`;
        
        // Subir archivo a Firebase Storage
        const result = await uploadFile(exercise.mediaURL!, storagePath);
        
        // Actualizar documento en Firestore
        const exerciseRef = doc(db, 'exercises', exercise.id);
        await updateDoc(exerciseRef, {
          mediaURL: result.url,
          migratedAt: new Date(),
          originalMediaURL: exercise.mediaURL // Guardar URL original como backup
        });
        
        console.log(`✅ Ejercicio migrado: ${exercise.name} -> ${result.url}`);
        migrated++;
        
        // Actualizar progreso
        if (onProgress) {
          onProgress(((i + 1) / exercisesWithLocalMedia.length) * 100);
        }
        
      } catch (error) {
        console.error(`❌ Error migrando ejercicio ${exercise.name}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Migración completada: ${migrated} exitosas, ${errors} errores`);
    
    return {
      success: true,
      migrated,
      errors,
      total: exercisesWithLocalMedia.length
    };
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Verifica el estado de migración de ejercicios
 */
export const checkMigrationStatus = async () => {
  try {
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Exercise[];
    
    const stats = {
      total: exercises.length,
      withLocalMedia: 0,
      withFirebaseMedia: 0,
      withoutMedia: 0,
      migrated: 0
    };
    
    exercises.forEach(exercise => {
      if (!exercise.mediaURL) {
        stats.withoutMedia++;
      } else if (exercise.mediaURL.startsWith('file://')) {
        stats.withLocalMedia++;
      } else if (exercise.mediaURL.startsWith('https://')) {
        stats.withFirebaseMedia++;
        if (exercise.migratedAt) {
          stats.migrated++;
        }
      }
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Error verificando estado de migración:', error);
    throw error;
  }
}; 