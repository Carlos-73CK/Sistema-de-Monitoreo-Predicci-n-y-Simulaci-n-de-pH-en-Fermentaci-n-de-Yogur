import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
  userToken: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

const TOKEN_KEY = '@prediyogur_token';
const USER_KEY = '@prediyogur_user';

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto inicial: Comprobar al arrancar si existe sesión previa
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setUserToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error al restaurar sesión desde AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Función para autenticar y guardar token/usuario
  const login = async (token, userData = null) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      if (userData) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
      setUserToken(token);
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Error al almacenar credenciales de login:', error);
      throw error;
    }
  };

  // Función para cerrar sesión y limpiar storage
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      setUserToken(null);
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Error al eliminar credenciales en logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
