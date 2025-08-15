import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from "../../utils/theme";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setUser } from "../../redux/slices/authSlice";
import { logout } from "../../redux/slices/authSlice";
import { useNavigation } from '@react-navigation/native';
import WeightChart from "../../components/WeightChart";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import trainingHistoryService from "../../services/trainingHistoryService";
import nutritionDataService, { NutritionData } from "../../services/nutritionDataService";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
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
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  // Estados para datos nutricionales
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [hasNutritionData, setHasNutritionData] = useState(false);

  // Función para generar nombre de usuario basado en el correo
  const generateUsername = (email: string) => {
    if (!email) return "usuario";
    const username = email.split('@')[0];
    // Limpiar caracteres especiales y agregar números si es necesario
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
    // Usar un hash simple basado en el email para consistencia
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return cleanUsername + '_' + Math.abs(hash % 100);
  };

  // Inicializar base de datos local
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('user_profile.db');
        setDb(database);
        
        // Crear tabla para datos del perfil
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT UNIQUE,
            name TEXT,
            bio TEXT,
            profileImage TEXT,
            gender TEXT,
            birthday TEXT,
            weight REAL,
            height REAL,
            age INTEGER,
            lastBirthdayCheck TEXT
          );
        `);
        
        // Cargar datos del perfil
        await loadProfileData();
        
        // Inicializar y cargar datos nutricionales
        await nutritionDataService.initialize();
        await loadNutritionData();
      } catch (error) {
        console.error('Error inicializando base de datos:', error);
      }
    };
    
    initDatabase();
  }, []);

  // Función para cargar datos del perfil
  const loadProfileData = async () => {
    if (!db || !uid) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM user_profile WHERE userId = ?',
        [uid]
      );
      
      if (result.length > 0) {
        const profileData = result[0];
        setProfileImage(profileData.profileImage);
        setProfile({
          ...profile,
          name: profileData.name || profile.name,
          bio: profileData.bio || profile.bio,
          gender: profileData.gender || user?.gender || profile.gender,
          birthday: profileData.birthday || user?.birthday || profile.birthday,
          weight: profileData.weight || user?.weight,
          height: profileData.height || user?.height,
          age: profileData.age || user?.age,
        });
      } else {
        // Crear registro inicial
        await saveProfileData();
      }
    } catch (error) {
      console.error('Error cargando datos del perfil:', error);
    }
  };

  // Función para guardar datos del perfil
  const saveProfileData = async () => {
    if (!db || !uid) return;
    
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO user_profile 
         (userId, name, bio, profileImage, gender, birthday, weight, height, age) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uid,
          profile.name,
          profile.bio,
          profileImage,
          profile.gender,
          profile.birthday,
          profile.weight,
          profile.height,
          profile.age
        ]
      );
    } catch (error) {
      console.error('Error guardando datos del perfil:', error);
    }
  };

  // Función para cargar datos nutricionales
  const loadNutritionData = async () => {
    if (!uid) return;
    
    try {
      const data = await nutritionDataService.getNutritionData(uid);
      if (data) {
        setNutritionData(data);
        setHasNutritionData(true);
        
        // Actualizar el perfil con los datos nutricionales si no están definidos
        if (!profile.weight && data.weight) {
          setProfile(prev => ({
            ...prev,
            weight: data.weight,
            height: data.height,
            age: data.age,
            gender: data.gender === 'male' ? 'Hombre' : 'Mujer'
          }));
        }
      } else {
        setHasNutritionData(false);
      }
    } catch (error) {
      console.error('Error cargando datos nutricionales:', error);
      setHasNutritionData(false);
    }
  };

  // Función para seleccionar foto de perfil
  const selectProfileImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una foto.');
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cuadrado perfecto
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Guardar imagen localmente
        const fileName = `profile_${uid}_${Date.now()}.jpg`;
        const destinationUri = `${FileSystem.documentDirectory}profile_images/${fileName}`;
        
        // Crear directorio si no existe
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}profile_images/`,
          { intermediates: true }
        );
        
        // Copiar imagen al directorio local
        await FileSystem.copyAsync({
          from: imageUri,
          to: destinationUri
        });
        
        setProfileImage(destinationUri);
        await saveProfileData();
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Inténtalo de nuevo.');
    }
  };

  // Función para verificar cumpleaños
  const checkBirthday = async () => {
    if (!db || !uid) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT birthday, lastBirthdayCheck FROM user_profile WHERE userId = ?',
        [uid]
      );
      
      if (result.length > 0) {
        const { birthday, lastBirthdayCheck } = result[0];
        
        if (birthday) {
          const today = new Date();
          const birthdayDate = new Date(birthday);
          const lastCheck = lastBirthdayCheck ? new Date(lastBirthdayCheck) : null;
          
          // Verificar si es cumpleaños y no se ha felicitado hoy
          const isBirthday = 
            today.getMonth() === birthdayDate.getMonth() && 
            today.getDate() === birthdayDate.getDate();
          
          const alreadyCheckedToday = lastCheck && 
            lastCheck.getDate() === today.getDate() && 
            lastCheck.getMonth() === today.getMonth() && 
            lastCheck.getFullYear() === today.getFullYear();
          
          if (isBirthday && !alreadyCheckedToday) {
            setShowBirthdayModal(true);
            
            // Marcar como felicitado hoy
            await db.runAsync(
              'UPDATE user_profile SET lastBirthdayCheck = ? WHERE userId = ?',
              [today.toISOString(), uid]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error verificando cumpleaños:', error);
    }
  };

  // Verificar cumpleaños cuando se enfoca la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTrainingCount();
      checkBirthday();
      loadNutritionData();
    });

    return unsubscribe;
  }, [navigation, uid, db]);

  // Función para cargar el número de entrenamientos
  const loadTrainingCount = async () => {
    if (!uid) return;
    
    try {
      const sessions = await trainingHistoryService.getTrainingSessions(uid);
      setTrainingCount(sessions.length);
    } catch (error) {
      console.log('Error cargando número de entrenamientos:', error);
      setTrainingCount(0);
    }
  };

  // Estados para el perfil
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || "Emmanuel Castro Salvador",
    bio: "Sobre carga progresiva, pesado y al fallo, pre entreno después de entrenar",
    profileImage: profileImage || "https://via.placeholder.com/150",
    gender: user?.gender || "Hombre",
    birthday: user?.birthday || "abr 27, 2005",
    weight: user?.weight,
    height: user?.height,
    age: user?.age,
  });

  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Estados para edición
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editGender, setEditGender] = useState(profile.gender);
  const [editBirthday, setEditBirthday] = useState(profile.birthday);

  // Estados para medidas
  const [weightInput, setWeightInput] = useState(profile.weight?.toString() || "");
  const [heightInput, setHeightInput] = useState(profile.height?.toString() || "");
  const [ageInput, setAgeInput] = useState(profile.age?.toString() || "");

  // Estados para cambiar contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Datos de ejemplo para la gráfica de entrenamientos (en horas)
  const trainingData = [
    { month: "mar 16", hours: 5 },
    { month: "mar 23", hours: 5.5 },
    { month: "mar 30", hours: 6 },
    { month: "abr 6", hours: 6.5 },
    { month: "abr 13", hours: 4 },
    { month: "abr 20", hours: 7 },
    { month: "abr 27", hours: 7.5 },
    { month: "may 4", hours: 8 },
    { month: "may 11", hours: 6 },
    { month: "may 18", hours: 6.5 },
    { month: "may 25", hours: 5 },
  ];

  const saveProfile = async () => {
    const updatedProfile = {
      ...profile,
      name: editName,
      bio: editBio,
      gender: editGender,
      birthday: editBirthday,
    };
    
    setProfile(updatedProfile);
    setShowEditModal(false);
    
    // Guardar en base de datos local
    await saveProfileData();
    
    // Actualizar en Redux si es necesario
    if (user) {
      dispatch(setUser({
        ...user,
        name: editName,
        gender: editGender,
        birthday: editBirthday,
      }));
    }
  };

  const saveMeasurements = async () => {
    const w = parseFloat(weightInput);
    const h = parseFloat(heightInput);
    const a = parseInt(ageInput);

    if (isNaN(w) || w <= 0 || w > 300) {
      Alert.alert("Error", "Peso inválido (1-300 kg)");
      return;
    }
    if (isNaN(h) || h <= 0 || h > 250) {
      Alert.alert("Error", "Altura inválida (1-250 cm)");
      return;
    }
    if (isNaN(a) || a <= 0 || a > 120) {
      Alert.alert("Error", "Edad inválida (1-120 años)");
      return;
    }

    setProfile({ ...profile, weight: w, height: h, age: a });
    setShowMeasurementsModal(false);
    
    // Guardar en base de datos local
    await saveProfileData();
    
    // Si hay datos nutricionales, actualizarlos también
    if (nutritionData && uid) {
      try {
        await nutritionDataService.updateNutritionData(uid, {
          weight: w,
          height: h,
          age: a
        });
        // Recargar datos nutricionales
        await loadNutritionData();
      } catch (error) {
        console.error('Error actualizando datos nutricionales:', error);
      }
    }
    
    Alert.alert("✅ Medidas guardadas", "Las medidas se han actualizado correctamente.");
  };

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Bajo peso";
    if (bmi < 25) return "Peso normal";
    if (bmi < 30) return "Sobrepeso";
    return "Obesidad";
  };

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return "#2196F3";
    if (bmi < 25) return "#4CAF50";
    if (bmi < 30) return "#FF9800";
    return "#F44336";
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: () => {
            dispatch(logout());
          }
        }
      ]
    );
  };

  // Funciones para cambiar contraseña
  const onNewPasswordChange = (text: string) => {
    setPasswordForm(prev => ({ ...prev, newPassword: text }));
    setPasswordRules({
      minLength: text.length >= 8,
      hasUpper: /[A-Z]/.test(text),
      hasLower: /[a-z]/.test(text),
      hasNumber: /\d/.test(text),
      hasSpecial: /[^A-Za-z0-9]/.test(text),
    });
  };

  const validatePasswordForm = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Ingresa tu contraseña actual');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Ingresa la nueva contraseña');
      return false;
    }

    const strongPassword =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!strongPassword) {
      Alert.alert(
        'Contraseña insegura',
        'La nueva contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.'
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      Alert.alert(
        '✅ Contraseña actualizada',
        'Tu contraseña ha sido cambiada exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowChangePasswordModal(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setPasswordRules({
                minLength: false,
                hasUpper: false,
                hasLower: false,
                hasNumber: false,
                hasSpecial: false,
              });
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cambiar la contraseña');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Text style={styles.editButton}>Editar</Text>
          <Text style={styles.editButton}>Perfil</Text>
        </TouchableOpacity>
        
        <Text style={styles.username}>{generateUsername(email || '')}</Text>
        
        <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Forzar que el ScrollView no tenga espacio extra al final */}
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 0, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Image and Info */}
        <View style={styles.profileSection}>
          <Image 
            source={{ 
              uri: profileImage || profile.profileImage 
            }} 
            style={styles.profileImage} 
          />
          <Text style={styles.profileName}>{profile.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trainingCount}</Text>
              <Text style={styles.statLabel}>Entrenos</Text>
            </View>
          </View>
          
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TrainingHistoryStack' as never)}
            >
              <Ionicons name="list-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>Detalles de Entrenamientos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Navegar al tab de Entrenar y luego a la pantalla de ejercicios
                navigation.navigate('EntrenarTab' as never, {
                  screen: 'ExercisesList'
                } as never);
              }}
            >
              <Ionicons name="barbell-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>Ejercicios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowMeasurementsModal(true)}
            >
              <Ionicons name="body-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>Medidas</Text>
            </TouchableOpacity>
            
            {!hasNutritionData ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.nutritionButton]}
                onPress={() => {
                  // Navegar al tab de Nutrición y luego a la pantalla de configuración
                  navigation.navigate('NutricionTab' as never, {
                    screen: 'NutritionSetup'
                  } as never);
                }}
              >
                <Ionicons name="nutrition-outline" size={24} color="#E31C1F" />
                <Text style={[styles.actionText, styles.nutritionText]}>Configurar Nutrición</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  // Navegar al tab de Nutrición
                  navigation.navigate('NutricionTab' as never);
                }}
              >
                <Ionicons name="nutrition-outline" size={24} color="#fff" />
                <Text style={styles.actionText}>Nutrición</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSave}>Ok</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.photoSection}>
              <Image 
                source={{ 
                  uri: profileImage || profile.profileImage 
                }} 
                style={styles.editProfileImage} 
              />
              <TouchableOpacity onPress={selectProfileImage}>
                <Text style={styles.changePhotoText}>Cambiar Foto</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSectionTitle}>Datos del perfil público</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={3}
                placeholderTextColor="#888"
              />
            </View>
            
            <Text style={styles.modalSectionTitle}>Datos privados</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sexo</Text>
              <TouchableOpacity style={styles.modalInput}>
                <Text style={styles.inputValue}>{editGender}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cumpleaños</Text>
              <TouchableOpacity style={styles.modalInput}>
                <Text style={styles.inputValue}>{editBirthday}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsModal}>
            <TouchableOpacity 
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                setShowChangePasswordModal(true);
              }}
            >
              <Text style={styles.settingsText}>🔒 Cambiar Contraseña</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsOption}
              onPress={() => {
                setShowSettingsModal(false);
                Alert.alert("Info", "Funcionalidad disponible próximamente");
              }}
            >
              <Text style={styles.settingsText}>📧 Actualizar Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingsOption, styles.logoutOption]}
              onPress={() => {
                setShowSettingsModal(false);
                handleLogout();
              }}
            >
              <Text style={[styles.settingsText, styles.logoutText]}>🚪 Cerrar Sesión</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelOption}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Measurements Modal */}
      <Modal
        visible={showMeasurementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMeasurementsModal(false)}>
              <Text style={styles.modalCancel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Registrar Medidas</Text>
            <TouchableOpacity onPress={saveMeasurements}>
              <Text style={styles.modalSave}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.modalInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="Ej: 70"
                keyboardType="numeric"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.modalInput}
                value={heightInput}
                onChangeText={setHeightInput}
                placeholder="Ej: 170"
                keyboardType="numeric"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Edad (años)</Text>
              <TextInput
                style={styles.modalInput}
                value={ageInput}
                onChangeText={setAgeInput}
                placeholder="Ej: 25"
                keyboardType="numeric"
                placeholderTextColor="#888"
              />
            </View>
            
            {profile.weight && profile.height && (
              <View style={styles.currentMeasures}>
                <Text style={styles.currentMeasuresTitle}>Medidas actuales:</Text>
                <Text style={styles.currentMeasuresText}>Peso: {profile.weight} kg</Text>
                <Text style={styles.currentMeasuresText}>Altura: {profile.height} cm</Text>
                <Text style={styles.currentMeasuresText}>Edad: {profile.age} años</Text>
                
                {/* Mostrar información nutricional si está disponible */}
                {nutritionData && (
                  <>
                    <Text style={styles.currentMeasuresTitle}>Datos Nutricionales:</Text>
                    <Text style={styles.currentMeasuresText}>
                      Género: {nutritionData.gender === 'male' ? 'Hombre' : 'Mujer'}
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Nivel de actividad: {nutritionData.activityLevel}
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Objetivo: {nutritionData.objective === 'lose' ? 'Perder peso' : 
                                nutritionData.objective === 'gain' ? 'Ganar peso' : 'Mantener peso'}
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Intensidad: {nutritionData.intensity}
                    </Text>
                    {nutritionData.targetWeight && (
                      <Text style={styles.currentMeasuresText}>
                        Peso objetivo: {nutritionData.targetWeight} kg
                      </Text>
                    )}
                    <Text style={styles.currentMeasuresTitle}>Macros Diarios:</Text>
                    <Text style={styles.currentMeasuresText}>
                      Calorías: {nutritionData.calories} kcal
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Proteína: {nutritionData.protein}g
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Carbohidratos: {nutritionData.carbs}g
                    </Text>
                    <Text style={styles.currentMeasuresText}>
                      Grasas: {nutritionData.fats}g
                    </Text>
                  </>
                )}
              </View>
            )}
          </ScrollView>
                 </SafeAreaView>
       </Modal>

       {/* Stats Modal */}
       <Modal
         visible={showStatsModal}
         animationType="slide"
         presentationStyle="pageSheet"
       >
         <SafeAreaView style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setShowStatsModal(false)}>
               <Text style={styles.modalCancel}>←</Text>
             </TouchableOpacity>
             <Text style={styles.modalTitle}>Estadísticas</Text>
             <View style={{width: 40}} />
           </View>
           
           <ScrollView style={styles.modalContent}>
             {/* Información actual del perfil */}
             {profile.weight && profile.height && profile.age && (
               <View style={styles.statsCard}>
                 <Text style={styles.statsCardTitle}>📊 Información Física</Text>
                 <View style={styles.statsMainRow}>
                   <View style={styles.statItem}>
                     <Text style={styles.statValue}>🧳 {profile.weight} kg</Text>
                     <Text style={styles.statLabel}>Peso</Text>
                   </View>
                   <View style={styles.statItem}>
                     <Text style={styles.statValue}>📏 {profile.height} cm</Text>
                     <Text style={styles.statLabel}>Altura</Text>
                   </View>
                   <View style={styles.statItem}>
                     <Text style={styles.statValue}>🎂 {profile.age} años</Text>
                     <Text style={styles.statLabel}>Edad</Text>
                   </View>
                 </View>
                 
                 {/* BMI */}
                 {(() => {
                   const bmi = calculateBMI(profile.weight, profile.height);
                   return (
                     <View style={styles.bmiCard}>
                       <Text style={styles.bmiLabel}>Índice de Masa Corporal (BMI)</Text>
                       <Text style={[styles.bmiValue, { color: getBMIColor(bmi) }]}>{bmi}</Text>
                       <Text style={styles.bmiCategory}>{getBMICategory(bmi)}</Text>
                     </View>
                   );
                 })()}
               </View>
             )}

             {/* Evolución de peso */}
             <View style={{ marginVertical: 16 }}>
               <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8, paddingHorizontal: 16 }}>
                 📈 Evolución de peso
               </Text>
               <WeightChart userId={uid!} />
             </View>
             
             {/* Estadísticas de entrenamientos */}
             <View style={styles.statsCard}>
               <Text style={styles.statsCardTitle}>💪 Entrenamientos</Text>
               <View style={styles.statsMainRow}>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>{trainingCount}</Text>
                   <Text style={styles.statLabel}>Total Entrenos</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>0</Text>
                   <Text style={styles.statLabel}>Esta Semana</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>3</Text>
                   <Text style={styles.statLabel}>Racha (días)</Text>
                 </View>
               </View>
             </View>
             
             {/* Estadísticas de volumen */}
             <View style={styles.statsCard}>
               <Text style={styles.statsCardTitle}>🏋️ Volumen</Text>
               <View style={styles.statsMainRow}>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>48.5K kg</Text>
                   <Text style={styles.statLabel}>Total</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>0 kg</Text>
                   <Text style={styles.statLabel}>Esta Semana</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statValue}>5.8K kg</Text>
                   <Text style={styles.statLabel}>Promedio</Text>
                 </View>
               </View>
             </View>
           </ScrollView>
         </SafeAreaView>
       </Modal>

      {/* Birthday Modal */}
      <Modal
        visible={showBirthdayModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.birthdayOverlay}>
          <View style={styles.birthdayModal}>
            <View style={styles.birthdayIconContainer}>
              <Ionicons name="gift" size={60} color="#E31C1F" />
            </View>
            
            <Text style={styles.birthdayTitle}>¡Feliz Cumpleaños!</Text>
            <Text style={styles.birthdaySubtitle}>{profile.name}</Text>
            
            <Text style={styles.birthdayMessage}>
              "Que este nuevo año de vida te traiga fuerza, determinación y éxitos en todos tus entrenamientos. ¡Sigue persiguiendo tus metas con pasión!"
            </Text>
            
            <TouchableOpacity 
              style={styles.birthdayButton}
              onPress={() => setShowBirthdayModal(false)}
            >
              <Text style={styles.birthdayButtonText}>¡Gracias!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={handleChangePassword}>
              <Text style={styles.modalSave}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Contraseña actual */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña actual</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Ingresa tu contraseña actual"
                  secureTextEntry={!showPasswords.current}
                  placeholderTextColor="#888"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  <Ionicons 
                    name={showPasswords.current ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nueva contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordForm.newPassword}
                  onChangeText={onNewPasswordChange}
                  placeholder="Mínimo 8, mayúscula, minúscula, número y símbolo"
                  secureTextEntry={!showPasswords.new}
                  placeholderTextColor="#888"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  <Ionicons 
                    name={showPasswords.new ? "eye-off" : "eye"} 
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
            </View>

            {/* Confirmar nueva contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Repite la nueva contraseña"
                  secureTextEntry={!showPasswords.confirm}
                  placeholderTextColor="#888"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  <Ionicons 
                    name={showPasswords.confirm ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
     header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 20, // Volver al valor original
     backgroundColor: '#000',
     marginTop: 10,
   },
   editButton: {
     color: '#888',
     fontSize: 16,
     lineHeight: 18,
   },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  profileName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (windowWidth - 48) / 2,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  nutritionButton: {
    borderWidth: 2,
    borderColor: '#E31C1F',
  },
  nutritionText: {
    color: '#E31C1F',
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCancel: {
    color: '#fff',
    fontSize: 18,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSave: {
    color: '#E31C1F',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changePhotoText: {
    color: '#E31C1F',
    fontSize: 16,
  },
  modalSectionTitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputValue: {
    color: '#E31C1F',
    fontSize: 16,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#333',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
  },
  settingsOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutOption: {
    borderBottomColor: '#ff4444',
  },
  logoutText: {
    color: '#ff4444',
  },
  cancelOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
    backgroundColor: '#555',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  currentMeasures: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  currentMeasuresTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
     currentMeasuresText: {
     color: '#888',
     fontSize: 14,
     marginBottom: 4,
   },
   statsCard: {
     backgroundColor: '#333',
     borderRadius: 12,
     padding: 20,
     marginBottom: 16,
   },
   statsCardTitle: {
     color: '#fff',
     fontSize: 18,
     fontWeight: 'bold',
     marginBottom: 16,
   },
   statsMainRow: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     marginBottom: 16,
   },
   statValue: {
     color: '#ff4444',
     fontSize: 16,
     fontWeight: 'bold',
     textAlign: 'center',
   },
   bmiCard: {
     backgroundColor: '#222',
     borderRadius: 8,
     padding: 16,
     alignItems: 'center',
     marginTop: 8,
   },
   bmiLabel: {
     color: '#888',
     fontSize: 14,
     marginBottom: 8,
   },
   bmiValue: {
     fontSize: 28,
     fontWeight: 'bold',
     marginBottom: 4,
   },
   bmiCategory: {
     color: '#888',
     fontSize: 16,
     fontWeight: 'bold',
   },
   birthdayOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0,0,0,0.7)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   birthdayModal: {
     backgroundColor: '#333',
     borderRadius: 16,
     padding: 20,
     alignItems: 'center',
     width: '80%',
   },
   birthdayIconContainer: {
     backgroundColor: '#fff',
     borderRadius: 30,
     width: 60,
     height: 60,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 15,
   },
   birthdayTitle: {
     color: '#fff',
     fontSize: 24,
     fontWeight: 'bold',
     marginBottom: 8,
   },
   birthdaySubtitle: {
     color: '#fff',
     fontSize: 18,
     marginBottom: 15,
   },
   birthdayMessage: {
     color: '#888',
     fontSize: 16,
     textAlign: 'center',
     marginBottom: 20,
     lineHeight: 22,
   },
   birthdayButton: {
     backgroundColor: '#E31C1F',
     borderRadius: 8,
     paddingVertical: 12,
     paddingHorizontal: 25,
   },
   birthdayButtonText: {
     color: '#fff',
     fontSize: 18,
     fontWeight: 'bold',
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
});

export default ProfileScreen; 