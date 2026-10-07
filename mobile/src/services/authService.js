import api from './api';

/**
 * Servicio de Autenticación
 * Conecta con los endpoints /api/auth del backend
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ token: string, user: Object }>}
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Obtiene el perfil del usuario autenticado actual
   * @returns {Promise<Object>}
   */
  getPerfil: async () => {
    const response = await api.get('/auth/perfil');
    return response.data;
  },
};

export default authService;
