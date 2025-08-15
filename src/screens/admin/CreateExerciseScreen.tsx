import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { pickImage, pickVideo, showMediaOptions } from '../../services/mediaService';
import { uploadFile, generateStoragePath, validateFile, formatFileSize } from '../../services/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');

interface ExerciseForm {
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  instructions: string;
}

const CreateExerciseScreen: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<ExerciseForm>({
    name: '',
    description: '',
    muscleGroup: '',
    difficulty: '',
    instructions: '',
  });
  
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
  } | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ExerciseForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePickMedia = async (type: 'image' | 'video' | 'both' = 'both') => {
    try {
      let media;
      
      if (type === 'image') {
        media = await pickImage();
      } else if (type === 'video') {
        media = await pickVideo();
      } else {
        media = await showMediaOptions('both');
      }

      if (media) {
        // Validar archivo
        const validation = validateFile(media.fileName || 'file', media.fileSize || 0);
        
        if (!validation.isValid) {
          Alert.alert('Error', validation.error || 'Archivo no válido');
          return;
        }

        const mediaType = media.type === 'video' ? 'video' : 'image';
        
        setSelectedMedia({
          uri: media.uri,
          type: mediaType,
          fileName: media.fileName || 'file',
          fileSize: media.fileSize || 0,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al seleccionar media');
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

  const removeSelectedMedia = () => {
    setSelectedMedia(null);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 20, backgroundColor: '#181818', borderBottomWidth: 1, borderBottomColor: '#333' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>Agregar Ejercicio</Text>
        <Text style={{ fontSize: 16, color: '#ccc' }}>Agrega un nuevo ejercicio a la biblioteca</Text>
      </View>
      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: '#181818', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 }}>Información Básica</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 }}>Nombre del Ejercicio *</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} value={form.name} onChangeText={(value) => handleInputChange('name', value)} placeholder="Ej: Press de banca con mancuernas" placeholderTextColor="#888" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 }}>Descripción *</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16, height: 80, textAlignVertical: 'top' }} value={form.description} onChangeText={(value) => handleInputChange('description', value)} placeholder="Describe el ejercicio..." placeholderTextColor="#888" multiline numberOfLines={3} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 }}>Grupo Muscular</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} value={form.muscleGroup} onChangeText={(value) => handleInputChange('muscleGroup', value)} placeholder="Ej: Pecho" placeholderTextColor="#888" />
            </View>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 }}>Dificultad</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16 }} value={form.difficulty} onChangeText={(value) => handleInputChange('difficulty', value)} placeholder="Ej: Principiante" placeholderTextColor="#888" />
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 }}>Instrucciones</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#222', color: '#fff', marginBottom: 16, height: 80, textAlignVertical: 'top' }} value={form.instructions} onChangeText={(value) => handleInputChange('instructions', value)} placeholder="Instrucciones paso a paso..." placeholderTextColor="#888" multiline numberOfLines={4} />
        </View>
        {/* Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagen o Video</Text>
          
          {selectedMedia ? (
            <View style={styles.mediaPreview}>
              {selectedMedia.type === 'image' ? (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <Video
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreviewVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                />
              )}
              
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaFileName}>{selectedMedia.fileName}</Text>
                <Text style={styles.mediaFileSize}>
                  {formatFileSize(selectedMedia.fileSize)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.removeMediaButton}
                onPress={removeSelectedMedia}
              >
                <Text style={styles.removeMediaButtonText}>❌ Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaButtons}>
              <TouchableOpacity
                style={[styles.mediaButton, styles.imageButton]}
                onPress={() => handlePickMedia('image')}
              >
                <Text style={styles.mediaButtonText}>📷 Agregar Imagen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mediaButton, styles.videoButton]}
                onPress={() => handlePickMedia('video')}
              >
                <Text style={styles.mediaButtonText}>🎥 Agregar Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mediaButton, styles.mixedButton]}
                onPress={() => handlePickMedia('both')}
              >
                <Text style={styles.mediaButtonText}>📁 Seleccionar Media</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Progreso de subida */}
        {isUploading && (
          <View style={styles.uploadProgress}>
            <Text style={styles.uploadProgressText}>
              Subiendo archivo... {uploadProgress.toFixed(1)}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
              />
            </View>
          </View>
        )}

        {/* Botón de envío */}
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || isUploading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>💪 Crear Ejercicio</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#222',
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    backgroundColor: '#222',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  mediaButtons: {
    gap: 12,
  },
  mediaButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: '#222',
  },
  imageButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#222',
  },
  videoButton: {
    borderColor: '#2196F3',
    backgroundColor: '#222',
  },
  mixedButton: {
    borderColor: '#FF9800',
    backgroundColor: '#222',
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mediaPreview: {
    alignItems: 'center',
  },
  mediaPreviewImage: {
    width: width - 80,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaPreviewVideo: {
    width: width - 80,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  mediaFileSize: {
    fontSize: 12,
    color: '#ccc',
  },
  removeMediaButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  removeMediaButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadProgress: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateExerciseScreen; 