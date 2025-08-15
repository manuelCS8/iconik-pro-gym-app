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
import { db } from '../config/firebase';

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets?: number; // Para compatibilidad con rutinas existentes
  series?: number; // Campo usado en rutinas del gimnasio
  reps: number;
  weight?: number;
  duration?: number; // en segundos
  restTime: number; // en segundos
  notes?: string;
  order?: number; // Orden del ejercicio en la rutina
  primaryMuscleGroups?: string[]; // Grupos musculares principales
  equipment?: string; // Equipo necesario
  difficulty?: string; // Dificultad del ejercicio
}

export interface Routine {
  id?: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // en minutos
  exercises: RoutineExercise[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  isPublic: boolean; // si es visible para todos los miembros
}

export interface CreateRoutineData {
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: RoutineExercise[];
  isPublic: boolean;
}

class RoutineService {
  // Crear rutina
  async createRoutine(adminUid: string, routineData: CreateRoutineData): Promise<string> {
    try {
      const routineRef = await addDoc(collection(db, 'routines'), {
        ...routineData,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
        isActive: true,
        isPublic: true // Hacer pública por defecto
      });

      return routineRef.id;
    } catch (error: any) {
      console.error('Error creando rutina:', error);
      throw error;
    }
  }

  // Obtener todas las rutinas públicas
  async getPublicRoutines(): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(
        routinesRef, 
        where('isActive', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Routine;
      });
    } catch (error: any) {
      console.error('Error obteniendo rutinas públicas:', error);
      throw error;
    }
  }

  // Obtener todas las rutinas (solo para admins)
  async getAllRoutines(): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(routinesRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Routine;
      });
    } catch (error: any) {
      console.error('Error obteniendo todas las rutinas:', error);
      throw error;
    }
  }

  // Obtener rutina por ID
  async getRoutineById(id: string): Promise<Routine | null> {
    try {
      const routineRef = doc(db, 'routines', id);
      const routineSnap = await getDoc(routineRef);
      
      if (routineSnap.exists()) {
        const data = routineSnap.data();
        return {
          id: routineSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Routine;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error obteniendo rutina:', error);
      throw error;
    }
  }

  // Actualizar rutina
  async updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
    try {
      const routineRef = doc(db, 'routines', id);
      await updateDoc(routineRef, updates);
    } catch (error: any) {
      console.error('Error actualizando rutina:', error);
      throw error;
    }
  }

  // Eliminar rutina (soft delete)
  async deleteRoutine(id: string): Promise<void> {
    try {
      const routineRef = doc(db, 'routines', id);
      await updateDoc(routineRef, { isActive: false });
    } catch (error: any) {
      console.error('Error eliminando rutina:', error);
      throw error;
    }
  }

  // Obtener rutinas por categoría
  async getRoutinesByCategory(category: string): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(
        routinesRef, 
        where('category', '==', category),
        where('isActive', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Routine;
      });
    } catch (error: any) {
      console.error('Error obteniendo rutinas por categoría:', error);
      throw error;
    }
  }

  // Obtener rutinas por dificultad
  async getRoutinesByDifficulty(difficulty: string): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(
        routinesRef, 
        where('difficulty', '==', difficulty),
        where('isActive', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Routine;
      });
    } catch (error: any) {
      console.error('Error obteniendo rutinas por dificultad:', error);
      throw error;
    }
  }

  // Obtener categorías de rutinas disponibles
  async getRoutineCategories(): Promise<string[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(
        routinesRef, 
        where('isActive', '==', true),
        where('isPublic', '==', true)
      );
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
      console.error('Error obteniendo categorías de rutinas:', error);
      throw error;
    }
  }

  // Obtener rutinas creadas por un admin específico
  async getRoutinesByAdmin(adminUid: string): Promise<Routine[]> {
    try {
      const routinesRef = collection(db, 'routines');
      const q = query(
        routinesRef, 
        where('createdBy', '==', adminUid),
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
        } as Routine;
      });
    } catch (error: any) {
      console.error('Error obteniendo rutinas por admin:', error);
      throw error;
    }
  }

  // Cambiar visibilidad de rutina
  async toggleRoutineVisibility(id: string, isPublic: boolean): Promise<void> {
    try {
      const routineRef = doc(db, 'routines', id);
      await updateDoc(routineRef, { isPublic });
    } catch (error: any) {
      console.error('Error cambiando visibilidad de rutina:', error);
      throw error;
    }
  }

  // Crear rutinas de ejemplo (solo para desarrollo)
  async createSampleRoutines(adminUid: string): Promise<void> {
    try {
      const sampleRoutines = [
        {
          name: "Rutina de Pecho Principiante",
          description: "Rutina completa para desarrollar el pecho, ideal para principiantes",
          category: "Pecho",
          difficulty: 'beginner' as const,
          duration: 45,
          exercises: [
            {
              exerciseId: "sample1",
              exerciseName: "Press de Banca con Barra",
              sets: 3,
              reps: 12,
              weight: 0,
              restTime: 90,
              notes: "Enfócate en la técnica"
            },
            {
              exerciseId: "sample2", 
              exerciseName: "Flexiones",
              sets: 3,
              reps: 10,
              restTime: 60,
              notes: "Si no puedes hacer 10, haz las que puedas"
            }
          ],
          isPublic: true,
          isActive: true
        },
        {
          name: "Rutina de Piernas Intermedia",
          description: "Rutina intensa para fortalecer las piernas",
          category: "Piernas", 
          difficulty: 'intermediate' as const,
          duration: 60,
          exercises: [
            {
              exerciseId: "sample3",
              exerciseName: "Sentadillas",
              sets: 4,
              reps: 15,
              weight: 0,
              restTime: 120,
              notes: "Mantén la espalda recta"
            },
            {
              exerciseId: "sample4",
              exerciseName: "Peso Muerto",
              sets: 3,
              reps: 12,
              weight: 0,
              restTime: 120,
              notes: "Técnica perfecta antes de aumentar peso"
            }
          ],
          isPublic: true,
          isActive: true
        }
      ];

      for (const routineData of sampleRoutines) {
        await addDoc(collection(db, 'routines'), {
          ...routineData,
          createdBy: adminUid,
          createdAt: serverTimestamp(),
        });
      }

      console.log('✅ Rutinas de ejemplo creadas correctamente');
    } catch (error: any) {
      console.error('Error creando rutinas de ejemplo:', error);
      throw error;
    }
  }
}

export const routineService = new RoutineService(); 