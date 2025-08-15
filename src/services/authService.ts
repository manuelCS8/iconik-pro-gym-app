import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: Date;
  membershipType?: 'basic' | 'premium' | 'vip';
  membershipStart?: Date;
  membershipEnd?: Date;
  weight?: number;
  height?: number;
  age?: number;
  isActive: boolean;
  registrationStatus: 'PENDING' | 'COMPLETED';
  createdBy?: string; // ID del admin que creó el usuario
  registrationAttempts?: number; // NUEVO: contador de intentos
}

export interface PendingUser {
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  age: number;
  membershipStart: Date;
  membershipEnd: Date;
  membershipType: 'basic' | 'premium' | 'vip';
  createdAt: Date;
  createdBy: string; // ID del admin que creó el usuario
}

export interface CreateUserData {
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  age: number;
  membershipStart: Date;
  membershipEnd: Date;
  membershipType: 'basic' | 'premium' | 'vip';
}

export interface CompleteRegistrationData {
  email: string;
  displayName: string;
  age: number;
  password: string;
}

class AuthService {
  // Registro con email y contraseña (BLOQUEADO - solo para usuarios pendientes)
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    try {
      // Verificar si existe un usuario pendiente con estos datos
      const pendingUserRef = doc(db, 'pendingUsers', email.toLowerCase());
      const pendingUserSnap = await getDoc(pendingUserRef);
      
      if (!pendingUserSnap.exists()) {
        throw new Error('No coinciden tus datos o ese correo y nombre no pertenece a un miembro vigente de Iconik Pro Gym. Contacta a recepción para registrarte.');
      }
      
      const pendingUser = pendingUserSnap.data() as PendingUser;
      
      // Verificar que el nombre coincida (ignorar mayúsculas)
      if (pendingUser.displayName.toLowerCase() !== displayName.toLowerCase()) {
        throw new Error('No coinciden tus datos o ese correo y nombre no pertenece a un miembro vigente de Iconik Pro Gym. Contacta a recepción para registrarte.');
      }
      
      // Si todo está bien, proceder con el registro
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Crear perfil de usuario completo
      await this.createUserProfile(user.uid, {
        ...pendingUser,
        uid: user.uid,
        isActive: true,
        registrationStatus: 'COMPLETED',
        registrationAttempts: 0
      });
      
      // Eliminar usuario pendiente
      await deleteDoc(pendingUserRef);
      
      return user;
    } catch (error: any) {
      console.error('Error en signUpWithEmail:', error);
      throw error;
    }
  }

  // Inicio de sesión con email y contraseña
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verificar si el usuario tiene un perfil válido
      const profile = await this.getUserProfile(user.uid);
      if (!profile || !profile.isActive) {
        await firebaseSignOut(auth);
        throw new Error('Usuario no autorizado o registro incompleto');
      }

      // Para usuarios existentes sin registrationStatus, actualizarlos automáticamente
      if (!profile.registrationStatus) {
        console.log('Actualizando usuario existente sin registrationStatus:', profile.email);
        await this.updateUserProfile(user.uid, {
          registrationStatus: 'COMPLETED'
        });
      } else if (profile.registrationStatus !== 'COMPLETED') {
        await firebaseSignOut(auth);
        throw new Error('Usuario no autorizado o registro incompleto');
      }
      
      // Verificar membresía vigente
      if (profile.membershipEnd && new Date() > profile.membershipEnd) {
        await firebaseSignOut(auth);
        throw new Error('Membresía vencida');
      }
      
      console.log('✅ Inicio de sesión exitoso, sesión persistente habilitada');
      return user;
    } catch (error: any) {
      console.error('Error en signInWithEmail:', error);
      throw error;
    }
  }

  // Inicio de sesión con Google removido

  // Cerrar sesión
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Error en signOut:', error);
      throw error;
    }
  }

  // Crear perfil de usuario
  async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      // Eliminar campos undefined
      const cleanData = Object.fromEntries(
        Object.entries({
          uid,
          ...userData,
          createdAt: serverTimestamp(),
          isActive: true,
          registrationStatus: 'COMPLETED'
        }).filter(([_, v]) => v !== undefined)
      );
      await setDoc(userRef, cleanData);
    } catch (error: any) {
      console.error('Error creando perfil de usuario:', error);
      throw error;
    }
  }

  // Obtener perfil de usuario
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          createdAt: data.createdAt
            ? (typeof data.createdAt === 'string'
                ? new Date(data.createdAt)
                : data.createdAt.toDate())
            : new Date(),
          membershipStart: data.membershipStart
            ? (typeof data.membershipStart === 'string'
                ? new Date(data.membershipStart)
                : data.membershipStart.toDate())
            : undefined,
          membershipEnd: data.membershipEnd
            ? (typeof data.membershipEnd === 'string'
                ? new Date(data.membershipEnd)
                : data.membershipEnd.toDate())
            : undefined
        } as UserProfile;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error obteniendo perfil de usuario:', error);
      throw error;
    }
  }

  // Actualizar perfil de usuario
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);
    } catch (error: any) {
      console.error('Error actualizando perfil de usuario:', error);
      throw error;
    }
  }

  // NUEVO: Crear usuario pendiente desde admin
  async createPendingUser(adminUid: string, userData: CreateUserData): Promise<void> {
    try {
      console.log('🔧 Iniciando creación de usuario pendiente:', userData.email);
      
      // Verificar que el creador sea admin
      const adminProfile = await this.getUserProfile(adminUid);
      if (!adminProfile || adminProfile.role !== 'ADMIN') {
        throw new Error('Solo los administradores pueden crear usuarios');
      }

      // Verificar límite de administradores si se está creando un admin
      if (userData.role === 'ADMIN') {
        const adminCount = await this.getAdminCount();
        if (adminCount >= 5) {
          throw new Error('Se ha alcanzado el límite máximo de 5 administradores');
        }
      }

      // Verificar que la fecha de fin sea posterior a la de inicio
      if (userData.membershipEnd <= userData.membershipStart) {
        throw new Error('La fecha de fin de membresía debe ser posterior a la fecha de inicio');
      }

      // Crear documento en pendingUsers
      const pendingUserRef = doc(db, 'pendingUsers', userData.email.toLowerCase());
      const pendingUserData: PendingUser = {
        ...userData,
        email: userData.email.toLowerCase(),
        createdAt: new Date(),
        createdBy: adminUid
      };

      console.log('📝 Guardando usuario pendiente en Firebase:', pendingUserData);
      await setDoc(pendingUserRef, pendingUserData);
      console.log('✅ Usuario pendiente creado exitosamente en Firebase');
    } catch (error: any) {
      console.error('❌ Error creando usuario pendiente:', error);
      throw error;
    }
  }

  // NUEVO: Verificar datos de usuario pendiente
  async verifyPendingUser(verificationData: CompleteRegistrationData): Promise<PendingUser> {
    try {
      const pendingUserRef = doc(db, 'pendingUsers', verificationData.email.toLowerCase());
      const pendingUserSnap = await getDoc(pendingUserRef);
      
      if (!pendingUserSnap.exists()) {
        throw new Error('No se encontró un usuario pendiente con esos datos');
      }

      const pendingUser = pendingUserSnap.data() as PendingUser;
      
      // Verificación flexible (ignorar mayúsculas)
      const nameMatches = pendingUser.displayName.toLowerCase() === verificationData.displayName.toLowerCase();
      const ageMatches = pendingUser.age === verificationData.age;
      
      if (!nameMatches || !ageMatches) {
        throw new Error('Los datos no coinciden. Verifica nombre completo y edad.');
      }

      return pendingUser;
    } catch (error: any) {
      console.error('Error verificando usuario pendiente:', error);
      throw error;
    }
  }

  // NUEVO: Completar registro de usuario pendiente
  async completeUserRegistration(verificationData: CompleteRegistrationData): Promise<string> {
    try {
      // Verificar datos del usuario pendiente
      const pendingUser = await this.verifyPendingUser(verificationData);
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        verificationData.email, 
        verificationData.password
      );
      const user = userCredential.user;

      // Crear perfil de usuario completo
      await this.createUserProfile(user.uid, {
        ...pendingUser,
        uid: user.uid,
        isActive: true,
        registrationStatus: 'COMPLETED',
        registrationAttempts: 0
      });

      // Eliminar usuario pendiente
      const pendingUserRef = doc(db, 'pendingUsers', verificationData.email.toLowerCase());
      await deleteDoc(pendingUserRef);

      return user.uid;
    } catch (error: any) {
      console.error('Error completando registro de usuario:', error);
      throw error;
    }
  }

  // NUEVO: Obtener usuarios pendientes
  async getPendingUsers(): Promise<PendingUser[]> {
    try {
      const pendingUsersRef = collection(db, 'pendingUsers');
      const querySnapshot = await getDocs(pendingUsersRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt
            ? (typeof data.createdAt === 'string'
                ? new Date(data.createdAt)
                : data.createdAt.toDate())
            : new Date(),
          membershipStart: data.membershipStart
            ? (typeof data.membershipStart === 'string'
                ? new Date(data.membershipStart)
                : data.membershipStart.toDate())
            : new Date(),
          membershipEnd: data.membershipEnd
            ? (typeof data.membershipEnd === 'string'
                ? new Date(data.membershipEnd)
                : data.membershipEnd.toDate())
            : new Date()
        } as PendingUser;
      });
    } catch (error: any) {
      console.error('Error obteniendo usuarios pendientes:', error);
      throw error;
    }
  }

  // NUEVO: Eliminar usuario pendiente
  async deletePendingUser(email: string): Promise<void> {
    try {
      const pendingUserRef = doc(db, 'pendingUsers', email.toLowerCase());
      await deleteDoc(pendingUserRef);
    } catch (error: any) {
      console.error('Error eliminando usuario pendiente:', error);
      throw error;
    }
  }

  // Crear usuario desde admin (método original - mantener para compatibilidad)
  async createUserByAdmin(adminUid: string, userData: CreateUserData): Promise<string> {
    try {
      // Verificar que el creador sea admin
      const adminProfile = await this.getUserProfile(adminUid);
      if (!adminProfile || adminProfile.role !== 'ADMIN') {
        throw new Error('Solo los administradores pueden crear usuarios');
      }

      // Verificar límite de administradores si se está creando un admin
      if (userData.role === 'ADMIN') {
        const adminCount = await this.getAdminCount();
        if (adminCount >= 5) {
          throw new Error('Se ha alcanzado el límite máximo de 5 administradores');
        }
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, 'tempPassword123');
      const user = userCredential.user;

      // Crear perfil de usuario
      await this.createUserProfile(user.uid, {
        ...userData,
        createdBy: adminUid,
        isActive: true,
        registrationStatus: 'COMPLETED'
      });

      return user.uid;
    } catch (error: any) {
      console.error('Error creando usuario desde admin:', error);
      throw error;
    }
  }

  // Obtener conteo de administradores
  async getAdminCount(): Promise<number> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'ADMIN'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error obteniendo conteo de admins:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (solo para admins)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt
            ? (typeof data.createdAt === 'string'
                ? new Date(data.createdAt)
                : data.createdAt.toDate())
            : new Date(),
          membershipStart: data.membershipStart
            ? (typeof data.membershipStart === 'string'
                ? new Date(data.membershipStart)
                : data.membershipStart.toDate())
            : undefined,
          membershipEnd: data.membershipEnd
            ? (typeof data.membershipEnd === 'string'
                ? new Date(data.membershipEnd)
                : data.membershipEnd.toDate())
            : undefined
        } as UserProfile;
      });
    } catch (error: any) {
      console.error('Error obteniendo todos los usuarios:', error);
      throw error;
    }
  }

  // Verificar si la membresía está activa
  async checkMembershipStatus(uid: string): Promise<{ isActive: boolean; daysUntilExpiry: number }> {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile || !profile.isActive) {
        return { isActive: false, daysUntilExpiry: 0 };
      }

      // Para usuarios existentes sin registrationStatus, considerarlos como completados
      if (profile.registrationStatus && profile.registrationStatus !== 'COMPLETED') {
        return { isActive: false, daysUntilExpiry: 0 };
      }

      if (!profile.membershipEnd) {
        return { isActive: true, daysUntilExpiry: -1 }; // Sin fecha de vencimiento
      }

      const now = new Date();
      const daysUntilExpiry = Math.ceil((profile.membershipEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        isActive: daysUntilExpiry > 0,
        daysUntilExpiry
      };
    } catch (error: any) {
      console.error('Error verificando estado de membresía:', error);
      throw error;
    }
  }

  // Renovar membresía
  async renewMembership(uid: string, months: number = 1): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile) {
        throw new Error('Usuario no encontrado');
      }

      const currentEnd = profile.membershipEnd || new Date();
      const newEnd = new Date(currentEnd.getTime() + months * 30 * 24 * 60 * 60 * 1000);

      await this.updateUserProfile(uid, {
        membershipEnd: newEnd,
        isActive: true
      });
    } catch (error: any) {
      console.error('Error renovando membresía:', error);
      throw error;
    }
  }

  // NUEVO: Actualizar usuarios existentes que no tienen registrationStatus
  async updateExistingUsers(): Promise<void> {
    try {
      const users = await this.getAllUsers();
      
      for (const user of users) {
        if (!user.registrationStatus) {
          console.log(`Actualizando usuario: ${user.email}`);
          await this.updateUserProfile(user.uid, {
            registrationStatus: 'COMPLETED'
          });
        }
      }
      
      console.log('Usuarios existentes actualizados correctamente');
    } catch (error: any) {
      console.error('Error actualizando usuarios existentes:', error);
      throw error;
    }
  }

  // NUEVO: Cambiar contraseña del usuario
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      console.log('Contraseña actualizada exitosamente');
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 