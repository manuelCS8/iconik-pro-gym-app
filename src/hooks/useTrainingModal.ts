import { useTraining } from '../contexts/TrainingContext';
import { useNavigation } from '@react-navigation/native';

export const useTrainingModal = () => {
  const { isTrainingInProgress, showTrainingModal } = useTraining();
  const navigation = useNavigation();

  const handleTrainingPress = () => {
    if (isTrainingInProgress) {
      // Si hay entrenamiento en progreso, mostrar el modal
      showTrainingModal();
    } else {
      // Si no hay entrenamiento en progreso, navegar normalmente
      navigation.navigate('ExploreRoutines' as never);
    }
  };

  return {
    isTrainingInProgress,
    handleTrainingPress,
    showTrainingModal
  };
}; 