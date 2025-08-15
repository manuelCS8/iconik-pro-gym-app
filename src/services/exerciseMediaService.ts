import { uploadFile, generateStoragePath, validateFile } from './storage';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export interface ExerciseMedia {
  id?: string;
  exerciseId: string;
  mediaType: 'image' | 'video';
  mediaURL: string;
  thumbnailURL?: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Selecciona una imagen desde la galería
 */
export async function pickImage(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error seleccionando imagen:', error);
    return null;
  }
}

/**
 * Selecciona un video desde la galería
 */
export async function pickVideo(): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error seleccionando video:', error);
    return null;
  }
}

/**
 * Selecciona un archivo usando DocumentPicker
 */
export async function pickDocument(): Promise<{ uri: string; name: string; size: number } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      return {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        size: result.assets[0].size || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error seleccionando documento:', error);
    return null;
  }
}

/**
 * Sube una imagen para un ejercicio
 */
export async function uploadExerciseImage(
  exerciseId: string,
  imageUri: string,
  fileName: string,
  uploadedBy: string,
  onProgress?: (progress: number) => void
): Promise<ExerciseMedia> {
  try {
    // Validar archivo
    const fileInfo = await getFileInfo(imageUri);
    const validation = validateFile(fileName, fileInfo.size, 10 * 1024 * 1024); // 10MB max
    
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generar ruta en Storage
    const storagePath = generateStoragePath(fileName, `exercises/${exerciseId}/images`);
    
    // Subir archivo
    const uploadResult = await uploadFile(imageUri, storagePath, (progress) => {
      if (onProgress) {
        onProgress(progress.percent);
      }
    });

    // Crear documento en Firestore
    const mediaData: Omit<ExerciseMedia, 'id'> = {
      exerciseId,
      mediaType: 'image',
      mediaURL: uploadResult.url,
      storagePath: uploadResult.path,
      fileName,
      fileSize: fileInfo.size,
      uploadedAt: new Date(),
      uploadedBy,
    };

    const docRef = await addDoc(collection(db, 'exerciseMedia'), mediaData);
    
    return {
      id: docRef.id,
      ...mediaData,
    };
  } catch (error) {
    console.error('Error subiendo imagen de ejercicio:', error);
    throw error;
  }
}

/**
 * Sube un video para un ejercicio
 */
export async function uploadExerciseVideo(
  exerciseId: string,
  videoUri: string,
  fileName: string,
  uploadedBy: string,
  onProgress?: (progress: number) => void
): Promise<ExerciseMedia> {
  try {
    // Validar archivo
    const fileInfo = await getFileInfo(videoUri);
    const validation = validateFile(fileName, fileInfo.size, 100 * 1024 * 1024); // 100MB max
    
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generar ruta en Storage
    const storagePath = generateStoragePath(fileName, `exercises/${exerciseId}/videos`);
    
    // Subir archivo
    const uploadResult = await uploadFile(videoUri, storagePath, (progress) => {
      if (onProgress) {
        onProgress(progress.percent);
      }
    });

    // Crear documento en Firestore
    const mediaData: Omit<ExerciseMedia, 'id'> = {
      exerciseId,
      mediaType: 'video',
      mediaURL: uploadResult.url,
      storagePath: uploadResult.path,
      fileName,
      fileSize: fileInfo.size,
      uploadedAt: new Date(),
      uploadedBy,
    };

    const docRef = await addDoc(collection(db, 'exerciseMedia'), mediaData);
    
    return {
      id: docRef.id,
      ...mediaData,
    };
  } catch (error) {
    console.error('Error subiendo video de ejercicio:', error);
    throw error;
  }
}

/**
 * Actualiza el ejercicio con la URL del media
 */
export async function updateExerciseWithMedia(
  exerciseId: string,
  mediaURL: string,
  mediaType: 'image' | 'video'
): Promise<void> {
  try {
    const exerciseRef = doc(db, 'exercises', exerciseId);
    await updateDoc(exerciseRef, {
      mediaURL,
      mediaType,
      updatedAt: new Date(),
    });
    
    console.log('✅ Ejercicio actualizado con media:', exerciseId);
  } catch (error) {
    console.error('Error actualizando ejercicio con media:', error);
    throw error;
  }
}

/**
 * Obtiene información de un archivo
 */
async function getFileInfo(uri: string): Promise<{ size: number }> {
  try {
    const response = await fetch(uri);
    const headers = response.headers;
    const contentLength = headers.get('content-length');
    
    return {
      size: contentLength ? parseInt(contentLength) : 0,
    };
  } catch (error) {
    console.error('Error obteniendo información del archivo:', error);
    return { size: 0 };
  }
}

/**
 * Migra videos locales a Firebase Storage
 */
export async function migrateLocalVideosToStorage(
  exerciseId: string,
  localVideoUri: string,
  uploadedBy: string
): Promise<string> {
  try {
    console.log('🔄 Migrando video local a Firebase Storage:', exerciseId);
    
    // Generar nombre de archivo
    const fileName = `migrated_video_${Date.now()}.mp4`;
    
    // Subir video
    const mediaData = await uploadExerciseVideo(
      exerciseId,
      localVideoUri,
      fileName,
      uploadedBy
    );
    
    // Actualizar ejercicio
    await updateExerciseWithMedia(exerciseId, mediaData.mediaURL, 'video');
    
    console.log('✅ Video migrado exitosamente:', mediaData.mediaURL);
    return mediaData.mediaURL;
  } catch (error) {
    console.error('Error migrando video:', error);
    throw error;
  }
} 