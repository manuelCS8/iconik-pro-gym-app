import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '../contexts/TrainingContext';
import { useNavigation } from '@react-navigation/native';

const TrainingModal: React.FC = () => {
  const { 
    isModalVisible, 
    hideTrainingModal, 
    setTrainingInProgress,
    clearTrainingProgress,
    currentTrainingScreen 
  } = useTraining();
  const navigation = useNavigation();

  const handleResumeTraining = () => {
    hideTrainingModal();
    // Navegar de vuelta a la pantalla de entrenamiento si existe
    if (currentTrainingScreen) {
      navigation.navigate(currentTrainingScreen as never);
    } else {
      // Si no hay pantalla específica, ir a la pantalla principal de entrenar
      navigation.navigate('EntrenarHome' as never);
    }
  };

  const handleDiscardTraining = () => {
    Alert.alert(
      'Descartar Entrenamiento',
      '¿Estás seguro de que quieres descartar este entrenamiento? Se perderá todo el progreso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => {
          hideTrainingModal();
          clearTrainingProgress();
          // Navegar a la pantalla de rutinas explorar
          navigation.navigate('ExploreRoutines' as never);
        }}
      ]
    );
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={hideTrainingModal}
    >
      <View style={styles.modalOverlay}>
        {/* Overlay en la parte inferior */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.modalTitle}>Entreno en Progreso</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.resumeButton}
              onPress={handleResumeTraining}
            >
              <Ionicons name="play" size={20} color="#007AFF" />
              <Text style={styles.resumeButtonText}>Reanudar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.discardButton}
              onPress={handleDiscardTraining}
            >
              <Ionicons name="close" size={20} color="#FF3B30" />
              <Text style={styles.discardButtonText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Alinea en la parte inferior
  },
  bottomOverlay: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // Espacio extra para la navegación
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  resumeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  discardButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TrainingModal; 