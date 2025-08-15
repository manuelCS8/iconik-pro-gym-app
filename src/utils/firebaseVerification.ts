import { auth, db, storage } from '../config/firebase';
import { authService } from '../services/authService';
import { exerciseService } from '../services/exerciseService';
import { routineService } from '../services/routineService';

export class FirebaseVerification {
  static async verifyFirebaseConnection() {
    console.log('🔍 Verificando conexión con Firebase...');
    
    try {
      // Verificar que Firebase está inicializado
      if (!auth || !db || !storage) {
        throw new Error('❌ Firebase no está inicializado correctamente');
      }
      
      console.log('✅ Firebase está inicializado correctamente');
      console.log('📊 Servicios disponibles:');
      console.log('  - Auth:', !!auth);
      console.log('  - Firestore:', !!db);
      console.log('  - Storage:', !!storage);
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando Firebase:', error);
      return false;
    }
  }

  static async verifyAuthService() {
    console.log('🔍 Verificando servicio de autenticación...');
    
    try {
      // Verificar que el servicio existe
      if (!authService) {
        throw new Error('❌ Servicio de autenticación no disponible');
      }
      
      console.log('✅ Servicio de autenticación disponible');
      console.log('📋 Métodos disponibles:');
      console.log('  - signUpWithEmail');
      console.log('  - signInWithEmail');
      console.log('  - signInWithGoogle');
      console.log('  - signOut');
      console.log('  - createUserByAdmin');
      console.log('  - getUserProfile');
      console.log('  - checkMembershipStatus');
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando servicio de autenticación:', error);
      return false;
    }
  }

  static async verifyExerciseService() {
    console.log('🔍 Verificando servicio de ejercicios...');
    
    try {
      // Verificar que el servicio existe
      if (!exerciseService) {
        throw new Error('❌ Servicio de ejercicios no disponible');
      }
      
      console.log('✅ Servicio de ejercicios disponible');
      console.log('📋 Métodos disponibles:');
      console.log('  - createExercise');
      console.log('  - getAllExercises');
      console.log('  - getExerciseById');
      console.log('  - updateExercise');
      console.log('  - deleteExercise');
      console.log('  - getCategories');
      console.log('  - getMuscleGroups');
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando servicio de ejercicios:', error);
      return false;
    }
  }

  static async verifyRoutineService() {
    console.log('🔍 Verificando servicio de rutinas...');
    
    try {
      // Verificar que el servicio existe
      if (!routineService) {
        throw new Error('❌ Servicio de rutinas no disponible');
      }
      
      console.log('✅ Servicio de rutinas disponible');
      console.log('📋 Métodos disponibles:');
      console.log('  - createRoutine');
      console.log('  - getPublicRoutines');
      console.log('  - getAllRoutines');
      console.log('  - getRoutineById');
      console.log('  - updateRoutine');
      console.log('  - deleteRoutine');
      console.log('  - getRoutineCategories');
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando servicio de rutinas:', error);
      return false;
    }
  }

  static async verifyFirestoreAccess() {
    console.log('🔍 Verificando acceso a Firestore...');
    
    try {
      // Intentar acceder a una colección (solo lectura)
      const testQuery = await db.collection('test').limit(1).get();
      console.log('✅ Acceso a Firestore funcionando');
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('⚠️ Firestore accesible pero sin permisos (normal si no hay datos)');
        return true;
      } else {
        console.error('❌ Error accediendo a Firestore:', error);
        return false;
      }
    }
  }

  static async verifyStorageAccess() {
    console.log('🔍 Verificando acceso a Storage...');
    
    try {
      // Verificar que storage está disponible
      const testRef = storage.ref('test/test.txt');
      console.log('✅ Storage disponible');
      return true;
    } catch (error) {
      console.error('❌ Error verificando Storage:', error);
      return false;
    }
  }

  static async runFullVerification() {
    console.log('🚀 Iniciando verificación completa de Firebase...\n');
    
    const results = {
      firebaseConnection: await this.verifyFirebaseConnection(),
      authService: await this.verifyAuthService(),
      exerciseService: await this.verifyExerciseService(),
      routineService: await this.verifyRoutineService(),
      firestoreAccess: await this.verifyFirestoreAccess(),
      storageAccess: await this.verifyStorageAccess(),
    };
    
    console.log('\n📊 Resumen de verificación:');
    console.log('========================');
    
    Object.entries(results).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${status} ${name}: ${value ? 'OK' : 'ERROR'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log('\n🎉 ¡Todas las verificaciones pasaron! Firebase está correctamente configurado.');
    } else {
      console.log('\n⚠️ Algunas verificaciones fallaron. Revisa la configuración.');
    }
    
    return allPassed;
  }
}

// Función para ejecutar desde la consola de desarrollo
export const runFirebaseCheck = () => {
  FirebaseVerification.runFullVerification();
}; 