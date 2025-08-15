import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  name: string;
  weight?: number;
  height?: number;
  age?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  uid: string | null;
  email: string | null;
  role: "MEMBER" | "ADMIN" | null;
  membershipStart: string | null;
  membershipEnd: string | null;
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  uid: null,
  email: null,
  role: null,
  membershipStart: null,
  membershipEnd: null,
  user: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ uid: string; email: string; role: "MEMBER" | "ADMIN" }>) => {
      state.isAuthenticated = true;
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.loading = false;
    },
    loginFailure: (state) => {
      state.loading = false;
    },
    logout: (state) => {
      return initialState; // Reset completo al estado inicial
    },
    clearUser: (state) => {
      return initialState; // Alias para logout
    },
    setUser: (state, action: PayloadAction<{
      uid: string;
      email: string;
      role: "MEMBER" | "ADMIN";
      membershipStart?: string;
      membershipEnd: string;
      name: string;
      weight?: number;
      height?: number;
      age?: number;
    }>) => {
      state.isAuthenticated = true;
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.membershipStart = action.payload.membershipStart || null;
      state.membershipEnd = action.payload.membershipEnd;
      state.user = {
        name: action.payload.name,
        weight: action.payload.weight,
        height: action.payload.height,
        age: action.payload.age,
      };
      state.loading = false;
    },
    // Acción para login demo con datos correctos según rol
    demoLogin: (state, action: PayloadAction<"MEMBER" | "ADMIN">) => {
      const isAdmin = action.payload === "ADMIN";
      
      state.isAuthenticated = true;
      state.uid = isAdmin ? "admin-iconik-2024" : "member-iconik-2024";
      state.email = isAdmin ? "admin@iconik.com" : "member@iconik.com";
      state.role = action.payload;
      state.membershipStart = isAdmin ? "2023-01-01" : "2024-01-01";
      state.membershipEnd = isAdmin ? "2025-12-31" : "2024-12-31";
      state.user = {
        name: isAdmin ? "Administrador" : "Juan Pérez",
        weight: isAdmin ? 80 : 75,
        height: isAdmin ? 180 : 175,
        age: isAdmin ? 30 : 28,
      };
      state.loading = false;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearUser, 
  setUser, 
  demoLogin 
} = authSlice.actions;

export default authSlice.reducer; 