import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAOTdkF5ikku9iRSy6w2qlLGOJaF7GEoS8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "app-iconik-pro.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "app-iconik-pro",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "app-iconik-pro.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "375868728099",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:375868728099:web:dc214ba8eeb00c2f3b6296",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NLR7KCLB7H"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configurar persistencia de autenticación
const initializeAuthPersistence = async () => {
  try {
    // Configurar persistencia local para mantener sesión
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Persistencia de autenticación configurada');
  } catch (error) {
    console.error('❌ Error configurando persistencia:', error);
    // Fallback a persistencia en memoria
    try {
      await setPersistence(auth, inMemoryPersistence);
      console.log('⚠️ Usando persistencia en memoria como fallback');
    } catch (fallbackError) {
      console.error('❌ Error con fallback de persistencia:', fallbackError);
    }
  }
};

// Inicializar persistencia
initializeAuthPersistence();

// Configurar proveedor de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app; 