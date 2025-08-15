import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootState } from '../../../redux/store';
import {
  addMealLog,
  setLoading,
  setError
} from '../../../redux/slices/nutritionSlice';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from '../../../utils/theme';
import aiAnalysisService from '../../../services/aiAnalysisService';
import tempStorageService from '../../../services/tempStorageService';

const AddMealScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const appColors = COLORS;
  const { uid } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.nutrition);
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Desayuno', icon: 'sunny' },
    { value: 'lunch', label: 'Almuerzo', icon: 'restaurant' },
    { value: 'dinner', label: 'Cena', icon: 'moon' },
    { value: 'snack', label: 'Snack', icon: 'cafe' }
  ];

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitamos acceso a la cámara para tomar fotos de tus comidas.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const analyzeImage = async (uri: string) => {
    if (!uid) return;

    setIsAnalyzing(true);
    try {
      const result = await aiAnalysisService.analyzeMealImage(uri, description);
      setAnalysis(result);
      console.log('✅ Análisis IA completado:', result);
      console.log('🔘 Botón guardar debería aparecer ahora');
    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      Alert.alert('Error', 'No se pudo analizar la imagen. Usando valores por defecto.');
      // Usar valores por defecto
      setAnalysis({
        calories: 250,
        protein: 12,
        carbs: 30,
        fats: 8,
        confidence: 0.5,
        detectedFoods: ['comida'],
        description: 'Análisis automático (estimación)'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!uid || !analysis) {
      Alert.alert('Error', 'No hay análisis disponible');
      return;
    }

    dispatch(setLoading(true));
    try {
      const mealLog = {
        id: Date.now().toString(),
        userId: uid,
        date: new Date().toDateString(),
        mealType,
        imageUrl: imageUri,
        description: description || undefined,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        aiAnalysis: JSON.stringify(analysis),
        timestamp: new Date().toISOString()
      };

      // Guardar en almacenamiento temporal
      await tempStorageService.insertMealLog({
        userId: mealLog.userId,
        date: mealLog.date,
        mealType: mealLog.mealType,
        imageUrl: mealLog.imageUrl,
        description: mealLog.description,
        calories: mealLog.calories,
        protein: mealLog.protein,
        carbs: mealLog.carbs,
        fats: mealLog.fats,
        aiAnalysis: mealLog.aiAnalysis,
        timestamp: mealLog.timestamp
      });

      // Agregar a Redux
      dispatch(addMealLog(mealLog));

      Alert.alert(
        '¡Comida Guardada!',
        'Tu comida ha sido registrada exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'No se pudo guardar la comida');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRetakePhoto = () => {
    setImageUri(null);
    setAnalysis(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appColors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: appColors.secondary }]}>Agregar Comida</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de comida */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.secondary }]}>Tipo de Comida</Text>
          <View style={styles.mealTypeContainer}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.mealTypeButton,
                  mealType === type.value && { backgroundColor: appColors.primary }
                ]}
                onPress={() => setMealType(type.value as any)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={mealType === type.value ? 'white' : appColors.secondary} 
                />
                <Text style={[
                  styles.mealTypeText,
                  { color: mealType === type.value ? 'white' : appColors.secondary }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Captura de imagen */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Foto de la Comida</Text>
          
          {!imageUri ? (
            <View style={styles.imageCaptureContainer}>
              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: colors.primary }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={32} color="white" />
                <Text style={styles.captureButtonText}>Tomar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handlePickImage}
              >
                <Ionicons name="images" size={32} color={colors.text} />
                <Text style={[styles.captureButtonText, { color: colors.text }]}>Galería</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleRetakePhoto}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retakeButtonText}>Volver a tomar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nombre del Alimento</Text>
          <TextInput
            style={[styles.descriptionInput, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Nombre del alimento o coloca un nombre para tu comida..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Análisis IA */}
        {isAnalyzing && (
          <View style={[styles.analysisContainer, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.text }]}>
              Analizando imagen con IA...
            </Text>
          </View>
        )}

        {analysis && !isAnalyzing && (
          <View style={[styles.analysisContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.analysisTitle, { color: colors.text }]}>
              Análisis de IA
            </Text>
            <Text style={[styles.analysisDescription, { color: colors.textSecondary }]}>
              {analysis.description || 'Análisis automático (estimación)'}
            </Text>
            
            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.primary }]}>
                  {analysis.calories}
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  Calorías
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.primary }]}>
                  {analysis.protein}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  Proteína
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.primary }]}>
                  {analysis.carbs}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  Carbohidratos
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.primary }]}>
                  {analysis.fats}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  Grasas
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Botón guardar */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { 
              backgroundColor: analysis ? '#FF4444' : '#ccc',
              marginTop: 20,
              marginBottom: 100, // Espacio para la barra de navegación
              paddingVertical: 24, // Botón más grande
              borderRadius: 12,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            !analysis && { opacity: 0.5 }
          ]}
          onPress={handleSaveMeal}
          disabled={!analysis || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save" size={28} color="white" />
              <Text style={[styles.saveButtonText, { fontSize: 20, fontWeight: 'bold' }]}>
                {analysis ? '💾 GUARDAR COMIDA' : '⏳ Esperando análisis...'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageCaptureContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  analysisContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  analyzingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analysisDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMealScreen; 