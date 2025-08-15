import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import ArtisticBackground from "../../components/ArtisticBackground";
// Google Sign-In removido

const SignInScreen: React.FC = () => {
  const { signInWithEmail } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const onSignInPressed = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Ingresa correo y contraseña.");
      return;
    }

    if (!acceptTerms) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones.");
      return;
    }

    setIsLoading(true);
    
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      Alert.alert("✅ Bienvenido", "Inicio de sesión exitoso");
      // Si usas Redux o contexto para el rol, puedes condicionar aquí
      // Alert.alert("✅ Bienvenido", "Inicio de sesión exitoso");
    } catch (error: any) {
      console.error('Error en sign-in:', error);
      
      let errorMessage = "Error al iniciar sesión";
      if (error.message?.includes('no encontrado')) {
        errorMessage = "Usuario no encontrado";
      } else if (error.message?.includes('incorrecta')) {
        errorMessage = "Contraseña incorrecta";
      } else if (error.message?.includes('inválido')) {
        errorMessage = "Email inválido";
      } else if (error.message?.includes('demasiados intentos')) {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
      } else if (error.message?.includes('no autorizado')) {
        errorMessage = "Usuario no autorizado o membresía vencida";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In removido

  return (
    <SafeAreaView style={styles.container}>
      <ArtisticBackground />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require("../../assets/logo.png")} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Inicio de Sesión</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>Acepto los </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Terms" as never)}
                  disabled={isLoading}
                >
                  <Text style={styles.termsLink}>términos y condiciones</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Botón de Google removido */}

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, (!acceptTerms || isLoading) && styles.disabledButton]}
              onPress={onSignInPressed}
              disabled={!acceptTerms || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomContainer}>
            <Text style={styles.bottomText}>¿No tienes cuenta? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("SignUp" as never)}
              disabled={isLoading}
            >
              <Text style={styles.bottomLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
    marginLeft: -30,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600',
    lineHeight: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  bottomText: {
    fontSize: 16,
    color: '#666',
  },
  bottomLink: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
});

export default SignInScreen; 