import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { authService, UserProfile } from './authService';

interface SessionData {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  };
  userProfile: UserProfile;
  lastLogin: string;
  isPersistent: boolean;
}

class SessionPersistenceService {
  private readonly SESSION_KEY = 'iconik_pro_gym_session';
  private readonly AUTH_STATE_KEY = 'iconik_pro_gym_auth_state';

  /**
   * Guardar datos de sesión
   */
  async saveSession(user: User, userProfile: UserProfile): Promise<void> {
    try {
      const sessionData: SessionData = {
        user: {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined
        },
        userProfile,
        lastLogin: new Date().toISOString(),
        isPersistent: true
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      await AsyncStorage.setItem(this.AUTH_STATE_KEY, 'authenticated');
      
      console.log('💾 Sesión guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }
  }

  /**
   * Cargar datos de sesión
   */
  async loadSession(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      const authState = await AsyncStorage.getItem(this.AUTH_STATE_KEY);
      
      if (!sessionData || authState !== 'authenticated') {
        console.log('📋 No hay sesión persistente');
        return null;
      }

      const parsedSession: SessionData = JSON.parse(sessionData);
      
      // Verificar que la sesión no sea muy antigua (máximo 30 días)
      const lastLogin = new Date(parsedSession.lastLogin);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLogin > 30) {
        console.log('⏰ Sesión expirada por antigüedad');
        await this.clearSession();
        return null;
      }

      console.log('📋 Sesión cargada exitosamente');
      return parsedSession;
    } catch (error) {
      console.error('❌ Error cargando sesión:', error);
      return null;
    }
  }

  /**
   * Verificar si hay una sesión válida
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const session = await this.loadSession();
      return session !== null;
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      return false;
    }
  }

  /**
   * Restaurar sesión desde datos guardados
   */
  async restoreSession(): Promise<{ user: User | null; userProfile: UserProfile | null }> {
    try {
      const session = await this.loadSession();
      
      if (!session) {
        return { user: null, userProfile: null };
      }

      // Verificar que el usuario aún existe en Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid === session.user.uid) {
        // Usuario ya está autenticado en Firebase
        console.log('✅ Usuario ya autenticado en Firebase');
        return { 
          user: currentUser, 
          userProfile: session.userProfile 
        };
      }

      // Intentar obtener el perfil actualizado desde Firebase
      try {
        const updatedProfile = await authService.getUserProfile(session.user.uid);
        
        if (updatedProfile && updatedProfile.isActive) {
          // Verificar membresía
          const membershipStatus = await authService.checkMembershipStatus(session.user.uid);
          
          if (membershipStatus.isActive) {
            console.log('✅ Sesión restaurada exitosamente');
            return { 
              user: currentUser, 
              userProfile: updatedProfile 
            };
          } else {
            console.log('⚠️ Membresía vencida, limpiando sesión');
            await this.clearSession();
            return { user: null, userProfile: null };
          }
        } else {
          console.log('⚠️ Usuario inactivo, limpiando sesión');
          await this.clearSession();
          return { user: null, userProfile: null };
        }
      } catch (profileError) {
        console.error('❌ Error obteniendo perfil actualizado:', profileError);
        // Si no se puede obtener el perfil, usar el guardado
        return { 
          user: currentUser, 
          userProfile: session.userProfile 
        };
      }
    } catch (error) {
      console.error('❌ Error restaurando sesión:', error);
      return { user: null, userProfile: null };
    }
  }

  /**
   * Limpiar datos de sesión
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
      await AsyncStorage.removeItem(this.AUTH_STATE_KEY);
      console.log('🗑️ Sesión limpiada exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando sesión:', error);
    }
  }

  /**
   * Actualizar datos de sesión
   */
  async updateSession(userProfile: UserProfile): Promise<void> {
    try {
      const session = await this.loadSession();
      
      if (session) {
        const updatedSession: SessionData = {
          ...session,
          userProfile,
          lastLogin: new Date().toISOString()
        };

        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
        console.log('🔄 Sesión actualizada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error actualizando sesión:', error);
    }
  }

  /**
   * Obtener información de la sesión actual
   */
  async getSessionInfo(): Promise<{
    isAuthenticated: boolean;
    lastLogin: string | null;
    userEmail: string | null;
    membershipStatus: string | null;
  }> {
    try {
      const session = await this.loadSession();
      
      if (!session) {
        return {
          isAuthenticated: false,
          lastLogin: null,
          userEmail: null,
          membershipStatus: null
        };
      }

      const membershipStatus = session.userProfile.membershipEnd 
        ? (new Date() > session.userProfile.membershipEnd ? 'VENCIDA' : 'ACTIVA')
        : 'SIN FECHA';

      return {
        isAuthenticated: true,
        lastLogin: session.lastLogin,
        userEmail: session.user.email,
        membershipStatus
      };
    } catch (error) {
      console.error('❌ Error obteniendo información de sesión:', error);
      return {
        isAuthenticated: false,
        lastLogin: null,
        userEmail: null,
        membershipStatus: null
      };
    }
  }

  /**
   * Forzar renovación de sesión (para casos especiales)
   */
  async forceSessionRenewal(): Promise<void> {
    try {
      const session = await this.loadSession();
      
      if (session) {
        const renewedSession: SessionData = {
          ...session,
          lastLogin: new Date().toISOString()
        };

        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(renewedSession));
        console.log('🔄 Sesión renovada forzadamente');
      }
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
    }
  }
}

export default new SessionPersistenceService();
