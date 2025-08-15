import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

interface MacroProgressCircleProps {
  type: 'calories' | 'protein' | 'carbs' | 'fats';
  current: number;
  target: number;
  color: string;
}

const MacroProgressCircle: React.FC<MacroProgressCircleProps> = ({
  type,
  current,
  target,
  color
}) => {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;

  const getTypeLabel = () => {
    switch (type) {
      case 'calories': return 'Calorías';
      case 'protein': return 'Proteína';
      case 'carbs': return 'Carbohidratos';
      case 'fats': return 'Grasas';
      default: return type;
    }
  };

  const getTypeUnit = () => {
    switch (type) {
      case 'calories': return '';
      case 'protein': return 'g';
      case 'carbs': return 'g';
      case 'fats': return 'g';
      default: return '';
    }
  };

  const formatValue = (value: number) => {
    if (type === 'calories') {
      return Math.round(value).toString();
    }
    return Math.round(value * 10) / 10;
  };

  return (
    <View style={styles.container}>
      {/* Círculo simple con View */}
      <View style={[styles.circle, { borderColor: color }]}>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>
            {formatValue(current)}
          </Text>
          <Text style={styles.unit}>
            {getTypeUnit()}
          </Text>
        </View>
      </View>
      
      {/* Etiqueta */}
      <Text style={styles.label}>
        {getTypeLabel()}
      </Text>
      
      {/* Progreso como porcentaje */}
      <Text style={styles.percentage}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 100,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.3)',
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  unit: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: -2,
  },
  label: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 8,
    color: COLORS.grayLight,
    marginTop: 2,
  },
});

export default MacroProgressCircle; 