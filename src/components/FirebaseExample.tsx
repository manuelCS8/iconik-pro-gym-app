import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, analytics } from '../config/firebase';
import { signInWithGoogle } from '../config/googleSignIn';
import { pickImage, uploadMediaToFirebase } from '../services/mediaService';

interface Exercise {
  id?: string;
  name: string;
  description: string;
  imageURL?: string;
  createdAt: Date;
}

const FirebaseExample: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        console.log('Usuario conectado:', user.email);
        loadExercises();
      } else {
        console.log('Usuario desconectado');
        setExercises([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Autenticación con email/password
  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        'test@example.com', 
        'password123'
      );
      Alert.alert('Éxito', 'Sesión iniciada con email');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Registro con email/password
  const handleEmailSignUp = async () => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'newuser@example.com', 
        'password123'
      );
      Alert.alert('Éxito', 'Usuario creado');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Autenticación con Google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { userInfo, accessToken } = await signInWithGoogle();
      Alert.alert('Éxito', 'Sesión iniciada con Google');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Éxito', 'Sesión cerrada');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Cargar ejercicios desde Firestore
  const loadExercises = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];
      setExercises(exercisesData);
    } catch (error: any) {
      console.error('Error cargando ejercicios:', error);
    }
  };

  // Agregar ejercicio a Firestore
  const handleAddExercise = async () => {
    try {
      setLoading(true);
      
      // Seleccionar imagen
      const image = await pickImage();
      let imageURL = '';
      
      if (image) {
        // Subir imagen a Firebase Storage
        const imagePath = `exercises/${Date.now()}_${image.fileName || 'image.jpg'}`;
        const response = await fetch(image.uri);
        const blob = await response.blob();
        
        const storageRef = ref(storage, imagePath);
        const snapshot = await uploadBytes(storageRef, blob);
        imageURL = await getDownloadURL(snapshot.ref);
      }

      // Crear documento en Firestore
      const exerciseData: Exercise = {
        name: 'Ejercicio de Prueba',
        description: 'Descripción del ejercicio de prueba',
        imageURL,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
      Alert.alert('Éxito', 'Ejercicio agregado con ID: ' + docRef.id);
      
      // Recargar ejercicios
      loadExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar ejercicio
  const handleUpdateExercise = async (exerciseId: string) => {
    try {
      setLoading(true);
      const exerciseRef = doc(db, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        name: 'Ejercicio Actualizado',
        updatedAt: new Date(),
      });
      Alert.alert('Éxito', 'Ejercicio actualizado');
      loadExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar ejercicio
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'exercises', exerciseId));
      Alert.alert('Éxito', 'Ejercicio eliminado');
      loadExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Example</Text>
      
      {/* Estado del usuario */}
      <View style={styles.userSection}>
        <Text style={styles.subtitle}>
          Usuario: {user ? user.email : 'No conectado'}
        </Text>
      </View>

      {/* Botones de autenticación */}
      <View style={styles.authSection}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign In Email</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleEmailSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Up Email</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign In Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.signOutButton]} 
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de ejercicios */}
      {user && (
        <View style={styles.exercisesSection}>
          <Text style={styles.subtitle}>Ejercicios ({exercises.length})</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAddExercise}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Agregar Ejercicio</Text>
          </TouchableOpacity>

          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDesc}>{exercise.description}</Text>
              
              <View style={styles.exerciseActions}>
                <TouchableOpacity 
                  style={[styles.smallButton, styles.updateButton]}
                  onPress={() => exercise.id && handleUpdateExercise(exercise.id)}
                  disabled={loading}
                >
                  <Text style={styles.smallButtonText}>Actualizar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.smallButton, styles.deleteButton]}
                  onPress={() => exercise.id && handleDeleteExercise(exercise.id)}
                  disabled={loading}
                >
                  <Text style={styles.smallButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <Text>Cargando...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  userSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authSection: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  exercisesSection: {
    flex: 1,
  },
  exerciseItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  exerciseDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FirebaseExample; 