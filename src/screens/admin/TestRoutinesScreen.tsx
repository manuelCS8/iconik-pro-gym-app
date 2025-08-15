import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Routine {
  id: string;
  name: string;
  isActive: boolean;
  isPublic?: boolean;
  creatorType?: string;
  createdBy?: string;
  createdAt?: any;
}

const TestRoutinesScreen: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllRoutines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Iniciando carga de TODAS las rutinas...');
      
      const routinesRef = collection(db, 'routines');
      const snapshot = await getDocs(routinesRef);
      
      const allRoutines: Routine[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        allRoutines.push({
          id: doc.id,
          name: data.name || 'Sin nombre',
          isActive: data.isActive !== false,
          isPublic: data.isPublic || false,
          creatorType: data.creatorType || 'GYM',
          createdBy: data.createdBy || 'admin',
          createdAt: data.createdAt,
        });
      });
      
      console.log(`📊 Total de rutinas encontradas: ${allRoutines.length}`);
      
      allRoutines.forEach((routine, index) => {
        console.log(`📋 Rutina ${index + 1}:`, {
          id: routine.id,
          name: routine.name,
          isActive: routine.isActive,
          isPublic: routine.isPublic,
          creatorType: routine.creatorType,
          createdBy: routine.createdBy,
        });
      });
      
      setRoutines(allRoutines);
      
    } catch (error: any) {
      console.error('❌ Error cargando rutinas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testMemberQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Probando consulta como miembro...');
      
      const routinesRef = collection(db, 'routines');
      const q = query(routinesRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      const activeRoutines: Routine[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        activeRoutines.push({
          id: doc.id,
          name: data.name || 'Sin nombre',
          isActive: data.isActive !== false,
          isPublic: data.isPublic || false,
          creatorType: data.creatorType || 'GYM',
          createdBy: data.createdBy || 'admin',
        });
      });
      
      console.log(`✅ Rutinas activas encontradas: ${activeRoutines.length}`);
      
      Alert.alert(
        'Resultado de Consulta',
        `Se encontraron ${activeRoutines.length} rutinas activas.\n\n${activeRoutines.map(r => `• ${r.name} (${r.isActive ? 'Activa' : 'Inactiva'})`).join('\n')}`
      );
      
    } catch (error: any) {
      console.error('❌ Error en consulta de miembro:', error);
      setError(error.message);
      
      Alert.alert(
        'Error de Permisos',
        `Error: ${error.message}\n\nEsto indica que las reglas de Firebase no están configuradas correctamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  const testSpecificUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Probando con usuario específico...');
      
      // UID del usuario que está fallando
      const testUserId = 'xnS2edKIayUvwSpUJH7JN1EVvnL2';
      
      // Verificar datos del usuario
      const userDoc = await getDoc(doc(db, 'users', testUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 Datos del usuario de prueba:', userData);
        
        Alert.alert(
          'Datos del Usuario',
          `Rol: ${userData.role}\nActivo: ${userData.isActive}\nMembresía: ${userData.membershipStatus || 'No definida'}`
        );
      }
      
      // Probar consulta específica
      const routinesRef = collection(db, 'routines');
      const q = query(routinesRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      console.log(`✅ Consulta exitosa: ${snapshot.docs.length} rutinas encontradas`);
      
      Alert.alert(
        'Consulta Exitosa',
        `Se encontraron ${snapshot.docs.length} rutinas activas.\n\nLas reglas están funcionando correctamente.`
      );
      
    } catch (error: any) {
      console.error('❌ Error en prueba específica:', error);
      setError(error.message);
      
      Alert.alert(
        'Error de Permisos',
        `Error: ${error.message}\n\nCódigo: ${error.code}\n\nEsto confirma que las reglas no están funcionando.`
      );
    } finally {
      setLoading(false);
    }
  };

  const forceRulesUpdate = () => {
    Alert.alert(
      'Forzar Actualización de Reglas',
      'Para solucionar el problema:\n\n1. Ve a Firebase Console\n2. Firestore Database → Rules\n3. Agrega un espacio o comentario\n4. Publica las reglas\n5. Espera 2-3 minutos\n6. Prueba de nuevo\n\nEsto fuerza la actualización del caché de reglas.',
      [
        { text: 'Entendido', style: 'default' }
      ]
    );
  };

  const checkFirebaseRules = () => {
    Alert.alert(
      'Verificar Reglas de Firebase',
      'Para solucionar el problema:\n\n1. Ve a Firebase Console\n2. Firestore Database → Rules\n3. Asegúrate de que las reglas incluyan:\n\nallow read: if request.auth != null && \n  (resource.data.isActive == true || \n   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == \'ADMIN\');\n\n4. Publica los cambios',
      [
        { text: 'Entendido', style: 'default' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>🔧 Diagnóstico de Rutinas</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={loadAllRoutines}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Cargando...' : '📊 Cargar Todas las Rutinas'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testMemberQuery}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Probando...' : '👤 Probar Consulta de Miembro'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testSpecificUser}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Probando...' : '👤 Probar Usuario Específico'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={forceRulesUpdate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Forzando...' : '🔄 Forzar Actualización de Reglas'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.warningButton]} 
            onPress={checkFirebaseRules}
          >
            <Text style={styles.buttonText}>🔧 Verificar Reglas de Firebase</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❌ Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {routines.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              📋 Rutinas Encontradas ({routines.length})
            </Text>
            
            {routines.map((routine, index) => (
              <View key={routine.id} style={styles.routineItem}>
                <Text style={styles.routineName}>
                  {index + 1}. {routine.name}
                </Text>
                <View style={styles.routineDetails}>
                  <Text style={styles.detailText}>
                    ID: {routine.id}
                  </Text>
                  <Text style={styles.detailText}>
                    Activa: {routine.isActive ? '✅' : '❌'}
                  </Text>
                  <Text style={styles.detailText}>
                    Pública: {routine.isPublic ? '✅' : '❌'}
                  </Text>
                  <Text style={styles.detailText}>
                    Creador: {routine.createdBy}
                  </Text>
                  <Text style={styles.detailText}>
                    Tipo: {routine.creatorType}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff4444" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#ff8800',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
  },
  resultsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  routineItem: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  routineName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routineDetails: {
    gap: 3,
  },
  detailText: {
    color: '#cccccc',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default TestRoutinesScreen; 