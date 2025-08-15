import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ArtisticBackground from '../../components/ArtisticBackground';

const CompleteRegistrationScreen: React.FC = () => {
  const { signIn } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    age: '',
    password: '',
    confirmPassword: '',
  });

  // Estado para mostrar requisitos de contraseña
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { email, displayName, age, password, confirmPassword } = formData;

    if (!email.trim()) {
      Alert.alert('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Formato de correo inválido');
      return false;
    }

    if (!displayName.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return false;
    }

    if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
      Alert.alert('Error', 'La edad debe estar entre 13 y 100 años');
      return false;
    }

    // Validación de contraseña robusta
    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      Alert.alert(
        'Contraseña insegura',
        'Usa al menos 8 caracteres e incluye mayúscula, minúscula, número y símbolo.'
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const onPasswordChange = (text: string) => {
    updateFormData('password', text);
    setPasswordRules({
      minLength: text.length >= 8,
      hasUpper: /[A-Z]/.test(text),
      hasLower: /[a-z]/.test(text),
      hasNumber: /\d/.test(text),
      hasSpecial: /[^A-Za-z0-9]/.test(text),
    });
  };

  const handleCompleteRegistration = async () => {
    if (!validateForm()) {
      return;
    }

    // Verificar límite de intentos
    if (attempts >= 5) {
      Alert.alert(
        'Límite de intentos alcanzado',
        'Has excedido el número máximo de intentos. Por favor, contacta a recepción del gimnasio para aclarar tu situación.',
        [
          {
            text: 'Entendido',
            onPress: () => navigation.navigate('Login' as never)
          }
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      const { email, displayName, age, password } = formData;

      const verificationData = {
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        age: parseInt(age),
        password,
      };

      // Completar registro
      await authService.completeUserRegistration(verificationData);

      Alert.alert(
        '✅ Registro Completado',
        'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => {
              // Intentar iniciar sesión automáticamente
              signIn(email.trim().toLowerCase(), password);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error completando registro:', error);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let errorMessage = 'Error al completar el registro';
      let remainingAttempts = 5 - newAttempts;
      
      if (error.message?.includes('No se encontró')) {
        errorMessage = 'No se encontró un usuario pendiente con esos datos. Verifica que el nombre completo, email y edad coincidan exactamente con los datos proporcionados por el administrador.';
      } else if (error.message?.includes('no coinciden')) {
        errorMessage = 'Los datos no coinciden. Verifica nombre completo y edad exactamente como te los proporcionó el administrador.';
      } else if (error.message?.includes('ya está en uso')) {
        errorMessage = 'Este correo ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión.';
      } else if (error.message?.includes('débil')) {
        errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      }

      if (remainingAttempts > 0) {
        errorMessage += `\n\nIntentos restantes: ${remainingAttempts}`;
      } else {
        errorMessage += '\n\nHas alcanzado el límite de intentos. Contacta a recepción del gimnasio.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ArtisticBackground />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Completar Registro</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Ionicons name="person-add-circle" size={80} color="#ff4444" />
          <Text style={styles.logoTitle}>Completar Registro</Text>
          <Text style={styles.logoSubtitle}>
            Ingresa los datos exactos que te proporcionó el administrador
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>📋 Verificación de Datos</Text>
          
          <Text style={styles.label}>Email *</Text>
          <TextInput 
            style={styles.input}
            placeholder="juan@email.com"
            placeholderTextColor="#888"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Nombre Completo *</Text>
          <TextInput 
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor="#888"
            value={formData.displayName}
            onChangeText={(text) => updateFormData('displayName', text)}
            autoCorrect={false}
          />

          <Text style={styles.label}>Edad *</Text>
          <TextInput 
            style={styles.input}
            placeholder="25"
            placeholderTextColor="#888"
            value={formData.age}
            onChangeText={(text) => updateFormData('age', text)}
            keyboardType="numeric"
          />

          <Text style={styles.sectionTitle}>🔐 Crear Contraseña</Text>
          
          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput}
              placeholder="Mínimo 8, mayúscula, minúscula, número y símbolo"
              placeholderTextColor="#888"
              value={formData.password}
              onChangeText={onPasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          {/* Requisitos de contraseña */}
          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <Ionicons name={passwordRules.minLength ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordRules.minLength ? '#4caf50' : '#ff5252'} />
              <Text style={styles.ruleText}>Al menos 8 caracteres</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name={passwordRules.hasUpper ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordRules.hasUpper ? '#4caf50' : '#ff5252'} />
              <Text style={styles.ruleText}>Una mayúscula</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name={passwordRules.hasLower ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordRules.hasLower ? '#4caf50' : '#ff5252'} />
              <Text style={styles.ruleText}>Una minúscula</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name={passwordRules.hasNumber ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordRules.hasNumber ? '#4caf50' : '#ff5252'} />
              <Text style={styles.ruleText}>Un número</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name={passwordRules.hasSpecial ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordRules.hasSpecial ? '#4caf50' : '#ff5252'} />
              <Text style={styles.ruleText}>Un símbolo</Text>
            </View>
          </View>

          <Text style={styles.label}>Confirmar Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#888"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          {/* Intentos restantes */}
          {attempts > 0 && (
            <View style={styles.attemptsContainer}>
              <Ionicons name="warning" size={16} color="#ff4444" />
              <Text style={styles.attemptsText}>
                Intentos restantes: {5 - attempts}
              </Text>
            </View>
          )}

          {/* Información importante */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color="#ff4444" />
            <Text style={styles.infoText}>
              Los datos deben coincidir exactamente con los proporcionados por el administrador. 
              Si tienes dudas, contacta a recepción del gimnasio.
            </Text>
          </View>

          {/* Botón de registro */}
          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleCompleteRegistration}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.registerButtonText}>Completar Registro</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Enlace para ir a login */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#222',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#222',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rulesContainer: {
    marginTop: 8,
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
    color: '#aaa',
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    marginTop: 16,
    gap: 8,
  },
  attemptsText: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    color: '#ff4444',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default CompleteRegistrationScreen;
