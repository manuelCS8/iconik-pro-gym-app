import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TrainingContextType {
  isTrainingInProgress: boolean;
  setTrainingInProgress: (inProgress: boolean) => void;
  showTrainingModal: () => void;
  hideTrainingModal: () => void;
  isModalVisible: boolean;
  currentTrainingScreen: string | null;
  setCurrentTrainingScreen: (screen: string | null) => void;
  clearTrainingProgress: () => void;
  isTabBarVisible: boolean;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};

interface TrainingProviderProps {
  children: ReactNode;
}

export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [isTrainingInProgress, setIsTrainingInProgress] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTrainingScreen, setCurrentTrainingScreen] = useState<string | null>(null);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const setTrainingInProgress = (inProgress: boolean) => {
    setIsTrainingInProgress(inProgress);
    // NO mostrar el modal automáticamente cuando se marca como en progreso
  };

  const showTrainingModal = () => {
    // Solo mostrar el modal si hay entrenamiento en progreso
    if (isTrainingInProgress) {
      setIsModalVisible(true);
    }
  };

  const hideTrainingModal = () => {
    setIsModalVisible(false);
  };

  const hideTabBar = () => {
    setIsTabBarVisible(false);
  };

  const showTabBar = () => {
    setIsTabBarVisible(true);
  };

  // Función para limpiar completamente el entrenamiento
  const clearTrainingProgress = () => {
    setIsTrainingInProgress(false);
    setIsModalVisible(false);
    setCurrentTrainingScreen(null);
  };

  return (
    <TrainingContext.Provider value={{
      isTrainingInProgress,
      setTrainingInProgress,
      showTrainingModal,
      hideTrainingModal,
      isModalVisible,
      currentTrainingScreen,
      setCurrentTrainingScreen,
      clearTrainingProgress,
      isTabBarVisible,
      hideTabBar,
      showTabBar,
    }}>
      {children}
    </TrainingContext.Provider>
  );
}; 