import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SIZES } from '../utils/theme';

interface ThemeToggleProps {
  showText?: boolean;
  size?: 'small' | 'large';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showText = true, 
  size = 'large' 
}) => {
  const { theme, colors, toggleTheme, isLoading } = useTheme();
  
  // Si está cargando, no renderizar nada o mostrar algo simple
  if (isLoading) {
    return null;
  }
  
  const iconSize = size === 'small' ? 20 : 24;
  const textSize = size === 'small' ? SIZES.fontSmall : SIZES.fontRegular;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.cardBackground }]} 
      onPress={toggleTheme}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={theme === 'light' ? 'sunny' : 'moon'} 
          size={iconSize} 
          color={colors.text} 
        />
      </View>
      
      {showText && (
        <Text style={[styles.text, { color: colors.text, fontSize: textSize }]}>
          {theme === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
        </Text>
      )}
      
      <View style={styles.switchContainer}>
        <View style={[
          styles.switch, 
          { 
            backgroundColor: theme === 'light' ? colors.grayLight : colors.primary,
            borderColor: colors.border 
          }
        ]}>
          <View style={[
            styles.switchThumb,
            {
              backgroundColor: colors.white,
              transform: [{ translateX: theme === 'light' ? 2 : 20 }]
            }
          ]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: SIZES.paddingSmall,
  },
  text: {
    flex: 1,
    fontWeight: '500',
  },
  switchContainer: {
    marginLeft: SIZES.paddingSmall,
  },
  switch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ThemeToggle; 