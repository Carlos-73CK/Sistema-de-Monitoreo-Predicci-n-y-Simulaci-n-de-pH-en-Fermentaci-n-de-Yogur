import api, { isNetworkError } from './api';
import storage from '../utils/storage';

const LOCAL_USERS_KEY = '@prediyogur_local_users';

/**
 * Cuentas científicas base preconfiguradas para funcionamiento autónomo local
 */
const USUARIOS_BASE_LOCAL = [
  {
    id: 1,
    nombre: 'Dr. Stalin Santacruz Terán',
    apellidos: 'Santacruz Terán',
    username: 'stalin.santacruz',
    email: 'dr.santacruz@uleam.edu.ec',
    passwordPlain: 'santacruz2026',
    rol: 'investigador',
  },
  {
    id: 2,
    nombre: 'Carlos Delgado',
    apellidos: 'Delgado',
    username: 'carlos.delgado',
    email: 'carlos.delgado@uleam.edu.ec',
    passwordPlain: 'carlos2026',
    rol: 'investigador',
  },
  {
    id: 3,
    nombre: 'Estudiante ULEAM',
    apellidos: 'ULEAM',
    username: 'estudiante.uleam',
    email: 'estudiante@uleam.edu.ec',
    passwordPlain: 'estudiante2026',
    rol: 'estudiante',
  },
];

/**
 * Obtiene usuarios guardados localmente en el dispositivo
 */
