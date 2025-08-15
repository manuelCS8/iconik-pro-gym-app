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

const EmailSignUpScreen: React.FC = () => {
  const { signUpWithEmail } = useAuth();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    weight: "",
    height: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    const { name, email, password, confirmPassword, age } = formData;

    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Error", "El correo electrónico es obligatorio");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Error", "Formato de correo inválido");
      return false;
    }

    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      Alert.alert(
        "Contraseña insegura",
        "Usa al menos 8 caracteres e incluye mayúscula, minúscula, número y símbolo."
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

    if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
      Alert.alert("Error", "La edad debe estar entre 13 y 100 años");
      return false;
    }

    if (!acceptTerms) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones");
      return false;
    }

    return true;
  };

  const onPasswordChange = (value: string) => {
    updateFormData('password', value);
    setPasswordRules({
      minLength: value.length >= 8,
      hasUpper: /[A-Z]/.test(value),
      hasLower: /[a-z]/.test(value),
      hasNumber: /\d/.test(value),
      hasSpecial: /[^A-Za-z0-9]/.test(value),
    });
  };

  const onSignUpPressed = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { name, email, password, age, weight, height } = formData;

      // Registrar usuario con Firebase
      await signUpWithEmail(email.trim().toLowerCase(), password, name.trim());

      Alert.alert(
        "✅ ¡Registro exitoso!",
        `Bienvenido ${name}. Tu cuenta ha sido creada y tienes 30 días de membresía gratuita.`,
        [
          {
            text: "Comenzar",
            onPress: () => console.log("Usuario registrado y redirigido")
          }
        ]
      );

    } catch (error: any) {
      console.error("❌ Error al registrar usuario:", error);
      setIsLoading(false);

      let errorMessage = "Error al crear la cuenta";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo ya está registrado. ¿Deseas iniciar sesión?";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es muy débil. Usa al menos 6 caracteres.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de correo inválido.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "El registro con email/contraseña no está habilitado.";
      } else if (error.message?.includes('no autorizado')) {
        errorMessage = "Usuario no autorizado. Contacta al administrador.";
      }

      Alert.alert("Error de registro", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ArtisticBackground />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            {/* Nombre completo */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre completo"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico *</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8, mayúscula, minúscula, número y símbolo"
                value={formData.password}
                onChangeText={onPasswordChange}
                secureTextEntry
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Requisitos de contraseña */}
            <View style={{ marginTop: 8 }}>
              {[
                { ok: passwordRules.minLength, label: 'Al menos 8 caracteres' },
                { ok: passwordRules.hasUpper, label: 'Una mayúscula' },
                { ok: passwordRules.hasLower, label: 'Una minúscula' },
                { ok: passwordRules.hasNumber, label: 'Un número' },
                { ok: passwordRules.hasSpecial, label: 'Un símbolo' },
              ].map((r, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={r.ok ? 'checkmark-circle' : 'close-circle'} size={14} color={r.ok ? '#4caf50' : '#ff5252'} />
                  <Text style={{ fontSize: 12, color: '#666' }}>{r.label}</Text>
                </View>
              ))}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar contraseña *</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Edad */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Edad *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu edad"
                value={formData.age}
                onChangeText={(value) => updateFormData('age', value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Peso (opcional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Peso (kg) - Opcional</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu peso en kg"
                value={formData.weight}
                onChangeText={(value) => updateFormData('weight', value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Altura (opcional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Altura (cm) - Opcional</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu altura en cm"
                value={formData.height}
                onChangeText={(value) => updateFormData('height', value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
            </View>

            {/* Términos y condiciones */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  Acepto los{" "}
                  <Text style={styles.termsLink}>términos y condiciones</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón de registro */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={onSignUpPressed}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Crear Cuenta</Text>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  termsLink: {
    color: '#ff4444',
    fontWeight: '600',
  },
  signUpButton: {
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
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EmailSignUpScreen; 