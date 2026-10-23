import React, { createContext, useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';
import authService from '../services/authService';

export const AuthContext = createContext({
  userToken: null,
  user: null,
  isLoading: true,
  isAuthModalVisible: false,
  activeAuthTab: 'login',
  login: async () => {},
  logout: async () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  refreshPerfil: async () => {},
});

const TOKEN_KEY = '@prediyogur_token';
const USER_KEY = '@prediyogur_user';

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState('login');

  // Efecto inicial: Comprobar al arrancar si existe sesión previa
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getItem(TOKEN_KEY);
        const storedUser = await storage.getItem(USER_KEY);

        if (storedToken) {
          setUserToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error al restaurar sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Función para autenticar y guardar token/usuario
  const login = async (token, userData = null) => {
    try {
      await storage.setItem(TOKEN_KEY, token);
      if (userData) {
        await storage.setItem(USER_KEY, JSON.stringify(userData));
      }
      setUserToken(token);
      setUser(userData);
      setIsAuthModalVisible(false);
    } catch (error) {
      console.error('[AuthContext] Error al almacenar credenciales de login:', error);
      throw error;
    }
  };

  // Función para cerrar sesión y limpiar storage
  const logout = async () => {
    try {
      await storage.multiRemove([TOKEN_KEY, USER_KEY]);
      setUserToken(null);
      setUser(null);
      setIsAuthModalVisible(false);
    } catch (error) {
      console.error('[AuthContext] Error al cerrar sesión:', error);
      throw error;
    }
  };

  // Refrescar datos de perfil desde el servidor
  const refreshPerfil = useCallback(async () => {
    if (!userToken) return;
    try {
      const res = await authService.getPerfil();
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        await storage.setItem(USER_KEY, JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('[AuthContext] No se pudo refrescar el perfil:', err.message);
    }
  }, [userToken]);

  // Manejo de Modal de Autenticación
  const openAuthModal = (tab = 'login') => {
    setActiveAuthTab(tab);
    setIsAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalVisible(false);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        user,
        isLoading,
        isAuthModalVisible,
        activeAuthTab,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
        refreshPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
