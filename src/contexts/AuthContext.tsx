import React, { createContext, useEffect, useState, useContext } from 'react';
import { auth } from '../config/firebase';
import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { authService, UserProfile } from '../services/authService';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';
import SessionPersistenceService from '../services/sessionPersistenceService';

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>; // Alias para signInWithEmail
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  membershipStatus: {
    isActive: boolean;
    daysUntilExpiry: number;
  } | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<{
    isActive: boolean;
    daysUntilExpiry: number;
  } | null>(null);

  const dispatch = useDispatch();

  // Cargar perfil de usuario
  const loadUserProfile = async (uid: string) => {
    try {
      const profile = await authService.getUserProfile(uid);
      setUserProfile(profile);
      
      if (profile) {
        // Guardar sesión persistente
        const currentUser = auth.currentUser;
        if (currentUser) {
          await SessionPersistenceService.saveSession(currentUser, profile);
        }
        
        // Sincronizar Redux con el perfil cargado
        dispatch(setUser({
          uid: profile.uid,
          email: profile.email,
          role: profile.role?.toUpperCase(),
          membershipEnd: profile.membershipEnd ? 
            (typeof profile.membershipEnd === 'string' ? 
              profile.membershipEnd : 
              (profile.membershipEnd && typeof profile.membershipEnd.toDate === 'function' ? 
                profile.membershipEnd.toDate().toISOString() : 
                new Date(profile.membershipEnd).toISOString()
              )
            ) : null,
          name: profile.displayName, // Agregar el nombre del usuario
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
        }));
        const status = await authService.checkMembershipStatus(uid);
        setMembershipStatus(status);
      }
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
      setUserProfile(null);
      setMembershipStatus(null);
    }
  };

  // Refrescar perfil de usuario
  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  useEffect(() => {
    // Función para inicializar autenticación
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Primero intentar restaurar sesión persistente
        const { user: restoredUser, userProfile: restoredProfile } = await SessionPersistenceService.restoreSession();
        
        if (restoredUser && restoredProfile) {
          console.log('🔄 Sesión restaurada desde persistencia:', restoredUser.email);
          setUserState(restoredUser);
          setUserProfile(restoredProfile);
          
          // Sincronizar Redux
          dispatch(setUser({
            uid: restoredProfile.uid,
            email: restoredProfile.email,
            role: restoredProfile.role?.toUpperCase(),
            membershipEnd: restoredProfile.membershipEnd ? 
              (typeof restoredProfile.membershipEnd === 'string' ? 
                restoredProfile.membershipEnd : 
                (restoredProfile.membershipEnd && typeof restoredProfile.membershipEnd.toDate === 'function' ? 
                  restoredProfile.membershipEnd.toDate().toISOString() : 
                  new Date(restoredProfile.membershipEnd).toISOString()
                )
              ) : null,
            name: restoredProfile.displayName,
            weight: restoredProfile.weight,
            height: restoredProfile.height,
            age: restoredProfile.age,
          }));
          
          const status = await authService.checkMembershipStatus(restoredUser.uid);
          setMembershipStatus(status);
        }
        
        // Luego configurar listener de Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('🔥 Firebase Auth state changed:', user?.email || 'No user');
          
          if (user) {
            setUserState(user);
            await loadUserProfile(user.uid);
          } else {
            console.log('👤 Usuario no autenticado en Firebase');
            // Solo limpiar si no hay sesión persistente válida
            const hasValidSession = await SessionPersistenceService.hasValidSession();
            if (!hasValidSession) {
              setUserProfile(null);
              setMembershipStatus(null);
            }
          }
          
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        setLoading(false);
        
        // Configurar listener básico como fallback
        return onAuthStateChanged(auth, async (user) => {
          setUserState(user);
          if (user) {
            await loadUserProfile(user.uid);
          } else {
            setUserProfile(null);
            setMembershipStatus(null);
          }
          setLoading(false);
        });
      }
    };

    // Inicializar autenticación
    const unsubscribePromise = initializeAuth();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  // Iniciar sesión con email y contraseña
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.signInWithEmail(email, password);
      console.log('Inicio de sesión con email exitoso');
    } catch (error: any) {
      setLoading(false);
      console.error('Error en sign-in con email:', error);
      throw error;
    }
  };

  // Registrarse con email y contraseña
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      await authService.signUpWithEmail(email, password, displayName);
      console.log('Registro con email exitoso');
    } catch (error: any) {
      setLoading(false);
      console.error('Error en sign-up con email:', error);
      throw error;
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      await SessionPersistenceService.clearSession();
      console.log('Sesión cerrada exitosamente');
    } catch (error: any) {
      setLoading(false);
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      console.log('Contraseña cambiada exitosamente');
    } catch (error: any) {
      setLoading(false);
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  };

  const value: AuthContextProps = {
    user,
    userProfile,
    loading,
    signInWithEmail,
    signIn: signInWithEmail, // Alias para signInWithEmail
    signUpWithEmail,
    signOut,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'ADMIN',
    isMember: userProfile?.role === 'MEMBER',
    membershipStatus,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 