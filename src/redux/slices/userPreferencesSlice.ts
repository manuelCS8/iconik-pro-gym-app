import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WeightUnit = 'KG' | 'LBS';

interface UserPreferences {
  weightUnit: WeightUnit;
  // Futuras preferencias pueden agregarse aquí
  // language: string;
  // theme: 'light' | 'dark';
  // notifications: boolean;
}

interface UserPreferencesState {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

const initialState: UserPreferencesState = {
  preferences: {
    weightUnit: 'KG', // Por defecto KG
  },
  loading: false,
  error: null,
};

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setWeightUnit: (state, action: PayloadAction<WeightUnit>) => {
      state.preferences.weightUnit = action.payload;
    },
    setPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPreferences: (state) => {
      return initialState;
    },
  },
});

export const {
  setWeightUnit,
  setPreferences,
  setLoading,
  setError,
  clearPreferences,
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer; 