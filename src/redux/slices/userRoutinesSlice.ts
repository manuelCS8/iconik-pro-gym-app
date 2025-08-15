import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserRoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroups?: string[];
  equipment?: string;
  difficulty?: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // en segundos
  restTime: number; // en segundos
  notes?: string;
}

export interface UserRoutine {
  id?: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // en minutos
  exercises: UserRoutineExercise[];
  createdBy: string;
  createdAt: string; // Cambiado de Date a string para Redux
  isActive: boolean;
  isPublic: boolean;
}

export interface UserRoutinesState {
  routines: UserRoutine[];
  currentRoutine: UserRoutine | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserRoutinesState = {
  routines: [],
  currentRoutine: null,
  loading: false,
  error: null,
};

const userRoutinesSlice = createSlice({
  name: 'userRoutines',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRoutines: (state, action: PayloadAction<UserRoutine[]>) => {
      state.routines = action.payload;
    },

    addRoutine: (state, action: PayloadAction<UserRoutine>) => {
      state.routines.unshift(action.payload);
    },
    updateRoutine: (state, action: PayloadAction<UserRoutine>) => {
      const index = state.routines.findIndex(routine => routine.id === action.payload.id);
      if (index !== -1) {
        state.routines[index] = action.payload;
      }
    },
    deleteRoutine: (state, action: PayloadAction<string>) => {
      state.routines = state.routines.filter(routine => routine.id !== action.payload);
    },

    setCurrentRoutine: (state, action: PayloadAction<UserRoutine | null>) => {
      state.currentRoutine = action.payload;
    },
    addExerciseToRoutine: (state, action: PayloadAction<{ routineId: string; exercise: UserRoutineExercise }>) => {
      const routine = state.routines.find(r => r.id === action.payload.routineId);
      if (routine) {
        routine.exercises.push(action.payload.exercise);
      }
      if (state.currentRoutine?.id === action.payload.routineId) {
        state.currentRoutine.exercises.push(action.payload.exercise);
      }
    },
    removeExerciseFromRoutine: (state, action: PayloadAction<{ routineId: string; exerciseIndex: number }>) => {
      const routine = state.routines.find(r => r.id === action.payload.routineId);
      if (routine) {
        routine.exercises.splice(action.payload.exerciseIndex, 1);
      }
      if (state.currentRoutine?.id === action.payload.routineId) {
        state.currentRoutine.exercises.splice(action.payload.exerciseIndex, 1);
      }
    },
    updateExerciseInRoutine: (state, action: PayloadAction<{ routineId: string; exerciseIndex: number; exercise: UserRoutineExercise }>) => {
      const routine = state.routines.find(r => r.id === action.payload.routineId);
      if (routine) {
        routine.exercises[action.payload.exerciseIndex] = action.payload.exercise;
      }
      if (state.currentRoutine?.id === action.payload.routineId) {
        state.currentRoutine.exercises[action.payload.exerciseIndex] = action.payload.exercise;
      }
    },
    clearUserRoutines: (state) => {
      state.routines = [];
      state.currentRoutine = null;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setRoutines,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  setCurrentRoutine,
  addExerciseToRoutine,
  removeExerciseFromRoutine,
  updateExerciseInRoutine,
  clearUserRoutines,
} = userRoutinesSlice.actions;

export default userRoutinesSlice.reducer; 