import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Interfaces
interface UserMetrics {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface NutritionGoals {
  objective: 'lose' | 'maintain' | 'gain';
  intensity: 'light' | 'moderate' | 'intense' | 'very_intense' | 'extreme';
  targetWeight?: number;
  targetDate?: string;
}

interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface UsageLimits {
  dailyLimit: number;
  dailyUsage: number;
  monthlyUsage: number;
  lastResetDate: string;
  tier: 'basic' | 'premium' | 'vip';
}

interface MealLog {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  aiAnalysis?: string;
  timestamp: string;
}

interface DailyNutritionStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealCount: number;
}

interface NutritionState {
  // Configuración del usuario
  userConfig: UserMetrics | null;
  goals: NutritionGoals | null;
  
  // Macros calculados
  macros: MacroBreakdown | null;
  
  // Sistema de límites
  usageLimits: UsageLimits;
  
  // Historial de comidas
  mealLogs: MealLog[];
  
  // Estado de la app
  loading: boolean;
  error: string | null;
  isSetupComplete: boolean;
}

const initialState: NutritionState = {
  userConfig: null,
  goals: null,
  macros: null,
  usageLimits: {
    dailyLimit: 12, // LÍMITE AJUSTADO A 12 PARA PRUEBAS
    dailyUsage: 0,
    monthlyUsage: 0,
    lastResetDate: new Date().toDateString(),
    tier: 'premium' // Mantenemos premium para pruebas
  },
  mealLogs: [],
  loading: false,
  error: null,
  isSetupComplete: false, // FORZAR SETUP PARA CONFIGURAR OBJETIVOS
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    // Configuración del usuario
    setUserConfig: (state, action: PayloadAction<UserMetrics>) => {
      state.userConfig = action.payload;
    },
    
    setGoals: (state, action: PayloadAction<NutritionGoals>) => {
      state.goals = action.payload;
    },
    
    // Macros
    setMacros: (state, action: PayloadAction<MacroBreakdown>) => {
      state.macros = action.payload;
    },
    
    // Límites de uso
    setUsageLimits: (state, action: PayloadAction<UsageLimits>) => {
      state.usageLimits = action.payload;
    },
    
    incrementDailyUsage: (state) => {
      state.usageLimits.dailyUsage += 1;
      state.usageLimits.monthlyUsage += 1;
    },
    
    resetDailyUsage: (state) => {
      state.usageLimits.dailyUsage = 0;
      state.usageLimits.lastResetDate = new Date().toDateString();
    },
    
    // Logs de comidas
    addMealLog: (state, action: PayloadAction<MealLog>) => {
      state.mealLogs.unshift(action.payload);
    },
    
    setMealLogs: (state, action: PayloadAction<MealLog[]>) => {
      state.mealLogs = action.payload;
    },
    
    // Estado de la app
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setSetupComplete: (state, action: PayloadAction<boolean>) => {
      state.isSetupComplete = action.payload;
    },
    
    // Acciones para sincronización
    setNutritionData: (state, action: PayloadAction<{
      userConfig?: UserMetrics;
      goals?: NutritionGoals;
      macros?: MacroBreakdown;
      usageLimits?: UsageLimits;
      mealLogs?: MealLog[];
      isSetupComplete?: boolean;
    }>) => {
      if (action.payload.userConfig) state.userConfig = action.payload.userConfig;
      if (action.payload.goals) state.goals = action.payload.goals;
      if (action.payload.macros) state.macros = action.payload.macros;
      if (action.payload.usageLimits) state.usageLimits = action.payload.usageLimits;
      if (action.payload.mealLogs) state.mealLogs = action.payload.mealLogs;
      if (action.payload.isSetupComplete !== undefined) {
        state.isSetupComplete = action.payload.isSetupComplete;
      }
    },
    
    // Reset completo
    clearNutrition: (state) => {
      return initialState;
    },
  },
});

export const {
  setUserConfig,
  setGoals,
  setMacros,
  setUsageLimits,
  incrementDailyUsage,
  resetDailyUsage,
  addMealLog,
  setMealLogs,
  setLoading,
  setError,
  setSetupComplete,
  setNutritionData,
  clearNutrition,
} = nutritionSlice.actions;

export default nutritionSlice.reducer; 