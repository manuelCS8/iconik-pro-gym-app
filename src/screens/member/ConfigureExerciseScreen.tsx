import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { COLORS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserRoutineExercise } from '../../redux/slices/userRoutinesSlice';
import exerciseService from '../../services/exerciseService';

interface RouteParams {
  exerciseId: string;
  exerciseName: string;
  onExerciseConfigured: (exercise: UserRoutineExercise) => void;
  initialValues?: {
    sets: number;
    reps: number;
    weight: number;
    restTime: number;
    notes: string;
  };
}

const ConfigureExerciseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { exerciseId, exerciseName, onExerciseConfigured, initialValues } = route.params as RouteParams;
  
  const [sets, setSets] = useState(initialValues?.sets?.toString() || '3');
  const [reps, setReps] = useState(initialValues?.reps?.toString() || '12');
  const [weight, setWeight] = useState(initialValues?.weight?.toString() || '0');
  const [restTime, setRestTime] = useState(initialValues?.restTime?.toString() || '60');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSaveExercise = () => {
    if (!sets.trim() || !reps.trim() || !restTime.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const exercise: UserRoutineExercise = {
      exerciseId,
      exerciseName,
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 12,
      weight: parseFloat(weight) || 0,
      restTime: parseInt(restTime) || 60,
      notes: notes.trim()
    };

    // Llamar al callback para agregar el ejercicio a la rutina
    onExerciseConfigured(exercise);
    
    // Regresar a la pantalla anterior
    navigation.goBack();
  };

  const formatTime = (seconds: string) => {
    const secs = parseInt(seconds) || 0;
    if (secs < 60) {
      return `${secs}s`;
    }
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurar Ejercicio</Text>
        <TouchableOpacity onPress={handleSaveExercise} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del ejercicio */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.exerciseSubtitle}>Configura los parámetros de entrenamiento</Text>
        </View>

        {/* Series */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Series *</Text>
          <TextInput
            style={styles.input}
            value={sets}
            onChangeText={setSets}
            placeholder="3"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Número de series a realizar</Text>
        </View>

        {/* Repeticiones */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Repeticiones *</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            placeholder="12"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Repeticiones por serie</Text>
        </View>

        {/* Peso */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Peso a usar (0 = sin peso)</Text>
        </View>

        {/* Tiempo de descanso */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descanso (segundos) *</Text>
          <TextInput
            style={styles.input}
            value={restTime}
            onChangeText={setRestTime}
            placeholder="60"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Tiempo de descanso entre series: {formatTime(restTime)}</Text>
        </View>

        {/* Notas */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agregar notas sobre técnica, variaciones, etc."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del Ejercicio</Text>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Series:</Text> {sets}
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Repeticiones:</Text> {reps}
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Peso:</Text> {weight} kg
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Descanso:</Text> {formatTime(restTime)}
            </Text>
            {notes.trim() && (
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Notas:</Text> {notes}
              </Text>
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  exerciseInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#181818',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#ccc',
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#fff',
  },
});

export default ConfigureExerciseScreen; 