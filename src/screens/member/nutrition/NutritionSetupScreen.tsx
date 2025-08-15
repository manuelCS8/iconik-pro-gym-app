import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Keyboard
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';
import {
  setUserConfig,
  setGoals,
  setMacros,
  setSetupComplete,
  setLoading
} from '../../../redux/slices/nutritionSlice';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from '../../../utils/theme';
import nutritionService from '../../../services/nutritionService';
import tempStorageService from '../../../services/tempStorageService';
import nutritionDataService from '../../../services/nutritionDataService';
import { UserMetrics, NutritionGoals } from '../../../redux/slices/nutritionSlice';

interface SetupForm {
  weight: string;
  height: string;
  age: string;
  gender: 'male' | 'female';
  activityLevel: string;
  objective: string;
  intensity: string;
  targetWeight?: string;
  targetDate?: string;
}

const NutritionSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const appColors = COLORS;
  const { uid } = useSelector((state: RootState) => state.auth);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SetupForm>({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    objective: 'maintain',
    intensity: 'moderate',
    targetWeight: '',
    targetDate: ''
  });

  const [calculatedMacros, setCalculatedMacros] = useState<any>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const steps = [
    { id: 1, title: 'Datos Personales', description: 'Información básica para el cálculo' },
    { id: 2, title: 'Objetivos', description: 'Define tu meta de nutrición' },
    { id: 3, title: 'Cálculo', description: 'Revisa tus macros calculados' },
    { id: 4, title: 'Confirmación', description: 'Confirma tu configuración' }
  ];

  const activityLevels = nutritionService.getActivityLevelOptions();
  const intensityOptions = nutritionService.getIntensityOptions(formData.objective);

  // Detectar cuando el teclado se muestra/oculta
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const updateFormData = (field: keyof SetupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      errors.push('Peso es requerido');
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      errors.push('Altura es requerida');
    }
    if (!formData.age || parseInt(formData.age) <= 0) {
      errors.push('Edad es requerida');
    }
    
    if (errors.length > 0) {
      Alert.alert('Error', errors.join('\n'));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (formData.objective !== 'maintain' && !formData.targetWeight) {
      Alert.alert('Error', 'Peso objetivo es requerido para bajar o subir peso');
      return false;
    }
    return true;
  };

  const calculateMacros = () => {
    try {
      const userMetrics: UserMetrics = {
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age),
        gender: formData.gender,
        activityLevel: formData.activityLevel as any
      };

      const goals: NutritionGoals = {
        objective: formData.objective as any,
        intensity: formData.intensity as any,
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
        targetDate: formData.targetDate
      };

      const baseCalories = nutritionService.calculateBaseCalories(userMetrics);
      const targetCalories = nutritionService.calculateTargetCalories(baseCalories, goals);
      const macros = nutritionService.calculateMacros(targetCalories);

      setCalculatedMacros({
        baseCalories,
        targetCalories,
        macros,
        userMetrics,
        goals
      });

      return true;
    } catch (error) {
      Alert.alert('Error', 'Error al calcular macros');
      return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !calculateMacros()) return;
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    if (!uid || !calculatedMacros) return;

    dispatch(setLoading(true));
    try {
      // Guardar en Redux
      dispatch(setUserConfig(calculatedMacros.userMetrics));
      dispatch(setGoals(calculatedMacros.goals));
      dispatch(setMacros(calculatedMacros.macros));
      dispatch(setSetupComplete(true));

      // Guardar en almacenamiento temporal
      await tempStorageService.saveNutritionConfig({
        userId: uid,
        weight: calculatedMacros.userMetrics.weight,
        height: calculatedMacros.userMetrics.height,
        age: calculatedMacros.userMetrics.age,
        gender: calculatedMacros.userMetrics.gender,
        activityLevel: calculatedMacros.userMetrics.activityLevel,
        objective: calculatedMacros.goals.objective,
        intensity: calculatedMacros.goals.intensity,
        targetWeight: calculatedMacros.goals.targetWeight,
        targetDate: calculatedMacros.goals.targetDate,
        calories: calculatedMacros.macros.calories,
        protein: calculatedMacros.macros.protein,
        carbs: calculatedMacros.macros.carbs,
        fats: calculatedMacros.macros.fats,
        tier: 'basic'
      });

      // Guardar en servicio local de datos nutricionales
      await nutritionDataService.saveNutritionData({
        userId: uid,
        weight: calculatedMacros.userMetrics.weight,
        height: calculatedMacros.userMetrics.height,
        age: calculatedMacros.userMetrics.age,
        gender: calculatedMacros.userMetrics.gender,
        activityLevel: calculatedMacros.userMetrics.activityLevel,
        objective: calculatedMacros.goals.objective,
        intensity: calculatedMacros.goals.intensity,
        targetWeight: calculatedMacros.goals.targetWeight,
        targetDate: calculatedMacros.goals.targetDate,
        calories: calculatedMacros.macros.calories,
        protein: calculatedMacros.macros.protein,
        carbs: calculatedMacros.macros.carbs,
        fats: calculatedMacros.macros.fats,
        tier: 'basic'
      });

      Alert.alert(
        '¡Configuración Completada!',
        'Tu plan nutricional está listo. Puedes empezar a registrar tus comidas.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving nutrition config:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Datos Personales
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Necesitamos esta información para calcular tus necesidades calóricas
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Peso (kg)</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          value={formData.weight}
          onChangeText={(value) => updateFormData('weight', value)}
          placeholder="Ej: 70"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Altura (cm)</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          value={formData.height}
          onChangeText={(value) => updateFormData('height', value)}
          placeholder="Ej: 175"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Edad</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          value={formData.age}
          onChangeText={(value) => updateFormData('age', value)}
          placeholder="Ej: 25"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Género</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.gender === 'male' && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('gender', 'male')}
          >
            <Text style={[
              styles.radioText,
              { color: formData.gender === 'male' ? 'white' : colors.text }
            ]}>
              Hombre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.gender === 'female' && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('gender', 'female')}
          >
            <Text style={[
              styles.radioText,
              { color: formData.gender === 'female' ? 'white' : colors.text }
            ]}>
              Mujer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Nivel de Actividad</Text>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.optionButton,
              formData.activityLevel === level.value && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('activityLevel', level.value)}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                { color: formData.activityLevel === level.value ? 'white' : colors.text }
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                { color: formData.activityLevel === level.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
              ]}>
                {level.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

             {/* Next Button for Step 1 */}
       <TouchableOpacity
         style={[styles.navButton, styles.nextButton, { 
           backgroundColor: colors.primary, 
           marginTop: 20,
           marginBottom: 100, // Espacio para la barra de navegación
           paddingVertical: 24, // Doble altura
           minHeight: 80 // Altura mínima más grande
         }]}
         onPress={handleNext}
       >
         <Text style={[styles.nextButtonText, { fontSize: 20 }]}>
           Siguiente
         </Text>
         <Ionicons name="arrow-forward" size={24} color="white" />
       </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Objetivos
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Define tu meta de nutrición y la intensidad
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Objetivo</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.objective === 'lose' && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('objective', 'lose')}
          >
            <Text style={[
              styles.radioText,
              { color: formData.objective === 'lose' ? 'white' : colors.text }
            ]}>
              Bajar Peso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.objective === 'maintain' && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('objective', 'maintain')}
          >
            <Text style={[
              styles.radioText,
              { color: formData.objective === 'maintain' ? 'white' : colors.text }
            ]}>
              Mantener
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.objective === 'gain' && { backgroundColor: colors.primary }
            ]}
            onPress={() => updateFormData('objective', 'gain')}
          >
            <Text style={[
              styles.radioText,
              { color: formData.objective === 'gain' ? 'white' : colors.text }
            ]}>
              Subir Peso
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {formData.objective !== 'maintain' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Peso Objetivo (kg)
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={formData.targetWeight}
            onChangeText={(value) => updateFormData('targetWeight', value)}
            placeholder="Ej: 65"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      )}

             {formData.objective === 'maintain' ? (
         <View style={styles.inputGroup}>
           <Text style={[styles.inputLabel, { color: colors.text }]}>Mantener Peso</Text>
           <TouchableOpacity
             style={[
               styles.optionButton,
               { backgroundColor: colors.primary }
             ]}
             onPress={() => updateFormData('intensity', 'maintain')}
           >
             <View style={styles.optionContent}>
               <Text style={[
                 styles.optionTitle,
                 { color: 'white' }
               ]}>
                 Mantener mi peso
               </Text>
               <Text style={[
                 styles.optionDescription,
                 { color: 'rgba(255,255,255,0.8)' }
               ]}>
                 Sin agregar calorías adicionales
               </Text>
             </View>
           </TouchableOpacity>
         </View>
       ) : (
         <View style={styles.inputGroup}>
           <Text style={[styles.inputLabel, { color: colors.text }]}>Intensidad</Text>
           {intensityOptions.map((intensity) => (
             <TouchableOpacity
               key={intensity.value}
               style={[
                 styles.optionButton,
                 formData.intensity === intensity.value && { backgroundColor: colors.primary }
               ]}
               onPress={() => updateFormData('intensity', intensity.value)}
             >
               <View style={styles.optionContent}>
                 <Text style={[
                   styles.optionTitle,
                   { color: formData.intensity === intensity.value ? 'white' : colors.text }
                 ]}>
                   {intensity.label}
                 </Text>
                 <Text style={[
                   styles.optionDescription,
                   { color: formData.intensity === intensity.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                 ]}>
                   {intensity.description}
                 </Text>
               </View>
             </TouchableOpacity>
           ))}
         </View>
       )}

       {/* Navigation Buttons for Step 2 */}
       <View style={styles.step2NavigationContainer}>
         <TouchableOpacity
           style={[styles.navButton, styles.backButton, { 
             borderColor: colors.border,
             backgroundColor: colors.card 
           }]}
           onPress={handleBack}
         >
           <Ionicons name="arrow-back" size={20} color={colors.text} />
           <Text style={[styles.navButtonText, { color: colors.text }]}>Atrás</Text>
         </TouchableOpacity>
         
         <TouchableOpacity
           style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
           onPress={handleNext}
         >
           <Text style={styles.nextButtonText}>
             Siguiente
           </Text>
           <Ionicons name="arrow-forward" size={20} color="white" />
         </TouchableOpacity>
       </View>
     </View>
   );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Cálculo de Macros
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Revisa tus macros calculados automáticamente
      </Text>

      {calculatedMacros && (
        <View style={[styles.macrosCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.macrosTitle, { color: colors.text }]}>
            Tu Plan Diario
          </Text>
          
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.text }]}>Calorías</Text>
            <Text style={[styles.macroValue, { color: colors.primary }]}>
              {calculatedMacros.macros.calories} kcal
            </Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.text }]}>Proteína</Text>
            <Text style={[styles.macroValue, { color: colors.primary }]}>
              {calculatedMacros.macros.protein}g
            </Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.text }]}>Carbohidratos</Text>
            <Text style={[styles.macroValue, { color: colors.primary }]}>
              {calculatedMacros.macros.carbs}g
            </Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={[styles.macroLabel, { color: colors.text }]}>Grasas</Text>
            <Text style={[styles.macroValue, { color: colors.primary }]}>
              {calculatedMacros.macros.fats}g
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Confirmación
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Confirma tu configuración para empezar
      </Text>

      <View style={[styles.confirmationCard, { backgroundColor: colors.card }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        <Text style={[styles.confirmationTitle, { color: colors.text }]}>
          ¡Configuración Lista!
        </Text>
        <Text style={[styles.confirmationText, { color: colors.textSecondary }]}>
          Tu plan nutricional personalizado está listo. Podrás:
        </Text>
        <View style={styles.featuresList}>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
            • Analizar comidas con IA
          </Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
            • Registrar tu progreso diario
          </Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
            • Ver estadísticas detalladas
          </Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
            • Ajustar macros según necesites
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${(step / steps.length) * 100}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Paso {step} de {steps.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

             {/* Navigation Buttons - Only for steps 3-4 */}
       {step > 2 && !isKeyboardVisible && (
         <View style={[styles.navigationContainer, { backgroundColor: colors.background }]}>
           <TouchableOpacity
             style={[styles.navButton, styles.backButton, { 
               borderColor: colors.border,
               backgroundColor: colors.card 
             }]}
             onPress={handleBack}
           >
             <Ionicons name="arrow-back" size={20} color={colors.text} />
             <Text style={[styles.navButtonText, { color: colors.text }]}>Atrás</Text>
           </TouchableOpacity>
           
           <TouchableOpacity
             style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
             onPress={handleNext}
           >
             <Text style={styles.nextButtonText}>
               {step === steps.length ? 'Finalizar' : 'Siguiente'}
             </Text>
             <Ionicons name="arrow-forward" size={20} color="white" />
           </TouchableOpacity>
         </View>
       )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 20, // Más espacio en la parte inferior del scroll
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 16, // Más padding
    borderRadius: 12, // Bordes más redondeados
    borderWidth: 2, // Borde más grueso
    borderColor: '#333', // Color más oscuro para el tema oscuro
    alignItems: 'center',
    minHeight: 50, // Altura mínima para mejor touch target
  },
  radioText: {
    fontSize: 16, // Texto más grande
    fontWeight: '600', // Más bold
  },
  optionButton: {
    padding: 18, // Más padding
    borderRadius: 12, // Bordes más redondeados
    borderWidth: 2, // Borde más grueso
    borderColor: '#333', // Color más oscuro para el tema oscuro
    marginBottom: 12, // Más espacio entre opciones
    minHeight: 60, // Altura mínima para mejor touch target
  },
  optionContent: {
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
  },
  macrosCard: {
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  macrosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  macroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333', // Color más oscuro para el tema oscuro
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmationCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    fontSize: 14,
    marginBottom: 8,
  },
     step2NavigationContainer: {
     flexDirection: 'row',
     paddingHorizontal: 16,
     paddingVertical: 20,
     paddingBottom: 100, // Más espacio para la barra de navegación
     gap: 12,
     marginTop: 20,
   },
   navigationContainer: {
     flexDirection: 'row',
     paddingHorizontal: 16,
     paddingVertical: 20,
     paddingBottom: 30, // Más espacio arriba de la barra de navegación
     gap: 12,
     borderTopWidth: 1,
     borderTopColor: '#333', // Color más oscuro para el tema oscuro
     elevation: 8, // Sombra en Android
     shadowColor: '#000', // Sombra en iOS
     shadowOffset: { width: 0, height: -2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18, // Botones más altos
    paddingHorizontal: 20,
    borderRadius: 12, // Bordes más redondeados
    gap: 10,
    minHeight: 56, // Altura mínima para mejor touch target
  },
  backButton: {
    borderWidth: 2, // Borde más grueso
  },
  nextButton: {
    flex: 2,
  },
  navButtonText: {
    fontSize: 18, // Texto más grande
    fontWeight: '700', // Más bold
  },
  nextButtonText: {
    fontSize: 18, // Texto más grande
    fontWeight: '700', // Más bold
    color: 'white',
  },
});

export default NutritionSetupScreen; 