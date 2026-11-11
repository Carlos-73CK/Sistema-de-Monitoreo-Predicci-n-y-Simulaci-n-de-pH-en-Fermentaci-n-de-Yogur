import axios from 'axios';
import { Platform } from 'react-native';
import storage from '../utils/storage';

export const API_URL_KEY = '@prediyogur_api_url';
export const DEFAULT_HOST_IP = '192.168.0.109'; // IP local del servidor en la red Wi-Fi

let activeBaseUrl = null;

/**
 * Detección dinámica y configurable de la URL del Backend (Express en puerto 5000)
 */
export const getBaseUrl = () => {
  if (activeBaseUrl) {
    return activeBaseUrl;
  }
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  if (Platform.OS === 'android') {
    // En Android móvil intenta la IP local Wi-Fi de la PC de desarrollo
    return `http://${DEFAULT_HOST_IP}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const setCustomBaseUrl = async (newUrl) => {
  if (!newUrl) {
    await storage.removeItem(API_URL_KEY);
    activeBaseUrl = null;
  } else {
    let clean = newUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
    await storage.setItem(API_URL_KEY, clean);
    activeBaseUrl = clean;
  }
  api.defaults.baseURL = activeBaseUrl || getBaseUrl();
  return api.defaults.baseURL;
};

export const getSavedBaseUrl = async () => {
  try {
    const saved = await storage.getItem(API_URL_KEY);
    if (saved && saved.trim()) {
      activeBaseUrl = saved.trim();
      return activeBaseUrl;
    }
  } catch (e) {}
  return getBaseUrl();
};

export const DEFAULT_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 4000, // 4 segundos de timeout para respuesta ágil y conmutación rápida a modo autónomo
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: inyecta URL personalizada y token JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const customUrl = await storage.getItem(API_URL_KEY);
      if (customUrl && customUrl.trim()) {
        config.baseURL = customUrl.trim();
      }
      const token = await storage.getItem('@prediyogur_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Error al recuperar configuración de almacenamiento:', error);
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
      console.warn('[API] Sesión no autorizada o expirada (401).');
    }
    return Promise.reject(error);
  }
);

/**
 * Determina si el error fue por falta de conexión al servidor (servidor apagado, timeout o red caída)
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  if (!error.response) return true;
  if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
    return true;
  }
  return false;
};

export default api;
