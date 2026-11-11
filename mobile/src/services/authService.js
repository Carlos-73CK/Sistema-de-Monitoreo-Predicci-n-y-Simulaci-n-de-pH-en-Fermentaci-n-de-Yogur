import api from './api';

/**
 * Servicio de Autenticación — PrediYogur
 * Conecta con los endpoints /api/auth del backend
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario (correo institucional o nombre de usuario)
   * @param {string} identificador 
   * @param {string} password 
   * @returns {Promise<{ token: string, user: Object }>}
   */
  login: async (identificador, password) => {
    const cleanId = String(identificador || '').trim();
    const response = await api.post('/auth/login', {
      identificador: cleanId,
      email: cleanId,
      password,
    });
    return response.data;
  },

  /**
   * Registra un nuevo usuario en la plataforma
   * @param {Object} datosUsuario
   * @param {string} datosUsuario.nombres
   * @param {string} datosUsuario.apellidos
   * @param {string} datosUsuario.username
   * @param {string} datosUsuario.email
   * @param {string} datosUsuario.password
   * @param {string} datosUsuario.confirmPassword
   * @param {boolean} datosUsuario.aceptaTerminos
   * @param {'estudiante'|'investigador'|'docente'} [datosUsuario.rol='estudiante']
   * @returns {Promise<{ token: string, user: Object }>}
   */
  register: async (datosUsuario) => {
    const response = await api.post('/auth/register', datosUsuario);
    return response.data;
  },

  /**
   * Solicita token o enlace temporal de recuperación de contraseña
   * @param {string} email
   * @returns {Promise<{ message: string, dev_token?: string }>}
   */
  forgotPassword: async (email) => {
    const cleanEmail = String(email || '').trim();
    const response = await api.post('/auth/forgot-password', {
      email: cleanEmail,
      identificador: cleanEmail,
    });
    return response.data;
  },

  /**
   * Restablece la contraseña utilizando el token de recuperación
   * @param {Object} params
   * @param {string} params.token
   * @param {string} params.password
   * @param {string} params.confirmPassword
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  resetPassword: async ({ token, password, confirmPassword }) => {
    const response = await api.post('/auth/reset-password', {
      token: String(token || '').trim(),
      password,
      confirmPassword,
    });
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
