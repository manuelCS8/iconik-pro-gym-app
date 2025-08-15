import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: any;
}

/**
 * Sube un archivo a Firebase Storage con progreso
 * @param uri - URI local del archivo
 * @param storagePath - Ruta en Firebase Storage
 * @param onProgress - Callback para el progreso (opcional)
 * @returns Promise con la URL de descarga
 */
export async function uploadFile(
  uri: string,
  storagePath: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 1) Obtener el blob del archivo
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Error al leer el archivo');
    }
    const blob = await response.blob();

    // 2) Crear referencia en Storage
    const storageRef = ref(storage, storagePath);

    // 3) Subir con progreso
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percent: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Error en la subida:', error);
          reject(error);
        },
        async () => {
          try {
            // 4) Obtener URL de descarga
            const downloadURL = await getDownloadURL(storageRef);
            const metadata = uploadTask.snapshot.metadata;
            
            resolve({
              url: downloadURL,
              path: storagePath,
              metadata,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error en uploadFile:', error);
    throw error;
  }
}

/**
 * Sube múltiples archivos a Firebase Storage
 * @param files - Array de URIs de archivos
 * @param basePath - Ruta base en Storage
 * @param onProgress - Callback para el progreso total
 * @returns Promise con array de URLs
 */
export async function uploadMultipleFiles(
  files: string[],
  basePath: string,
  onProgress?: (overallProgress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completedFiles = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `file_${Date.now()}_${i}`;
    const storagePath = `${basePath}/${fileName}`;

    try {
      const result = await uploadFile(file, storagePath, (progress) => {
        // Calcular progreso total
        const overallProgress = ((completedFiles + progress.percent / 100) / files.length) * 100;
        if (onProgress) {
          onProgress(overallProgress);
        }
      });

      results.push(result);
      completedFiles++;
    } catch (error) {
      console.error(`Error subiendo archivo ${i}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Elimina un archivo de Firebase Storage
 * @param storagePath - Ruta del archivo en Storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    console.log('Archivo eliminado:', storagePath);
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    throw error;
  }
}

/**
 * Elimina múltiples archivos de Firebase Storage
 * @param storagePaths - Array de rutas de archivos
 */
export async function deleteMultipleFiles(storagePaths: string[]): Promise<void> {
  try {
    const deletePromises = storagePaths.map(path => deleteFile(path));
    await Promise.all(deletePromises);
    console.log('Archivos eliminados:', storagePaths.length);
  } catch (error) {
    console.error('Error eliminando archivos:', error);
    throw error;
  }
}

/**
 * Genera una ruta única para un archivo
 * @param fileName - Nombre original del archivo
 * @param folder - Carpeta en Storage
 * @returns Ruta única
 */
export function generateStoragePath(fileName: string, folder: string = 'uploads'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop() || '';
  return `${folder}/${timestamp}_${randomId}.${extension}`;
}

/**
 * Obtiene la extensión de un archivo
 * @param fileName - Nombre del archivo
 * @returns Extensión del archivo
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Verifica si un archivo es una imagen
 * @param fileName - Nombre del archivo
 * @returns true si es imagen
 */
export function isImage(fileName: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const extension = getFileExtension(fileName);
  return imageExtensions.includes(extension);
}

/**
 * Verifica si un archivo es un video
 * @param fileName - Nombre del archivo
 * @returns true si es video
 */
export function isVideo(fileName: string): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const extension = getFileExtension(fileName);
  return videoExtensions.includes(extension);
}

/**
 * Formatea el tamaño de un archivo
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Valida un archivo antes de subirlo
 * @param fileName - Nombre del archivo
 * @param fileSize - Tamaño del archivo en bytes
 * @param maxSize - Tamaño máximo permitido en bytes
 * @returns true si es válido
 */
export function validateFile(
  fileName: string, 
  fileSize: number, 
  maxSize: number = 50 * 1024 * 1024 // 50MB por defecto
): { isValid: boolean; error?: string } {
  // Verificar tamaño
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `El archivo es muy grande. Máximo ${formatFileSize(maxSize)}`
    };
  }

  // Verificar extensión
  const extension = getFileExtension(fileName);
  const allowedExtensions = [
    // Imágenes
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
    // Videos
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'
  ];

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no permitido'
    };
  }

  return { isValid: true };
} 