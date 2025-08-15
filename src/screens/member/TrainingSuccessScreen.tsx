import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import trainingHistoryService, { TrainingSession } from '../../services/trainingHistoryService';
import { useTraining } from '../../contexts/TrainingContext';

type TrainingSuccessRouteProp = RouteProp<{
  TrainingSuccess: { 
    trainingNumber: number;
    routine: any;
    exerciseSets: {[key: string]: any[]};
    elapsedTime: number;
    completedSets: number;
    description?: string;
  };
}, 'TrainingSuccess'>;

const TrainingSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TrainingSuccessRouteProp>();
  const { trainingNumber, routine, exerciseSets, elapsedTime, completedSets, description } = route.params;
  const { uid, user } = useSelector((state: RootState) => state.auth);
  const { hideTabBar, showTabBar } = useTraining();

  const motivationalPhrases = [
    "¡Cada entrenamiento te acerca más a tus metas! 💪",
    "La consistencia es la clave del éxito. ¡Sigue así! 🔥",
    "Tu futuro yo te agradecerá por este esfuerzo. ¡Excelente trabajo! ⭐",
    "Cada gota de sudor es una inversión en tu mejor versión. ¡Increíble! 🏆",
    "La disciplina de hoy es la libertad de mañana. ¡Fantástico entrenamiento! 🎯",
    "No hay atajos para el éxito. ¡Estás en el camino correcto! 🚀",
    "Tu determinación inspira a otros. ¡Sigue brillando! ✨",
    "Cada repetición cuenta. ¡Has hecho un gran trabajo! 💯",
    "El progreso no es lineal, pero cada entrenamiento suma. ¡Persevera! 🌟",
    "Tu cuerpo puede hacerlo. Tu mente debe creerlo. ¡Lo lograste! 🎉"
  ];

  const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];

  // Mantener la barra de navegación oculta hasta que el usuario termine
  useEffect(() => {
    hideTabBar();
  }, [hideTabBar]);

  const handleSaveTraining = async () => {
    try {
      if (!uid || !user) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        return;
      }

      console.log('🔄 Iniciando guardado de entrenamiento...');

      // Verificar estado de la base de datos
      const dbStatus = await trainingHistoryService.checkDatabaseStatus();
      if (!dbStatus) {
        console.log('⚠️ Base de datos no disponible, intentando reinicializar...');
        await trainingHistoryService.reinitialize();
      }

      let totalVolume = 0;
      Object.values(exerciseSets).forEach(sets => {
        sets.forEach(set => {
          if (set.weight && set.reps && set.completed) {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            if (!isNaN(weight) && !isNaN(reps)) {
              totalVolume += weight * reps;
            }
          }
        });
      });

      const trainingSession: TrainingSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: uid,
        routineName: routine.name,
        userName: user.name || user.email || 'Usuario',
        date: new Date().toISOString(),
        duration: Math.floor(elapsedTime / 60),
        volume: Math.round(totalVolume),
        description: description || '',
        createdAt: new Date().toISOString(),
        exercises: routine.exercises.map((exercise: any) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          sets: exerciseSets[exercise.exerciseId] || [],
        })),
      };

      console.log('📊 Datos del entrenamiento preparados:', {
        id: trainingSession.id,
        routineName: trainingSession.routineName,
        exercises: trainingSession.exercises.length,
        totalSets: trainingSession.exercises.reduce((total, ex) => total + ex.sets.length, 0)
      });

      // Intentar guardar en la base de datos local
      await trainingHistoryService.saveTrainingSession(trainingSession);

      // Mostrar la barra de navegación después de guardar exitosamente
      showTabBar();

      Alert.alert(
        '✅ Entrenamiento Guardado',
        'Tu entrenamiento ha sido guardado exitosamente en tu historial local.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('InicioTab' as never)
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error saving training session:', error);

      // Intentar reinicializar la base de datos si hay error
      try {
        console.log('🔄 Intentando reinicializar base de datos...');
        await trainingHistoryService.reinitialize();

        Alert.alert(
          'Error de Base de Datos',
          'Se detectó un problema con la base de datos. Se ha reinicializado automáticamente. Intenta guardar nuevamente.',
          [
            {
              text: 'Reintentar',
              onPress: () => handleSaveTraining()
            },
            {
              text: 'Cancelar',
              onPress: () => {
                showTabBar();
                navigation.navigate('InicioTab' as never);
              }
            }
          ]
        );
      } catch (reinitError) {
        console.error('❌ Error reinicializando base de datos:', reinitError);
        
        // Como último recurso, intentar resetear completamente la base de datos
        try {
          console.log('🔄 Intentando resetear completamente la base de datos...');
          await trainingHistoryService.resetDatabase();
          
          Alert.alert(
            'Base de Datos Reseteada',
            'Se ha reseteado completamente la base de datos. Intenta guardar nuevamente.',
            [
              {
                text: 'Reintentar',
                onPress: () => handleSaveTraining()
              },
              {
                text: 'Cancelar',
                onPress: () => {
                  showTabBar();
                  navigation.navigate('InicioTab' as never);
                }
              }
            ]
          );
        } catch (resetError) {
          console.error('❌ Error reseteando base de datos:', resetError);
          Alert.alert(
            'Error Crítico',
            'No se pudo guardar el entrenamiento. Inténtalo de nuevo más tarde o reinicia la aplicación.',
            [
              {
                text: 'OK',
                onPress: () => {
                  showTabBar();
                  navigation.navigate('InicioTab' as never);
                }
              }
            ]
          );
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#ffffff" />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.successTitle}>¡Bien Hecho!</Text>
          <Text style={styles.trainingNumber}>
            Este es tu entrenamiento número {trainingNumber}
          </Text>
        </View>

        {/* Motivational Phrase */}
        <View style={styles.motivationalContainer}>
          <Text style={styles.motivationalText}>{randomPhrase}</Text>
        </View>

        {/* Save Training Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveTrainingButton}
            onPress={handleSaveTraining}
          >
            <Text style={styles.saveTrainingButtonText}>Guardar Entrenamiento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  trainingNumber: {
    fontSize: 20,
    color: '#E31C1F',
    fontWeight: '600',
    textAlign: 'center',
  },
  motivationalContainer: {
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  motivationalText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
  },
  saveTrainingButton: {
    backgroundColor: '#E31C1F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#E31C1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveTrainingButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default TrainingSuccessScreen; 