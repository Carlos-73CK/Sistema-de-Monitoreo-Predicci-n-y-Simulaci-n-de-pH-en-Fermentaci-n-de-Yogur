import axios from 'axios';
import { Platform } from 'react-native';
import storage from '../utils/storage';

/**
 * Detección dinámica y universal de la URL del Backend (Express en puerto 5000)
 * - En Navegador Web: utiliza el hostname actual o localhost:5000
 * - En Emulador de Android Studio: 10.0.2.2:5000 (puente de red del emulador)
 * - En Dispositivo Físico Android/iOS: IP de red local
 */
export const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const DEFAULT_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: inyecta el token JWT en las cabeceras si existe en storage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('@prediyogur_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Error al recuperar token de almacenamiento:', error);
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
        await storage.multiRemove(['@prediyogur_token', '@prediyogur_user']);
      } catch (storageError) {
        console.error('[API] Error al limpiar credenciales tras 401:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