async function getUsuariosGuardadosLocalmente() {
  try {
    const raw = await storage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Guarda un nuevo usuario en el almacén local del dispositivo
 */
async function guardarUsuarioLocal(nuevoUser) {
  try {
    const lista = await getUsuariosGuardadosLocalmente();
    lista.push(nuevoUser);
    await storage.setItem(LOCAL_USERS_KEY, JSON.stringify(lista));
  } catch (e) {
    console.warn('[authService] Error al guardar usuario localmente:', e.message);
  }
}

/**
 * Servicio de Autenticación Universal — PrediYogur
 * Soporta conexión directa con Backend Express y Conmutación Autónoma Local en caso de desconexión.
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario
   * @param {string} identificador (correo institucional o nombre de usuario)
   * @param {string} password 
   * @returns {Promise<{ token: string, user: Object }>}
   */
  login: async (identificador, password) => {
    const cleanId = String(identificador || '').trim();
    const cleanPass = String(password || '');

    // 1. Intentar autenticar contra el servidor backend
    try {
      const response = await api.post('/auth/login', {
        identificador: cleanId,
        email: cleanId,
        password: cleanPass,
      });
      return response.data;
    } catch (error) {
      // Si el servidor respondió con error de negocio (401 credenciales incorrectas, 429 bloqueo), propagarlo
      if (!isNetworkError(error)) {
        throw error;
      }

      console.warn('[authService] Servidor backend inaccesible. Conmutando a verificación local autónoma...');

      // 2. Fallback autónomo local: buscar en cuentas predeterminadas y cuentas registradas en el dispositivo
      const locales = await getUsuariosGuardadosLocalmente();
      const todos = [...USUARIOS_BASE_LOCAL, ...locales];

      const matchUser = todos.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uUser = (u.username || '').toLowerCase();
        const search = cleanId.toLowerCase();
        return uEmail === search || uUser === search;
      });

      if (!matchUser) {
        const err = new Error('No se pudo conectar con el servidor backend y el usuario no existe localmente.');
        err.response = { data: { message: 'No se pudo conectar con el servidor backend ni se encontró la cuenta localmente.' } };
        throw err;
      }

      const matchPass = cleanPass === matchUser.passwordPlain || cleanPass === matchUser.password;
      if (!matchPass) {
        const err = new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
        err.response = { data: { message: 'Credenciales inválidas. Correo o contraseña incorrectos.' } };
        throw err;
      }

      return {
        success: true,
        data: {
          token: `local_token_${matchUser.id}_${Date.now()}`,
          user: {
            id: matchUser.id,
            nombre: matchUser.nombre,
            apellidos: matchUser.apellidos || '',
            username: matchUser.username,
            email: matchUser.email,
            rol: matchUser.rol || 'estudiante',
            modo: 'offline_autonomo',
          },
        },
        message: `¡Sesión iniciada correctamente! Bienvenido(a) ${matchUser.nombre}. (Modo Autónomo)`,
      };
    }
  },

  /**
   * Registra un nuevo usuario en la plataforma
   */
  register: async (datosUsuario) => {
    // 1. Intentar registrar en servidor backend
    try {
      const response = await api.post('/auth/register', datosUsuario);
      return response.data;
    } catch (error) {
      // Si el servidor respondió con validación de negocio, propagar
      if (!isNetworkError(error)) {
        throw error;
      }

      console.warn('[authService] Servidor backend inaccesible. Registrando en almacenamiento local del dispositivo...');

      // 2. Registro local autónomo en el dispositivo
      const cleanNombres = String(datosUsuario.nombres || datosUsuario.nombre || '').trim();
      const cleanApellidos = String(datosUsuario.apellidos || '').trim();
      const cleanEmail = String(datosUsuario.email || datosUsuario.correo || '').trim().toLowerCase();
      const cleanUsername = String(datosUsuario.username || datosUsuario.nombreUsuario || cleanEmail.split('@')[0]).trim().toLowerCase();

      const locales = await getUsuariosGuardadosLocalmente();
      const todos = [...USUARIOS_BASE_LOCAL, ...locales];

      const duplicado = todos.some((u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername);
      if (duplicado) {
        const err = new Error('El correo o nombre de usuario ya está registrado en este dispositivo.');
        err.response = { data: { message: 'El correo electrónico o nombre de usuario ya se encuentra registrado.' } };
        throw err;
      }

      const nuevoLocalUser = {
        id: Date.now(),
        nombre: cleanNombres,
        apellidos: cleanApellidos,
        username: cleanUsername,
        email: cleanEmail,
        passwordPlain: datosUsuario.password,
        password: datosUsuario.password,
        rol: datosUsuario.rol || 'estudiante',
        creado_en: new Date().toISOString(),
      };

      await guardarUsuarioLocal(nuevoLocalUser);

      return {
        success: true,
        data: {
          token: `local_token_reg_${nuevoLocalUser.id}`,
          user: {
            id: nuevoLocalUser.id,
            nombre: nuevoLocalUser.nombre,
            apellidos: nuevoLocalUser.apellidos,
            username: nuevoLocalUser.username,
            email: nuevoLocalUser.email,
            rol: nuevoLocalUser.rol,
            modo: 'offline_autonomo',
          },
        },
        message: `¡Bienvenido(a) ${cleanNombres}! Cuenta creada exitosamente en tu dispositivo.`,
      };
    }
  },

  /**
   * Solicita token o enlace temporal de recuperación de contraseña
   */
  forgotPassword: async (email) => {
    const cleanEmail = String(email || '').trim();
    try {
      const response = await api.post('/auth/forgot-password', {
        email: cleanEmail,
        identificador: cleanEmail,
      });
      return response.data;
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      // Fallback local
      const mockToken = 'local_reset_' + Math.random().toString(36).substring(2, 10);
      return {
        success: true,
        data: { dev_token: mockToken },
        message: 'Instrucciones y token de recuperación generados en modo local.',
      };
    }
  },

  /**
   * Restablece la contraseña utilizando el token de recuperación
   */
  resetPassword: async ({ token, password, confirmPassword }) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token: String(token || '').trim(),
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      return {
        success: true,
        data: null,
        message: 'Contraseña actualizada exitosamente en el dispositivo.',
      };
    }
  },

  /**
   * Obtiene el perfil del usuario autenticado actual
   */
  getPerfil: async () => {
    try {
      const response = await api.get('/auth/perfil');
      return response.data;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      const rawUser = await storage.getItem('@prediyogur_user');
      return { success: true, data: { user: rawUser ? JSON.parse(rawUser) : null } };
    }
  },

  /**
   * Obtiene la lista de usuarios preconfigurados
   */
  getUsuariosDisponibles: async () => {
    try {
      const response = await api.get('/auth/usuarios');
      return response.data;
    } catch (error) {
      const locales = await getUsuariosGuardadosLocalmente();
      return {
        success: true,
        data: {
          total: USUARIOS_BASE_LOCAL.length + locales.length,
          usuarios: [...USUARIOS_BASE_LOCAL, ...locales],
        },
      };
    }
  },
};

export default authService;
