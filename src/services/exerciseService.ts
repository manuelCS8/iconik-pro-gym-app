import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Exercise {
  id?: string;
  name: string;
  description: string;
  category: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions: string[];
  tips: string[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface CreateExerciseData {
  name: string;
  description: string;
  category: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  videoFile?: File;
  thumbnailFile?: File;
}

class ExerciseService {
  // Crear ejercicio
  async createExercise(adminUid: string, exerciseData: CreateExerciseData): Promise<string> {
    try {
      let videoUrl = '';
      let thumbnailUrl = '';

      // Subir video si existe
      if (exerciseData.videoFile) {
        videoUrl = await this.uploadVideo(exerciseData.videoFile, exerciseData.name);
      }

      // Subir miniatura si existe
      if (exerciseData.thumbnailFile) {
        thumbnailUrl = await this.uploadThumbnail(exerciseData.thumbnailFile, exerciseData.name);
      }

      // Crear documento en Firestore
      const exerciseRef = await addDoc(collection(db, 'exercises'), {
        ...exerciseData,
        videoUrl,
        thumbnailUrl,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
        isActive: true
      });

      return exerciseRef.id;
    } catch (error: any) {
      console.error('Error creando ejercicio:', error);
      throw error;
    }
  }

  // Obtener todos los ejercicios
  async getAllExercises(): Promise<Exercise[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(exercisesRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Exercise;
      });
    } catch (error: any) {
      console.error('Error obteniendo ejercicios:', error);
      throw error;
    }
  }

  // Obtener ejercicio por ID
  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const exerciseRef = doc(db, 'exercises', id);
      const exerciseSnap = await getDoc(exerciseRef);
      
      if (exerciseSnap.exists()) {
        const data = exerciseSnap.data();
        return {
          id: exerciseSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Exercise;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error obteniendo ejercicio:', error);
      throw error;
    }
  }

  // Actualizar ejercicio
  async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    try {
      const exerciseRef = doc(db, 'exercises', id);
      await updateDoc(exerciseRef, updates);
    } catch (error: any) {
      console.error('Error actualizando ejercicio:', error);
      throw error;
    }
  }

  // Eliminar ejercicio (soft delete)
  async deleteExercise(id: string): Promise<void> {
    try {
      const exerciseRef = doc(db, 'exercises', id);
      await updateDoc(exerciseRef, { isActive: false });
    } catch (error: any) {
      console.error('Error eliminando ejercicio:', error);
      throw error;
    }
  }

  // Obtener ejercicios por categoría
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(
        exercisesRef, 
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Exercise;
      });
    } catch (error: any) {
      console.error('Error obteniendo ejercicios por categoría:', error);
      throw error;
    }
  }

  // Obtener ejercicios por grupo muscular
  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(
        exercisesRef, 
        where('muscleGroups', 'array-contains', muscleGroup),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Exercise;
      });
    } catch (error: any) {
      console.error('Error obteniendo ejercicios por grupo muscular:', error);
      throw error;
    }
  }

  // Subir video
  private async uploadVideo(file: File, exerciseName: string): Promise<string> {
    try {
      const fileName = `exercises/videos/${exerciseName.replace(/\s+/g, '_')}_${Date.now()}.mp4`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error subiendo video:', error);
      throw error;
    }
  }

  // Subir miniatura
  private async uploadThumbnail(file: File, exerciseName: string): Promise<string> {
    try {
      const fileName = `exercises/thumbnails/${exerciseName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error subiendo miniatura:', error);
      throw error;
    }
  }

  // Eliminar archivos de storage
  async deleteExerciseFiles(videoUrl: string, thumbnailUrl: string): Promise<void> {
    try {
      if (videoUrl) {
        const videoRef = ref(storage, videoUrl);
        await deleteObject(videoRef);
      }
      
      if (thumbnailUrl) {
        const thumbnailRef = ref(storage, thumbnailUrl);
        await deleteObject(thumbnailRef);
      }
    } catch (error: any) {
      console.error('Error eliminando archivos:', error);
      throw error;
    }
  }

  // Obtener categorías disponibles
  async getCategories(): Promise<string[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(exercisesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const categories = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error: any) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  // Obtener grupos musculares disponibles
  async getMuscleGroups(): Promise<string[]> {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(exercisesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const muscleGroups = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.muscleGroups && Array.isArray(data.muscleGroups)) {
          data.muscleGroups.forEach((group: string) => muscleGroups.add(group));
        }
      });
      
      return Array.from(muscleGroups).sort();
    } catch (error: any) {
      console.error('Error obteniendo grupos musculares:', error);
      throw error;
    }
  }
}

export const exerciseService = new ExerciseService(); 