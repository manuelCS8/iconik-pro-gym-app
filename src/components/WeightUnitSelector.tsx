import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeightUnit } from '../redux/slices/userPreferencesSlice';
import userPreferencesService from '../services/userPreferencesService';

interface WeightUnitSelectorProps {
  currentUnit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const WeightUnitSelector: React.FC<WeightUnitSelectorProps> = ({
  currentUnit,
  onUnitChange,
  size = 'medium',
  showLabel = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleUnitChange = (newUnit: WeightUnit) => {
    onUnitChange(newUnit);
    setShowModal(false);
  };

  const getUnitSymbol = () => {
    return userPreferencesService.getUnitSymbol(currentUnit);
  };

  const getButtonStyle = () => {
    switch (size) {
      case 'small':
        return styles.unitButtonSmall;
      case 'large':
        return styles.unitButtonLarge;
      default:
        return styles.unitButtonMedium;
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.unitTextSmall;
      case 'large':
        return styles.unitTextLarge;
      default:
        return styles.unitTextMedium;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.unitButton, getButtonStyle()]}
        onPress={() => setShowModal(true)}
      >
        {showLabel && (
          <Text style={[styles.unitLabel, getTextStyle()]}>Peso</Text>
        )}
        <Text style={[styles.unitText, getTextStyle()]}>{getUnitSymbol()}</Text>
        <Ionicons 
          name="chevron-down" 
          size={size === 'small' ? 10 : size === 'large' ? 16 : 12} 
          color="#ffffff" 
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Unidad de Peso</Text>
            
            <TouchableOpacity
              style={[
                styles.unitOption,
                currentUnit === 'KG' && styles.unitOptionSelected
              ]}
              onPress={() => handleUnitChange('KG')}
            >
              <Text style={[
                styles.unitOptionText,
                currentUnit === 'KG' && styles.unitOptionTextSelected
              ]}>
                Kilogramos (kg)
              </Text>
              {currentUnit === 'KG' && (
                <Ionicons name="checkmark" size={20} color="#E31C1F" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unitOption,
                currentUnit === 'LBS' && styles.unitOptionSelected
              ]}
              onPress={() => handleUnitChange('LBS')}
            >
              <Text style={[
                styles.unitOptionText,
                currentUnit === 'LBS' && styles.unitOptionTextSelected
              ]}>
                Libras (lbs)
              </Text>
              {currentUnit === 'LBS' && (
                <Ionicons name="checkmark" size={20} color="#E31C1F" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31C1F',
    borderRadius: 4,
  },
  unitButtonSmall: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  unitButtonMedium: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  unitButtonLarge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  unitLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginRight: 4,
  },
  unitLabelSmall: {
    fontSize: 8,
  },
  unitLabelMedium: {
    fontSize: 10,
  },
  unitLabelLarge: {
    fontSize: 12,
  },
  unitText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginRight: 2,
  },
  unitTextSmall: {
    fontSize: 8,
  },
  unitTextMedium: {
    fontSize: 10,
  },
  unitTextLarge: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  unitOptionSelected: {
    backgroundColor: '#E31C1F',
  },
  unitOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  unitOptionTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WeightUnitSelector; 