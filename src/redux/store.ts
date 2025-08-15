import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import nutritionReducer from './slices/nutritionSlice';
import userRoutinesReducer from './slices/userRoutinesSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';
// (Luego agregaremos memberReducer, adminReducer, etc.)

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    nutrition: nutritionReducer,
    userRoutines: userRoutinesReducer,
    userPreferences: userPreferencesReducer,
    // member: memberReducer,
    // admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas en los checks de serialización (para Firebase)
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 