import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../../utils/theme';
import { uploadFile, generateStoragePath } from '../../services/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TestImageUploadScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploadedImageURL, setUploadedImageURL] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permiso requerido", "Se necesita acceso a la galería para seleccionar imágenes.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setUploadedImageURL(''); // Reset uploaded URL
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadImageToStorage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Primero selecciona una imagen');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generar nombre de archivo único
      const fileName = `test_image_${Date.now()}.jpg`;
      const storagePath = generateStoragePath(fileName, 'exercises/images');
      
      console.log('🔄 Iniciando subida de imagen...');
      console.log('📁 Ruta en Storage:', storagePath);
      
      // Subir imagen a Firebase Storage
      const uploadResult = await uploadFile(selectedImage, storagePath, (progress) => {
        setUploadProgress(progress.percent);
        console.log(`📤 Progreso: ${progress.percent.toFixed(1)}%`);
      });
      
      setUploadedImageURL(uploadResult.url);
      console.log('✅ Imagen subida exitosamente:', uploadResult.url);
      
      Alert.alert('Éxito', 'Imagen subida correctamente a Firebase Storage');
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen a Firebase Storage');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createTestExercise = async () => {
    if (!uploadedImageURL) {
      Alert.alert('Error', 'Primero sube una imagen a Firebase Storage');
      return;
    }

    try {
      setIsUploading(true);

      // Crear ejercicio de prueba en Firestore
      const exerciseData = {
        name: 'Ejercicio de Prueba - Imagen',
        primaryMuscleGroups: ['Pecho'],
        secondaryMuscleGroups: [],
        equipment: 'Mancuernas',
        difficulty: 'Principiante',
        description: 'Ejercicio de prueba para verificar subida de imágenes',
        instructions: 'Instrucciones de prueba',
        tips: 'Tips de prueba',
        mediaType: 'image',
        mediaURL: uploadedImageURL, // URL pública de Firebase Storage
        imageURL: uploadedImageURL, // URL pública de imagen para compatibilidad
        thumbnailURL: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin',
        isActive: true,
      };

      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
      
      console.log('✅ Ejercicio de prueba creado en Firestore:', docRef.id);
      console.log('📊 Datos guardados:', exerciseData);
      
      Alert.alert(
        'Éxito', 
        `Ejercicio de prueba creado exitosamente!\n\nID: ${docRef.id}\n\nVerifica en Firebase Console que se guardó correctamente.`
      );
      
    } catch (error) {
      console.error('Error creando ejercicio de prueba:', error);
      Alert.alert('Error', 'No se pudo crear el ejercicio de prueba en Firestore');
    } finally {
      setIsUploading(false);
    }
  };

  const resetTest = () => {
    setSelectedImage('');
    setUploadedImageURL('');
    setUploadProgress(0);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Prueba de Subida de Imágenes</Text>
          <Text style={styles.subtitle}>
            Verifica que las imágenes se suban correctamente a Firebase Storage
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📋 Pasos de Prueba:</Text>
          <Text style={styles.instructionsText}>
            1. Selecciona una imagen de tu galería{'\n'}
            2. Sube la imagen a Firebase Storage{'\n'}
            3. Crea un ejercicio de prueba en Firestore{'\n'}
            4. Verifica en Firebase Console
          </Text>
        </View>

        {/* Step 1: Pick Image */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>1️⃣ Seleccionar Imagen</Text>
          <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color={COLORS.white} />
            <Text style={styles.pickButtonText}>Seleccionar Imagen</Text>
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Text style={styles.imageInfo}>Imagen seleccionada ✓</Text>
            </View>
          )}
        </View>

        {/* Step 2: Upload to Storage */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>2️⃣ Subir a Firebase Storage</Text>
          <TouchableOpacity 
            style={[styles.uploadButton, !selectedImage && styles.disabledButton]} 
            onPress={uploadImageToStorage}
            disabled={!selectedImage || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="cloud-upload" size={24} color={COLORS.white} />
            )}
            <Text style={styles.uploadButtonText}>
              {isUploading ? `Subiendo... ${uploadProgress.toFixed(1)}%` : 'Subir a Firebase Storage'}
            </Text>
          </TouchableOpacity>
          
          {uploadedImageURL && (
            <View style={styles.urlContainer}>
              <Text style={styles.urlLabel}>URL de Firebase Storage:</Text>
              <Text style={styles.urlText} numberOfLines={3}>
                {uploadedImageURL}
              </Text>
            </View>
          )}
        </View>

        {/* Step 3: Create Test Exercise */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>3️⃣ Crear Ejercicio de Prueba</Text>
          <TouchableOpacity 
            style={[styles.createButton, !uploadedImageURL && styles.disabledButton]} 
            onPress={createTestExercise}
            disabled={!uploadedImageURL || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="add-circle" size={24} color={COLORS.white} />
            )}
            <Text style={styles.createButtonText}>
              {isUploading ? 'Creando...' : 'Crear Ejercicio de Prueba'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
          <Ionicons name="refresh" size={20} color={COLORS.gray} />
          <Text style={styles.resetButtonText}>Reiniciar Prueba</Text>
        </TouchableOpacity>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>📊 Estado de la Prueba:</Text>
          <View style={styles.statusItem}>
            <Ionicons 
              name={selectedImage ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={selectedImage ? COLORS.success : COLORS.gray} 
            />
            <Text style={styles.statusText}>Imagen seleccionada</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons 
              name={uploadedImageURL ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={uploadedImageURL ? COLORS.success : COLORS.gray} 
            />
            <Text style={styles.statusText}>Subida a Firebase Storage</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: SIZES.largeTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.8,
  },
  instructionsContainer: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    lineHeight: 20,
  },
  stepContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  stepTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
  },
  pickButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageInfo: {
    fontSize: SIZES.small,
    color: COLORS.success,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    padding: 15,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  urlContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  urlLabel: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  urlText: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: 15,
    borderRadius: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  resetButtonText: {
    color: COLORS.gray,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginLeft: 10,
  },
  statusContainer: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginLeft: 10,
  },
});

export default TestImageUploadScreen; 