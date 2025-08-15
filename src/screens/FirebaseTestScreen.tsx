import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FirebaseVerification } from '../utils/firebaseVerification';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const FirebaseTestScreen: React.FC = () => {
  const { user, userProfile, isAdmin, isMember, membershipStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await FirebaseVerification.runFullVerification();
      setTestResults(results);
      
      if (results) {
        Alert.alert('✅ Éxito', 'Firebase está correctamente configurado');
      } else {
        Alert.alert('❌ Error', 'Algunas verificaciones fallaron');
      }
    } catch (error) {
      console.error('Error en tests:', error);
      Alert.alert('❌ Error', 'Error ejecutando las verificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      const authResult = await FirebaseVerification.verifyAuthService();
      Alert.alert(
        authResult ? '✅ Éxito' : '❌ Error',
        authResult ? 'Servicio de autenticación funcionando' : 'Error en servicio de autenticación'
      );
    } catch (error) {
      Alert.alert('❌ Error', 'Error verificando autenticación');
    }
  };

  const testFirestore = async () => {
    try {
      const firestoreResult = await FirebaseVerification.verifyFirestoreAccess();
      Alert.alert(
        firestoreResult ? '✅ Éxito' : '❌ Error',
        firestoreResult ? 'Acceso a Firestore funcionando' : 'Error accediendo a Firestore'
      );
    } catch (error) {
      Alert.alert('❌ Error', 'Error verificando Firestore');
    }
  };

  const testStorage = async () => {
    try {
      const storageResult = await FirebaseVerification.verifyStorageAccess();
      Alert.alert(
        storageResult ? '✅ Éxito' : '❌ Error',
        storageResult ? 'Acceso a Storage funcionando' : 'Error accediendo a Storage'
      );
    } catch (error) {
      Alert.alert('❌ Error', 'Error verificando Storage');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Firebase Test</Text>
          <Text style={styles.subtitle}>Verificación de configuración</Text>
        </View>

        {/* Estado actual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estado Actual</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Usuario Autenticado:</Text>
            <Text style={[styles.statusValue, user ? styles.success : styles.error]}>
              {user ? '✅ Sí' : '❌ No'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Email:</Text>
            <Text style={styles.statusValue}>{user?.email || 'No disponible'}</Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Rol:</Text>
            <Text style={styles.statusValue}>
              {isAdmin ? '👑 Administrador' : isMember ? '👤 Miembro' : '❓ Desconocido'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Membresía:</Text>
            <Text style={styles.statusValue}>
              {membershipStatus?.isActive ? '✅ Activa' : '❌ Inactiva'}
            </Text>
          </View>

          {membershipStatus?.daysUntilExpiry !== undefined && (
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Días hasta vencimiento:</Text>
              <Text style={styles.statusValue}>
                {membershipStatus.daysUntilExpiry === -1 ? 'Sin fecha' : membershipStatus.daysUntilExpiry}
              </Text>
            </View>
          )}
        </View>

        {/* Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Tests de Verificación</Text>
          
          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={runTests}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="play" size={20} color="#fff" />
            )}
            <Text style={styles.testButtonText}>
              {isLoading ? 'Ejecutando...' : 'Ejecutar Todos los Tests'}
            </Text>
          </TouchableOpacity>

          <View style={styles.testButtonsContainer}>
            <TouchableOpacity style={styles.singleTestButton} onPress={testAuth}>
              <Ionicons name="person" size={20} color="#4CAF50" />
              <Text style={styles.singleTestButtonText}>Test Auth</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.singleTestButton} onPress={testFirestore}>
              <Ionicons name="document" size={20} color="#2196F3" />
              <Text style={styles.singleTestButtonText}>Test Firestore</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.singleTestButton} onPress={testStorage}>
              <Ionicons name="folder" size={20} color="#FF9800" />
              <Text style={styles.singleTestButtonText}>Test Storage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de configuración */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
          
          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Proyecto Firebase:</Text>
            <Text style={styles.configValue}>app-iconik-pro</Text>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Autenticación:</Text>
            <Text style={styles.configValue}>Email/Password + Google</Text>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Base de Datos:</Text>
            <Text style={styles.configValue}>Firestore</Text>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configLabel}>Almacenamiento:</Text>
            <Text style={styles.configValue}>Firebase Storage</Text>
          </View>
        </View>

        {/* Instrucciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Instrucciones</Text>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              1. Ejecuta "Ejecutar Todos los Tests" para verificar la configuración
            </Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              2. Revisa la consola de desarrollo para ver logs detallados
            </Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              3. Si hay errores, verifica las reglas de Firebase Console
            </Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              4. Asegúrate de que Authentication esté habilitado
            </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#f44336',
  },
  testButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  singleTestButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  singleTestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  configCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  instructionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default FirebaseTestScreen; 