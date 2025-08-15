import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  white: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  gray: string;
  grayDark: string;
  grayLight: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  border: string;
  shadow: string;
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  isLoading: boolean;
}

const lightColors: ThemeColors = {
  primary: "#E31C1F",
  secondary: "#1F1F1F",
  white: "#FFFFFF",
  background: "#F5F5F5",
  cardBackground: "#FFFFFF",
  text: "#1F1F1F",
  textSecondary: "#666666",
  gray: "#666666",
  grayDark: "#333333",
  grayLight: "#CCCCCC",
  success: "#28A745",
  warning: "#FFC107",
  danger: "#C82333",
  info: "#6C757D",
  border: "#E0E0E0",
  shadow: "#000000",
};

const darkColors: ThemeColors = {
  primary: "#E31C1F",
  secondary: "#FFFFFF",
  white: "#1F1F1F",
  background: "#121212",
  cardBackground: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  gray: "#888888",
  grayDark: "#CCCCCC",
  grayLight: "#444444",
  success: "#4CAF50",
  warning: "#FF9800",
  danger: "#F44336",
  info: "#2196F3",
  border: "#333333",
  shadow: "#000000",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  // Mostrar loading screen mientras se carga el tema
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.text}>Iniciando...</Text>
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // En lugar de lanzar error, devolver tema por defecto
    console.warn('useTheme used outside ThemeProvider, using default light theme');
    return {
      theme: 'light',
      colors: lightColors,
      toggleTheme: () => {},
      isLoading: false,
    };
  }
  return context;
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E31C1F',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 