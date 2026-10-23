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
   * Registra un nuevo usuario en la plataforma
   * @param {Object} datosUsuario
   * @param {string} datosUsuario.nombre
   * @param {string} datosUsuario.email
   * @param {string} datosUsuario.password
   * @param {'estudiante'|'investigador'|'docente'} [datosUsuario.rol='estudiante']
   * @returns {Promise<{ user: Object }>}
   */
  register: async (datosUsuario) => {
    const response = await api.post('/auth/register', datosUsuario);
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

  /**
   * Obtiene la lista de usuarios preconfigurados en SQLite para selector de perfil
   * @returns {Promise<Object>}
   */
  getUsuariosDisponibles: async () => {
    const response = await api.get('/auth/usuarios');
    return response.data;
  },
};

export default authService;
