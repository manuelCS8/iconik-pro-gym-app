import { useState, useEffect, useCallback } from 'react';
import SessionPersistenceService from '../services/sessionPersistenceService';

export const useSessionPersistence = () => {
  const [sessionInfo, setSessionInfo] = useState<{
    isAuthenticated: boolean;
    lastLogin: string | null;
    userEmail: string | null;
    membershipStatus: string | null;
  }>({
    isAuthenticated: false,
    lastLogin: null,
    userEmail: null,
    membershipStatus: null
  });

  const [loading, setLoading] = useState(true);

  const loadSessionInfo = useCallback(async () => {
    try {
      setLoading(true);
      const info = await SessionPersistenceService.getSessionInfo();
      setSessionInfo(info);
    } catch (error) {
      console.error('Error cargando información de sesión:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await SessionPersistenceService.clearSession();
      setSessionInfo({
        isAuthenticated: false,
        lastLogin: null,
        userEmail: null,
        membershipStatus: null
      });
      console.log('✅ Sesión limpiada exitosamente');
    } catch (error) {
      console.error('❌ Error limpiando sesión:', error);
    }
  }, []);

  const forceRenewal = useCallback(async () => {
    try {
      await SessionPersistenceService.forceSessionRenewal();
      await loadSessionInfo(); // Recargar información
      console.log('✅ Sesión renovada exitosamente');
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
    }
  }, [loadSessionInfo]);

  const hasValidSession = useCallback(async (): Promise<boolean> => {
    try {
      return await SessionPersistenceService.hasValidSession();
    } catch (error) {
      console.error('❌ Error verificando sesión válida:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadSessionInfo();
  }, [loadSessionInfo]);

  return {
    sessionInfo,
    loading,
    clearSession,
    forceRenewal,
    hasValidSession,
    loadSessionInfo
  };
};
