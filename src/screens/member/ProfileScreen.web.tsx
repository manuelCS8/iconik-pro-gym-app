import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../redux/store';
import { signOut } from '../../redux/slices/authSlice';
import nutritionDataService, { NutritionData } from "../../services/nutritionDataService.web";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from "../../contexts/AuthContext";

const windowWidth = Dimensions.get("window").width;

interface UserProfile {
  name: string;
  bio: string;
  profileImage: string;
  gender: string;
  birthday: string;
  weight?: number;
  height?: number;
  age?: number;
}

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { uid, email, user, role } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const { changePassword } = useAuth();

  // Estado para el número de entrenamientos
  const [trainingCount, setTrainingCount] = useState(0);
  
  // Estados para foto de perfil y cumpleaños
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  // Estados para datos nutricionales
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [hasNutritionData, setHasNutritionData] = useState(false);

  // Función para generar nombre de usuario basado en el correo
  const generateUsername = (email: string) => {
    if (!email) return "usuario";
    const username = email.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return cleanUsername + '_' + Math.abs(hash % 100);
  };

  // Cargar datos del perfil desde AsyncStorage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileData = await AsyncStorage.getItem(`profile_${uid}`);
        if (profileData) {
          const profile = JSON.parse(profileData);
          setProfileImage(profile.profileImage || null);
        }
        
        // Cargar datos nutricionales
        await loadNutritionData();
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
      }
    };
    
    if (uid) {
      loadProfileData();
    }
  }, [uid]);

  // Función para cargar datos nutricionales
  const loadNutritionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await nutritionDataService.getNutritionDataByDate(today);
      setHasNutritionData(data.meals.length > 0);
    } catch (error) {
      console.error('Error cargando datos nutricionales:', error);
    }
  };

  // Función para guardar datos del perfil
  const saveProfileData = async (profile: Partial<UserProfile>) => {
    try {
      const existingData = await AsyncStorage.getItem(`profile_${uid}`);
      const currentProfile = existingData ? JSON.parse(existingData) : {};
      const updatedProfile = { ...currentProfile, ...profile };
      await AsyncStorage.setItem(`profile_${uid}`, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error guardando datos del perfil:', error);
    }
  };

  // Función para seleccionar imagen de perfil
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await saveProfileData({ profileImage: imageUri });
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    // Implementar lógica de cambio de contraseña
    Alert.alert('Cambiar Contraseña', 'Función de cambio de contraseña');
  };

  // Función para cerrar sesión
  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: () => dispatch(signOut()) }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.displayName || generateUsername(email || '')}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{trainingCount}</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{hasNutritionData ? '✓' : '✗'}</Text>
            <Text style={styles.statLabel}>Nutrición</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={24} color="#666" />
              <Text style={styles.settingText}>Cambiar Contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => navigation.navigate('NutritionHome' as never)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="nutrition" size={24} color="#666" />
              <Text style={styles.settingText}>Nutrición</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    padding: 8,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default ProfileScreen;
