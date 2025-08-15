import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./src/redux/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import { TrainingProvider } from "./src/contexts/TrainingContext";
import { StatusBar } from "expo-status-bar";
import trainingHistoryService from "./src/services/trainingHistoryService";
import nutritionDataService from './src/services/nutritionDataService';

export default function App() {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 Inicializando servicios...');
        await trainingHistoryService.initialize();
        await nutritionDataService.initialize();
        console.log('✅ Servicios inicializados correctamente');
      } catch (error) {
        console.error('❌ Error inicializando servicios:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <TrainingProvider>
            <StatusBar 
              style="light" 
              backgroundColor="transparent" 
              translucent={true}
            />
            <AppNavigator />
          </TrainingProvider>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
} 