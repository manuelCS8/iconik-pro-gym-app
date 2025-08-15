import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Solicitar permisos de cámara y galería
export const requestMediaPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      alert('Se necesitan permisos para acceder a la cámara y galería.');
      return false;
    }
  }
  return true;
};

// Seleccionar imagen desde la galería
export const pickImage = async (options: ImagePicker.ImagePickerOptions = {}) => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

// Tomar foto con la cámara
export const takePhoto = async (options: ImagePicker.ImagePickerOptions = {}) => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// Seleccionar video desde la galería
export const pickVideo = async (options: ImagePicker.ImagePickerOptions = {}) => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      videoMaxDuration: 60, // Máximo 60 segundos
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking video:', error);
    return null;
  }
};

// Grabar video con la cámara
export const recordVideo = async (options: ImagePicker.ImagePickerOptions = {}) => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      videoMaxDuration: 60, // Máximo 60 segundos
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error recording video:', error);
    return null;
  }
};

// Función para mostrar opciones de selección de media
export const showMediaOptions = async (type: 'image' | 'video' | 'both' = 'both') => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    let mediaTypes = ImagePicker.MediaTypeOptions.All;
    if (type === 'image') {
      mediaTypes = ImagePicker.MediaTypeOptions.Images;
    } else if (type === 'video') {
      mediaTypes = ImagePicker.MediaTypeOptions.Videos;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error showing media options:', error);
    return null;
  }
};

// Función para subir media a Firebase Storage
export const uploadMediaToFirebase = async (
  uri: string, 
  path: string,
  onProgress?: (progress: any) => void
) => {
  try {
    const { uploadFile } = await import('./storage');
    const result = await uploadFile(uri, path, onProgress);
    return result.url;
  } catch (error) {
    console.error('Error uploading media to Firebase:', error);
    throw error;
  }
}; 