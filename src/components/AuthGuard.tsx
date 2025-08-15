import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  fallback 
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Si requiere autenticación y el usuario no está autenticado
  if (requireAuth && !isAuthenticated) {
    return fallback || null;
  }

  // Si no requiere autenticación y el usuario está autenticado
  if (!requireAuth && isAuthenticated) {
    return fallback || null;
  }

  // Renderizar el contenido protegido
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AuthGuard; 