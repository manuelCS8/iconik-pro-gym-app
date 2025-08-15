import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadFile, generateStoragePath } from '../../services/storage';
import { pickMedia } from '../../services/mediaService';
import { COLORS } from '../../utils/theme';

const WebExerciseUploadScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    muscleGroup: '',
    difficulty: '',
    instructions: '',
  });

  const muscleGroups = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 
    'Antebrazos', 'Piernas', 'Glúteos', 'Abdominales', 
    'Pantorrillas', 'Cardio', 'Otros'
  ];

  const difficulties = [
    'beginner', 'intermediate', 'advanced'
  ];

  const handleSelectMedia = async () => {
    try {
      const result = await pickMedia();
      if (result) {
        setSelectedMedia(result);
        
        // Crear preview para web
        if (Platform.OS === 'web' && result.uri) {
          setMediaPreview(result.uri);
        }
      }
    } catch (error: any) {
      console.error('Error seleccionando media:', error);
      Alert.alert('Error', 'Error al seleccionar archivo: ' + error.message);
    }
  };

  const handleUploadMedia = async (): Promise<string | null> => {
    if (!selectedMedia) return null;

    try {
      console.log('🚀 Iniciando subida de media:', {
        uri: selectedMedia.uri,
        type: selectedMedia.type,
        fileName: selectedMedia.fileName,
        fileSize: selectedMedia.fileSize
      });

      setIsUploading(true);
      setUploadProgress(0);

      // Generar ruta única
      const storagePath = generateStoragePath(
        selectedMedia.fileName,
        `exercises/${user?.uid || 'anonymous'}`
      );

      console.log('📁 Ruta de storage generada:', storagePath);

      // Subir archivo
      const result = await uploadFile(
        selectedMedia.uri,
        storagePath,
        (progress) => {
          console.log('📊 Progreso de subida:', progress.percent + '%');
          setUploadProgress(progress.percent);
        }
      );

      console.log('✅ Archivo subido exitosamente:', {
        url: result.url,
        path: result.path
      });

      setIsUploading(false);
      setUploadProgress(0);
      
      return result.url;
    } catch (error: any) {
      console.error('❌ Error en handleUploadMedia:', error);
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Error', 'Error al subir el archivo: ' + error.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Validar formulario
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      console.log('📝 Iniciando creación de ejercicio:', form);
      setIsSubmitting(true);

      // Subir media si existe
      let mediaURL = '';
      if (selectedMedia) {
        console.log('🎬 Media seleccionado, iniciando subida...');
        mediaURL = await handleUploadMedia() || '';
        console.log('🔗 URL de media obtenida:', mediaURL);
      } else {
        console.log('📷 No hay media seleccionado');
      }

      // Crear documento en Firestore
      const exerciseData = {
        ...form,
        mediaURL,
        mediaType: selectedMedia?.type || null,
        createdBy: user?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('💾 Datos del ejercicio a guardar:', exerciseData);

      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);

      console.log('✅ Ejercicio creado exitosamente con ID:', docRef.id);

      Alert.alert(
        'Éxito', 
        'Ejercicio creado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario
              setForm({
                name: '',
                description: '',
                muscleGroup: '',
                difficulty: '',
                instructions: '',
              });
              setSelectedMedia(null);
              setMediaPreview('');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Error al crear ejercicio:', error);
      Alert.alert('Error', 'Error al crear el ejercicio: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>📝 Crear Ejercicio (Web)</Text>
          <Text style={styles.subtitle}>
            Interfaz optimizada para crear ejercicios desde el navegador
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Nombre del Ejercicio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Ejercicio *</Text>
            <TextInput
              style={styles.textInput}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Ej: Press Banca (Barra)"
              placeholderTextColor="#666"
            />
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Describe el ejercicio..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Grupo Muscular */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grupo Muscular</Text>
            <View style={styles.selectContainer}>
              {muscleGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.selectOption,
                    form.muscleGroup === group && styles.selectOptionActive
                  ]}
                  onPress={() => setForm({ ...form, muscleGroup: group })}
                >
                  <Text style={[
                    styles.selectOptionText,
                    form.muscleGroup === group && styles.selectOptionTextActive
                  ]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dificultad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dificultad</Text>
            <View style={styles.selectContainer}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.selectOption,
                    form.difficulty === diff && styles.selectOptionActive
                  ]}
                  onPress={() => setForm({ ...form, difficulty: diff })}
                >
                  <Text style={[
                    styles.selectOptionText,
                    form.difficulty === diff && styles.selectOptionTextActive
                  ]}>
                    {diff === 'beginner' ? 'Principiante' : 
                     diff === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instrucciones */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instrucciones</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.instructions}
              onChangeText={(text) => setForm({ ...form, instructions: text })}
              placeholder="Instrucciones paso a paso..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Media Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imagen o Video</Text>
            
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleSelectMedia}
              disabled={isUploading}
            >
              <Text style={styles.uploadButtonText}>
                {selectedMedia ? '📁 Cambiar Archivo' : '📁 Seleccionar Archivo'}
              </Text>
            </TouchableOpacity>

            {selectedMedia && (
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaInfoText}>
                  📄 {selectedMedia.fileName}
                </Text>
                <Text style={styles.mediaInfoText}>
                  📊 {(selectedMedia.fileSize / 1024 / 1024).toFixed(2)} MB
                </Text>
                <Text style={styles.mediaInfoText}>
                  🎬 {selectedMedia.type}
                </Text>
              </View>
            )}

            {mediaPreview && (
              <View style={styles.previewContainer}>
                {selectedMedia?.type?.startsWith('image/') ? (
                  <img 
                    src={mediaPreview} 
                    style={styles.previewImage}
                    alt="Preview"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    style={styles.previewVideo}
                    controls
                  />
                )}
              </View>
            )}

            {isUploading && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.progressText}>
                  Subiendo... {uploadProgress.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || isUploading) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Creando...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>✅ Crear Ejercicio</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#181818',
  },
  selectOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectOptionText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#181818',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaInfo: {
    backgroundColor: '#181818',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaInfoText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  previewContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    objectFit: 'cover',
  },
  previewVideo: {
    width: 300,
    height: 200,
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  progressText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default WebExerciseUploadScreen; 