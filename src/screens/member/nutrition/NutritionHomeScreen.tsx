import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '../../../navigation/NutritionStackNavigator';
import { RootState } from '../../../redux/store';
import {
  setNutritionData,
  setLoading,
  setError,
  incrementDailyUsage
} from '../../../redux/slices/nutritionSlice';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS } from '../../../utils/theme';
import nutritionService from '../../../services/nutritionService';
import tempStorageService from '../../../services/tempStorageService';
import { MacroBreakdown, DailyNutritionStats } from '../../../redux/slices/nutritionSlice';
import MacroProgressCircle from '../../../components/nutrition/MacroProgressCircle';
import UsageLimitIndicator from '../../../components/nutrition/UsageLimitIndicator';
import NutritionSetupScreen from './NutritionSetupScreen';

type NutritionNavigationProp = NativeStackNavigationProp<NutritionStackParamList>;

const NutritionHomeScreen: React.FC = () => {
  const navigation = useNavigation<NutritionNavigationProp>();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const appColors = COLORS;
  const { uid } = useSelector((state: RootState) => state.auth);
  const { 
    macros, 
    usageLimits, 
    isSetupComplete, 
    mealLogs,
    loading,
    userConfig,
    goals
  } = useSelector((state: RootState) => state.nutrition);
  
  const [dailyStats, setDailyStats] = useState<DailyNutritionStats>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    mealCount: 0
  });

  useEffect(() => {
    loadNutritionData();
  }, []);

  useEffect(() => {
    if (isSetupComplete) {
      calculateDailyStats();
    }
  }, [mealLogs, isSetupComplete]);

  const loadNutritionData = async () => {
    if (!uid) return;

    dispatch(setLoading(true));
    try {
      // Cargar configuración nutricional desde almacenamiento temporal
      const config = await tempStorageService.getNutritionConfig(uid);
      
      if (config) {
        dispatch(setNutritionData({
          userConfig: {
            weight: config.weight,
            height: config.height,
            age: config.age,
            gender: config.gender as 'male' | 'female',
            activityLevel: config.activityLevel as any
          },
          goals: {
            objective: config.objective as any,
            intensity: config.intensity as any,
            targetWeight: config.targetWeight,
            targetDate: config.targetDate
          },
          macros: {
            calories: config.calories,
            protein: config.protein,
            carbs: config.carbs,
            fats: config.fats
          },
          usageLimits: {
            dailyLimit: config.tier === 'basic' ? 5 : config.tier === 'premium' ? 8 : 12,
            dailyUsage: await tempStorageService.getDailyUsage(uid, new Date().toDateString()),
            monthlyUsage: 0, // TODO: Implementar
            lastResetDate: new Date().toDateString(),
            tier: config.tier as any
          },
          isSetupComplete: true
        }));
      } else {
        // Si no hay configuración, redirigir a setup
        dispatch(setNutritionData({ isSetupComplete: false }));
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      dispatch(setError('Error al cargar datos de nutrición'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const calculateDailyStats = async () => {
    if (!uid) return;

    try {
      const today = new Date().toDateString();
      const todayLogs = mealLogs.filter(log => log.date === today);
      
      const stats: DailyNutritionStats = {
        totalCalories: todayLogs.reduce((sum, log) => sum + log.calories, 0),
        totalProtein: todayLogs.reduce((sum, log) => sum + log.protein, 0),
        totalCarbs: todayLogs.reduce((sum, log) => sum + log.carbs, 0),
        totalFats: todayLogs.reduce((sum, log) => sum + log.fats, 0),
        mealCount: todayLogs.length
      };
      
      setDailyStats(stats);
    } catch (error) {
      console.error('Error calculating daily stats:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!uid) return;

    // LÍMITE REMOVIDO PARA PRUEBAS
    // if (usageLimits.dailyUsage >= usageLimits.dailyLimit) {
    //   Alert.alert(
    //     'Límite Alcanzado',
    //     `Has alcanzado tu límite diario de ${usageLimits.dailyLimit} análisis. Intenta mañana.`,
    //     [{ text: 'OK' }]
    //   );
    //   return;
    // }

    // Incrementar contador de uso (mantenido para estadísticas)
    dispatch(incrementDailyUsage());
    await tempStorageService.incrementDailyUsage(uid, new Date().toDateString());

    // Navegar a pantalla de agregar comida
    navigation.navigate('AddMeal');
  };

  const handleViewHistory = () => {
    navigation.navigate('NutritionHistory');
  };

  const handleSettings = () => {
    Alert.alert(
      'Configuración de Nutrición',
      '¿Qué te gustaría hacer?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Volver a Calcular',
          onPress: () => {
            Alert.alert(
              'Recalcular Calorías',
              '¿Estás seguro de que quieres volver a calcular tus calorías? Esto sobrescribirá tu configuración actual.',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Sí, Recalcular',
                  style: 'destructive',
                  onPress: () => {
                    // Limpiar configuración actual y redirigir a setup
                    dispatch(setNutritionData({ isSetupComplete: false }));
                    navigation.navigate('NutritionSetup');
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Configuración',
          onPress: () => navigation.navigate('NutritionSettings')
        }
      ]
    );
  };

  // Si no está configurado, mostrar pantalla de setup
  if (!isSetupComplete) {
    console.log('🔧 Usuario no configurado, redirigiendo a setup...');
    return <NutritionSetupScreen />;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando nutrición...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: appColors.secondary }]}>Nutrición</Text>
          <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={appColors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Indicador de límites de uso */}
        <UsageLimitIndicator />

        {/* Objetivos del usuario */}
        {macros && userConfig && goals && (
          <View style={[styles.objectivesCard, { backgroundColor: appColors.white }]}>
            <Text style={[styles.objectivesTitle, { color: appColors.secondary }]}>
              🎯 Tus Objetivos Diarios
            </Text>
            <Text style={[styles.objectivesSubtitle, { color: appColors.gray }]}>
              Basado en tus datos personales
            </Text>
            
            <View style={styles.objectivesGrid}>
              <View style={styles.objectiveItem}>
                <Text style={[styles.objectiveLabel, { color: appColors.gray }]}>Calorías</Text>
                <Text style={[styles.objectiveValue, { color: appColors.primary }]}>
                  {macros.calories} kcal
                </Text>
              </View>
              <View style={styles.objectiveItem}>
                <Text style={[styles.objectiveLabel, { color: appColors.gray }]}>Proteína</Text>
                <Text style={[styles.objectiveValue, { color: appColors.primary }]}>
                  {macros.protein}g
                </Text>
              </View>
              <View style={styles.objectiveItem}>
                <Text style={[styles.objectiveLabel, { color: appColors.gray }]}>Carbohidratos</Text>
                <Text style={[styles.objectiveValue, { color: appColors.primary }]}>
                  {macros.carbs}g
                </Text>
              </View>
              <View style={styles.objectiveItem}>
                <Text style={[styles.objectiveLabel, { color: appColors.gray }]}>Grasas</Text>
                <Text style={[styles.objectiveValue, { color: appColors.primary }]}>
                  {macros.fats}g
                </Text>
              </View>
            </View>
            
            {userConfig && goals && (
              <View style={styles.userInfo}>
                <Text style={[styles.userInfoText, { color: appColors.gray }]}>
                  📊 {userConfig.weight}kg • {userConfig.height}cm • {userConfig.age} años • {userConfig.gender === 'male' ? 'Hombre' : 'Mujer'}
                </Text>
                <Text style={[styles.userInfoText, { color: appColors.gray }]}>
                  🎯 Objetivo: {goals.objective === 'lose' ? 'Perder peso' : goals.objective === 'gain' ? 'Ganar peso' : 'Mantener peso'} • Intensidad: {goals.intensity}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Resumen diario */}
        <View style={[styles.summaryCard, { backgroundColor: appColors.white }]}>
          <Text style={[styles.summaryTitle, { color: appColors.secondary }]}>
            Resumen de Hoy
          </Text>
          <Text style={[styles.summarySubtitle, { color: appColors.gray }]}>
            {dailyStats.mealCount} comidas registradas
          </Text>
          
          <View style={styles.macrosContainer}>
            <MacroProgressCircle
              type="calories"
              current={dailyStats.totalCalories}
              target={macros?.calories || 0}
              color="#FF6B6B"
            />
            <MacroProgressCircle
              type="protein"
              current={dailyStats.totalProtein}
              target={macros?.protein || 0}
              color="#4ECDC4"
            />
            <MacroProgressCircle
              type="carbs"
              current={dailyStats.totalCarbs}
              target={macros?.carbs || 0}
              color="#45B7D1"
            />
            <MacroProgressCircle
              type="fats"
              current={dailyStats.totalFats}
              target={macros?.fats || 0}
              color="#96CEB4"
            />
          </View>
        </View>

        {/* Botón para agregar comida */}
        <TouchableOpacity
          style={[styles.addMealButton, { backgroundColor: appColors.primary }]}
          onPress={handleAddMeal}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.addMealText}>Agregar Comida</Text>
        </TouchableOpacity>

        {/* Comidas de hoy */}
        <View style={[styles.todayMealsCard, { backgroundColor: appColors.white }]}>
          <View style={styles.todayMealsHeader}>
            <Text style={[styles.todayMealsTitle, { color: appColors.secondary }]}>
              Comidas de Hoy
            </Text>
            <TouchableOpacity onPress={handleViewHistory}>
              <Text style={[styles.viewAllText, { color: appColors.primary }]}>
                Ver Historial
              </Text>
            </TouchableOpacity>
          </View>
          
          {dailyStats.mealCount === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={appColors.gray} />
              <Text style={[styles.emptyStateText, { color: appColors.gray }]}>
                No hay comidas registradas hoy
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: appColors.gray }]}>
                Toca "Agregar Comida" para empezar
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {mealLogs
                .filter(log => log.date === new Date().toDateString())
                .slice(0, 3)
                .map((meal, index) => (
                  <View key={index} style={styles.mealItem}>
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealType, { color: appColors.secondary }]}>
                        {meal.mealType}
                      </Text>
                      <Text style={[styles.mealCalories, { color: appColors.gray }]}>
                        {meal.calories} kcal
                      </Text>
                    </View>
                    <View style={styles.mealMacros}>
                      <Text style={[styles.macroText, { color: appColors.gray }]}>
                        P: {meal.protein}g
                      </Text>
                      <Text style={[styles.macroText, { color: appColors.gray }]}>
                        C: {meal.carbs}g
                      </Text>
                      <Text style={[styles.macroText, { color: appColors.gray }]}>
                        G: {meal.fats}g
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Espacio para la barra de navegación */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMealText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  todayMealsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  todayMealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayMealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  mealsList: {
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  mealCalories: {
    fontSize: 14,
    marginTop: 2,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  objectivesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  objectivesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  objectivesSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  objectivesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  objectiveItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  objectiveLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  objectiveValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  userInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default NutritionHomeScreen; 