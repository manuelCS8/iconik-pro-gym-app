import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import ArtisticBackground from "../../components/ArtisticBackground";
// Google Sign-In removido

const SignUpScreen: React.FC = () => {
  const { signUpWithEmail } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  // Registro con Google removido

  const onEmailSignUp = () => {
    navigation.navigate("EmailSignUp" as never);
  };

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

        {/* Registration Options */}
        <View style={styles.formContainer}>
          {/* Botón de registro con Google removido */}

          {/* Email Sign Up Button */}
          <TouchableOpacity 
            style={[styles.emailButton, isLoading && styles.disabledButton]}
            onPress={onEmailSignUp}
            disabled={isLoading}
          >
            <Ionicons name="mail-outline" size={24} color="#fff" style={styles.emailIcon} />
            <Text style={styles.emailButtonText}>
              {isLoading ? 'Cargando...' : 'Registrate con Correo'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Link */}
          <View style={styles.bottomContainer}>
            <Text style={styles.bottomText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.bottomLink}>Inicia Sesión</Text>
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
    paddingBottom: 80,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 40,
    marginLeft: -30,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
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
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 18,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emailIcon: {
    marginRight: 16,
  },
  emailButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

export default SignUpScreen; 