import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Picker,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CalendarPicker from '../../components/CalendarPicker';

const CreateUserScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'MEMBER' as 'MEMBER' | 'ADMIN',
    age: '',
    membershipStart: new Date(),
    membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleStartDateSelect = (date: Date) => {
    updateFormData('membershipStart', date);
    // Si la fecha de fin es anterior o igual a la nueva fecha de inicio, ajustar automáticamente
    if (formData.membershipEnd <= date) {
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + 30); // Agregar 30 días por defecto
      updateFormData('membershipEnd', newEndDate);
    }
  };

  const handleEndDateSelect = (date: Date) => {
    updateFormData('membershipEnd', date);
  };

  const validateForm = () => {
    const { displayName, email, age } = formData;

    if (!displayName.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'El correo electrónico es obligatorio');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Formato de correo inválido');
      return false;
    }

    if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
      Alert.alert('Error', 'La edad debe estar entre 13 y 100 años');
      return false;
    }

    if (formData.membershipEnd <= formData.membershipStart) {
      Alert.alert('Error', 'La fecha de fin de membresía debe ser posterior a la fecha de inicio');
      return false;
    }

    return true;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No tienes permisos para crear usuarios');
      return;
    }

    setIsLoading(true);

    try {
      const { displayName, email, role, membershipStart, membershipEnd, age } = formData;

      const userData = {
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role: role.toUpperCase(),
        age: parseInt(age),
        membershipType: 'basic', // Valor por defecto
        membershipStart,
        membershipEnd,
      };

      await authService.createPendingUser(user.uid, userData);

      Alert.alert(
        '✅ Usuario Creado',
        `El usuario ${displayName} ha sido creado exitosamente.\n\nEl miembro debe completar su registro ingresando:\n• Nombre completo: ${displayName}\n• Email: ${email}\n• Edad: ${age} años`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      
      let errorMessage = 'Error al crear el usuario';
      if (error.message?.includes('Solo los administradores')) {
        errorMessage = 'Solo los administradores pueden crear usuarios';
      } else if (error.message?.includes('límite máximo')) {
        errorMessage = 'Se ha alcanzado el límite máximo de 5 administradores';
      } else if (error.message?.includes('ya está en uso')) {
        errorMessage = 'Este correo ya está registrado';
      } else if (error.message?.includes('fecha de fin')) {
        errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  const openStartCalendar = () => {
    setShowStartCalendar(true);
  };

  const openEndCalendar = () => {
    setShowEndCalendar(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Nuevo Usuario</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleCreateUser}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          {/* Información Personal */}
          <Text style={styles.sectionTitle}>📋 Información Personal</Text>
          
          <Text style={styles.label}>Nombre Completo *</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#888"
            value={formData.displayName}
            onChangeText={(text) => updateFormData('displayName', text)}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput 
            style={styles.input}
            placeholder="juan@email.com"
            placeholderTextColor="#888"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Edad *</Text>
          <TextInput 
            style={styles.input}
            placeholder="25"
            placeholderTextColor="#888"
            value={formData.age}
            onChangeText={(text) => updateFormData('age', text)}
            keyboardType="numeric"
          />

          {/* Rol */}
          <Text style={styles.label}>Rol</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                formData.role === 'MEMBER' && styles.roleButtonActive
              ]}
              onPress={() => updateFormData('role', 'MEMBER')}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={formData.role === 'MEMBER' ? '#fff' : '#ccc'} 
              />
              <Text style={[
                styles.roleButtonText, 
                formData.role === 'MEMBER' && styles.roleButtonTextActive
              ]}>
                Miembro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                formData.role === 'ADMIN' && styles.roleButtonActive
              ]}
              onPress={() => updateFormData('role', 'ADMIN')}
            >
              <Ionicons 
                name="shield" 
                size={20} 
                color={formData.role === 'ADMIN' ? '#fff' : '#ccc'} 
              />
              <Text style={[
                styles.roleButtonText, 
                formData.role === 'ADMIN' && styles.roleButtonTextActive
              ]}>
                Administrador
              </Text>
            </TouchableOpacity>
          </View>

                     {/* Membresía */}
           <Text style={styles.sectionTitle}>🏋️ Membresía</Text>
           
           <Text style={styles.label}>Fecha de Inicio de Membresía</Text>
                     <TouchableOpacity 
            style={styles.dateButton}
            onPress={openStartCalendar}
          >
            <Ionicons name="calendar" size={20} color="#ccc" />
            <Text style={styles.dateButtonText}>{formatDate(formData.membershipStart)}</Text>
            <Ionicons name="chevron-down" size={16} color="#ccc" />
          </TouchableOpacity>

           <Text style={styles.label}>Fecha de Fin de Membresía</Text>
                     <TouchableOpacity 
            style={styles.dateButton}
            onPress={openEndCalendar}
          >
            <Ionicons name="calendar" size={20} color="#ccc" />
            <Text style={styles.dateButtonText}>{formatDate(formData.membershipEnd)}</Text>
            <Ionicons name="chevron-down" size={16} color="#ccc" />
          </TouchableOpacity>

          {/* Información adicional */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color="#ff4444" />
            <Text style={styles.infoText}>
              El usuario deberá completar su registro ingresando su nombre completo, email y edad exactamente como se registraron aquí.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Calendarios */}
      <CalendarPicker
        visible={showStartCalendar}
        onClose={() => setShowStartCalendar(false)}
        onDateSelect={handleStartDateSelect}
        selectedDate={formData.membershipStart}
        minDate={new Date(2020, 0, 1)}
        title="Fecha de Inicio de Membresía"
      />
      
      <CalendarPicker
        visible={showEndCalendar}
        onClose={() => setShowEndCalendar(false)}
        onDateSelect={handleEndDateSelect}
        selectedDate={formData.membershipEnd}
        minDate={formData.membershipStart}
        title="Fecha de Fin de Membresía"
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#222',
    color: '#fff',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#222',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  membershipContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  membershipButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#222',
    alignItems: 'center',
  },
  membershipButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  membershipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  membershipButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#222',
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default CreateUserScreen; 