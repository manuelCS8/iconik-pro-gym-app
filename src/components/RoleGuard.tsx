import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { COLORS, SIZES } from '../utils/theme';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: 'ADMIN' | 'MEMBER';
  fallbackMessage?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRole, 
  fallbackMessage = "No tienes permisos para acceder a esta pantalla" 
}) => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated) {
      console.warn('🚫 Usuario no autenticado intentando acceder a pantalla protegida');
      Alert.alert(
        'Acceso Denegado',
        'Debes iniciar sesión para acceder a esta pantalla.',
        [{ text: 'OK', onPress: () => dispatch(logout()) }]
      );
      return;
    }

    // Verificar rol
    if (role !== requiredRole) {
      console.warn(`🚫 Usuario con rol "${role}" intentando acceder a pantalla para "${requiredRole}"`);
      
      Alert.alert(
        'Acceso Denegado',
        fallbackMessage,
        [
          {
            text: 'Entendido',
            onPress: () => {
              // Redirigir según el rol actual
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Si no puede volver atrás, cerrar sesión por seguridad
                dispatch(logout());
              }
            }
          }
        ]
      );
      return;
    }
  }, [isAuthenticated, role, requiredRole, fallbackMessage, navigation, dispatch]);

  // Si no está autenticado o no tiene el rol correcto, mostrar pantalla de acceso denegado
  if (!isAuthenticated || role !== requiredRole) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Acceso Denegado</Text>
          <Text style={styles.errorMessage}>{fallbackMessage}</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Tu rol actual: <Text style={styles.roleText}>{role || 'No definido'}</Text>
            </Text>
            <Text style={styles.infoText}>
              Rol requerido: <Text style={styles.roleText}>{requiredRole}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Si todo está bien, renderizar el contenido
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 300,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  errorTitle: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  errorMessage: {
    fontSize: SIZES.fontRegular,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.padding,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radius / 2,
    padding: SIZES.padding,
    width: '100%',
  },
  infoText: {
    fontSize: SIZES.fontSmall,
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default RoleGuard; 