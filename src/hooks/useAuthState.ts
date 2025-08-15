import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthStateOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export const useAuthState = (options: UseAuthStateOptions = {}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const { redirectTo, requireAuth = true, onAuthChange } = options;

  useEffect(() => {
    if (!loading) {
      // Si requiere autenticación y no está autenticado
      if (requireAuth && !isAuthenticated) {
        if (redirectTo) {
          navigation.navigate(redirectTo as never);
        }
      }
      
      // Si no requiere autenticación y está autenticado
      if (!requireAuth && isAuthenticated) {
        if (redirectTo) {
          navigation.navigate(redirectTo as never);
        }
      }

      // Callback para cambios de autenticación
      if (onAuthChange) {
        onAuthChange(isAuthenticated);
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, onAuthChange, navigation]);

  return {
    user,
    loading,
    isAuthenticated,
  };
};

// Hook para redirigir a usuarios autenticados
export const useRedirectIfAuthenticated = (redirectTo: string) => {
  return useAuthState({
    requireAuth: false,
    redirectTo,
  });
};

// Hook para redirigir a usuarios no autenticados
export const useRedirectIfNotAuthenticated = (redirectTo: string) => {
  return useAuthState({
    requireAuth: true,
    redirectTo,
  });
};

// Hook para proteger rutas
export const useProtectedRoute = () => {
  return useAuthState({
    requireAuth: true,
  });
}; 