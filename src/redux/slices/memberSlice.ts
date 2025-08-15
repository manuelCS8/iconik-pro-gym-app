import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  equipment?: string;
  imageUrl?: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration: number; // en minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdBy: string;
  isPublic: boolean;
}

interface MemberState {
  routines: Routine[];
  myRoutines: Routine[];
  exercises: Exercise[];
  currentWorkout: Routine | null;
  loading: boolean;
  error: string | null;
}

const initialState: MemberState = {
  routines: [],
  myRoutines: [],
  exercises: [],
  currentWorkout: null,
  loading: false,
  error: null,
};

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRoutines: (state, action: PayloadAction<Routine[]>) => {
      state.routines = action.payload;
    },
    setMyRoutines: (state, action: PayloadAction<Routine[]>) => {
      state.myRoutines = action.payload;
    },
    setExercises: (state, action: PayloadAction<Exercise[]>) => {
      state.exercises = action.payload;
    },
    startWorkout: (state, action: PayloadAction<Routine>) => {
      state.currentWorkout = action.payload;
    },
    endWorkout: (state) => {
      state.currentWorkout = null;
    },
    addToMyRoutines: (state, action: PayloadAction<Routine>) => {
      state.myRoutines.push(action.payload);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUser: (state) => {
      return initialState;
    },
    setUser: (state, action: PayloadAction<{
      routines?: Routine[];
      myRoutines?: Routine[];
    }>) => {
      if (action.payload.routines) {
        state.routines = action.payload.routines;
      }
      if (action.payload.myRoutines) {
        state.myRoutines = action.payload.myRoutines;
      }
    },
  },
});

export const {
  setLoading,
  setRoutines,
  setMyRoutines,
  setExercises,
  startWorkout,
  endWorkout,
  addToMyRoutines,
  setError,
  clearError,
  clearUser,
  setUser,
} = memberSlice.actions;

export default memberSlice.reducer; 