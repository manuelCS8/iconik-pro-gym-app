import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRoutineExercise } from '../../redux/slices/userRoutinesSlice';
import { COLORS } from '../../utils/theme';

interface ExerciseCardProps {
  exercise: UserRoutineExercise;
  index: number;
  onEdit: (index: number, exercise: UserRoutineExercise) => void;
  onRemove: (index: number) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onEdit,
  onRemove
}) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseNumber}>#{index + 1}</Text>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
        </View>
        
        <View style={styles.exerciseDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="repeat" size={18} color="#4ECDC4" />
            <Text style={styles.detailText}>
              {exercise.sets} series × {exercise.reps} repeticiones
            </Text>
          </View>
          
          {exercise.weight > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="fitness" size={18} color="#FF6B6B" />
              <Text style={styles.detailText}>
                {exercise.weight} kg
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color="#96CEB4" />
            <Text style={styles.detailText}>
              {formatTime(exercise.restTime)} descanso
            </Text>
          </View>
        </View>
        
        {exercise.notes && exercise.notes.trim() && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text" size={16} color="#E31C1F" />
              <Text style={styles.notesLabel}>Notas:</Text>
            </View>
            <Text style={styles.notesText}>{exercise.notes}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(index, exercise)}
        >
          <Ionicons name="pencil" size={20} color="#4ECDC4" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onRemove(index)}
        >
          <Ionicons name="trash" size={20} color="#E31C1F" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
    backgroundColor: 'rgba(227, 28, 31, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  exerciseDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E31C1F',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 14,
    color: '#E31C1F',
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 16,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ExerciseCard; 