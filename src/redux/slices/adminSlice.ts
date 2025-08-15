import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Member {
  uid: string;
  email: string;
  displayName: string;
  joinDate: Date;
  membershipType: 'basic' | 'premium' | 'vip';
  isActive: boolean;
}

interface AdminState {
  members: Member[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalRoutines: number;
    totalExercises: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  members: [],
  stats: {
    totalMembers: 0,
    activeMembers: 0,
    totalRoutines: 0,
    totalExercises: 0,
  },
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setMembers: (state, action: PayloadAction<Member[]>) => {
      state.members = action.payload;
    },
    updateMember: (state, action: PayloadAction<Member>) => {
      const index = state.members.findIndex(member => member.uid === action.payload.uid);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
    },
    removeMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter(member => member.uid !== action.payload);
    },
    setStats: (state, action: PayloadAction<AdminState['stats']>) => {
      state.stats = action.payload;
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
      members?: Member[];
      stats?: AdminState['stats'];
    }>) => {
      if (action.payload.members) {
        state.members = action.payload.members;
      }
      if (action.payload.stats) {
        state.stats = action.payload.stats;
      }
    },
  },
});

export const {
  setLoading,
  setMembers,
  updateMember,
  removeMember,
  setStats,
  setError,
  clearError,
  clearUser,
  setUser,
} = adminSlice.actions;

export default adminSlice.reducer; 