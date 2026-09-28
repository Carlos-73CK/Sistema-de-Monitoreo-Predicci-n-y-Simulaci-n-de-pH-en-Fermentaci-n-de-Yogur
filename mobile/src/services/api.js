import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base predeterminada: 10.0.2.2 para emuladores Android, localhost para iOS y Web
export const DEFAULT_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: inyecta el token JWT en las cabeceras si existe en AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@prediyogur_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error al recuperar token de AsyncStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: captura errores globales (como 401 sesión expirada)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] Sesión expirada o no autorizada (401). Limpiando almacenamiento...');
      try {
        await AsyncStorage.multiRemove(['@prediyogur_token', '@prediyogur_user']);
      } catch (storageError) {
        console.error('[API] Error al limpiar AsyncStorage tras 401:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
