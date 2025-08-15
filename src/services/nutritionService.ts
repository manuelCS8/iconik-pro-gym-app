import { UserMetrics, NutritionGoals, MacroBreakdown } from '../redux/slices/nutritionSlice';

class NutritionService {
  /**
   * Calcula las calorías base usando la fórmula Mifflin-St Jeor (usada por IMSS)
   */
  calculateBaseCalories(metrics: UserMetrics): number {
    let bmr = 0;
    
    if (metrics.gender === 'male') {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age + 5;
    } else {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age - 161;
    }
    
    // Multiplicadores de actividad según nivel
    const activityMultipliers = {
      sedentary: 1.2,      // Poco o ningún ejercicio
      light: 1.375,        // Ejercicio ligero 1-3 días/semana
      moderate: 1.55,      // Ejercicio moderado 3-5 días/semana
      active: 1.725,       // Ejercicio intenso 6-7 días/semana
      very_active: 1.9     // Ejercicio muy intenso, trabajo físico
    };
    
    const baseCalories = bmr * activityMultipliers[metrics.activityLevel];
    return Math.round(baseCalories);
  }
  
  /**
   * Ajusta las calorías según el objetivo e intensidad
   */
  calculateTargetCalories(baseCalories: number, goals: NutritionGoals): number {
    const intensityMultipliers = {
      light: 0.08,         // 8% de las calorías base
      moderate: 0.12,      // 12% de las calorías base
      intense: 0.16,       // 16% de las calorías base
      very_intense: 0.20,  // 20% de las calorías base
      extreme: 0.24        // 24% de las calorías base
    };
    
    const adjustment = baseCalories * intensityMultipliers[goals.intensity];
    
    switch (goals.objective) {
      case 'lose':
        return Math.round(baseCalories - adjustment);
      case 'gain':
        return Math.round(baseCalories + adjustment);
      case 'maintain':
      default:
        return baseCalories;
    }
  }
  
  /**
   * Calcula los macros según las reglas de conversión:
   * 1g carbohidrato = 4 kcal
   * 1g proteína = 4 kcal
   * 1g grasa = 9 kcal
   */
  calculateMacros(calories: number): MacroBreakdown {
    // Distribución estándar recomendada:
    // 30% proteína, 40% carbohidratos, 30% grasas
    
    const proteinCalories = calories * 0.3;
    const carbsCalories = calories * 0.4;
    const fatsCalories = calories * 0.3;
    
    const protein = Math.round(proteinCalories / 4); // 4 kcal/g
    const carbs = Math.round(carbsCalories / 4);     // 4 kcal/g
    const fats = Math.round(fatsCalories / 9);       // 9 kcal/g
    
    return {
      calories,
      protein,
      carbs,
      fats
    };
  }
  
  /**
   * Calcula macros personalizados con distribución específica
   */
  calculateCustomMacros(calories: number, proteinRatio: number, carbsRatio: number, fatsRatio: number): MacroBreakdown {
    const proteinCalories = calories * proteinRatio;
    const carbsCalories = calories * carbsRatio;
    const fatsCalories = calories * fatsRatio;
    
    const protein = Math.round(proteinCalories / 4);
    const carbs = Math.round(carbsCalories / 4);
    const fats = Math.round(fatsCalories / 9);
    
    return {
      calories,
      protein,
      carbs,
      fats
    };
  }
  
  /**
   * Calcula el tiempo estimado para alcanzar el peso objetivo
   */
  calculateTimeToGoal(currentWeight: number, targetWeight: number, calories: number, baseCalories: number): number {
    const weightDifference = Math.abs(targetWeight - currentWeight);
    const caloriesDifference = Math.abs(calories - baseCalories);
    
    if (caloriesDifference === 0) return 0;
    
    // Aproximadamente 7700 kcal = 1 kg de grasa
    const daysToGoal = (weightDifference * 7700) / caloriesDifference;
    return Math.round(daysToGoal);
  }
  
  /**
   * Valida los datos de entrada
   */
  validateMetrics(metrics: UserMetrics): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (metrics.weight <= 0 || metrics.weight > 500) {
      errors.push('El peso debe estar entre 1 y 500 kg');
    }
    
    if (metrics.height <= 0 || metrics.height > 300) {
      errors.push('La altura debe estar entre 1 y 300 cm');
    }
    
    if (metrics.age <= 0 || metrics.age > 120) {
      errors.push('La edad debe estar entre 1 y 120 años');
    }
    
    if (!['male', 'female'].includes(metrics.gender)) {
      errors.push('El género debe ser male o female');
    }
    
    if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(metrics.activityLevel)) {
      errors.push('Nivel de actividad inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Obtiene las opciones de intensidad según el objetivo
   */
  getIntensityOptions(objective: string): { value: string; label: string; description: string }[] {
    const options = [
      { value: 'light', label: 'Ligero', description: '8% de las calorías base' },
      { value: 'moderate', label: 'Moderado', description: '12% de las calorías base' },
      { value: 'intense', label: 'Intenso', description: '16% de las calorías base' },
      { value: 'very_intense', label: 'Muy Intenso', description: '20% de las calorías base' },
      { value: 'extreme', label: 'Extremo', description: '24% de las calorías base' }
    ];
    
    return options;
  }
  
  /**
   * Obtiene las opciones de nivel de actividad
   */
  getActivityLevelOptions(): { value: string; label: string; description: string }[] {
    return [
      { 
        value: 'sedentary', 
        label: 'Sedentario', 
        description: 'Poco o ningún ejercicio, trabajo de oficina' 
      },
      { 
        value: 'light', 
        label: 'Ligero', 
        description: 'Ejercicio ligero 1-3 días por semana' 
      },
      { 
        value: 'moderate', 
        label: 'Moderado', 
        description: 'Ejercicio moderado 3-5 días por semana' 
      },
      { 
        value: 'active', 
        label: 'Activo', 
        description: 'Ejercicio intenso 6-7 días por semana' 
      },
      { 
        value: 'very_active', 
        label: 'Muy Activo', 
        description: 'Ejercicio muy intenso, trabajo físico' 
      }
    ];
  }
}

export default new NutritionService(); 