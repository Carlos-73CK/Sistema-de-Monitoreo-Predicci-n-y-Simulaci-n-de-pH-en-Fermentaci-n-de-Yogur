import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Módulo de Almacenamiento Persistente Universal
 * Utiliza localStorage nativo en navegadores Web y AsyncStorage en Android/iOS
 */
export const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (err) {
        console.warn('[Storage Web] Error al leer:', err);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (err) {
        console.warn('[Storage Web] Error al guardar:', err);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (err) {
        console.warn('[Storage Web] Error al eliminar:', err);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },

  async multiRemove(keys) {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach((k) => window.localStorage.removeItem(k));
          return;
        }
      } catch (err) {
        console.warn('[Storage Web] Error al limpiar múltiples:', err);
      }
      return;
    }
    return AsyncStorage.multiRemove(keys);
  },
};

export default storage;
