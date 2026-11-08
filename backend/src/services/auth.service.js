/**
 * Servicio de Autenticación y Autorización — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Implementa la lógica de negocio para:
 * - Registro seguro con hash bcrypt (10 rounds)
 * - Inicio de sesión y verificación de credenciales
 * - Generación y firma de tokens JWT (Bearer)
 * - Sincronización transparente SQLite / PostgreSQL
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
  crearUsuarioSQLite,
  buscarUsuarioPorEmailSQLite,
  buscarUsuarioPorIdSQLite,
  listarUsuariosSQLite,
} = require('../ai/sqliteStore');

const JWT_SECRET = process.env.JWT_SECRET || 'prediyogur_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Validador de formato de correo electrónico
 */
function esEmailValido(correo) {
  if (!correo || typeof correo !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo.trim());
}

/**
 * Registra un nuevo usuario en el sistema
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.email
 * @param {string} datos.password
 * @param {string} [datos.rol]
 */
async function registrarUsuario({ nombre, email, password, rol = 'estudiante' }) {
  const errores = [];
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    errores.push('El nombre completo debe tener al menos 2 caracteres.');
  }

  if (!email || !esEmailValido(email)) {
    errores.push('Debe proporcionar una dirección de correo electrónico válida (ej: usuario@uleam.edu.ec).');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errores.push('La contraseña debe tener un mínimo de 6 caracteres para garantizar la seguridad.');
  }

  const rolNormalizado = String(rol || 'estudiante').trim().toLowerCase();
  const rolesValidos = ['docente', 'estudiante', 'investigador'];
  const rolFinal = rolesValidos.includes(rolNormalizado) ? rolNormalizado : 'estudiante';

  if (errores.length > 0) {
    const error = new Error(errores[0]);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = errores;
    throw error;
  }

  const emailLimpio = email.trim().toLowerCase();
  const nombreLimpio = nombre.trim();

  // Validar si ya existe
  const existenteSQLite = buscarUsuarioPorEmailSQLite(emailLimpio);
  if (existenteSQLite) {
    const error = new Error('El correo electrónico ya se encuentra registrado en el sistema.');
    error.statusCode = 409;
    error.errorCode = 'USER_ALREADY_EXISTS';
    throw error;
  }

  // Hashear contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear en SQLite (almacén garantizado autónomo)
  const nuevoUsuario = crearUsuarioSQLite(nombreLimpio, emailLimpio, hashedPassword, rolFinal);

  // Sincronización con PostgreSQL si está disponible
  try {
    if (pool && typeof pool.query === 'function') {
      const pgCheck = await pool.query(
        `SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
        [emailLimpio]
      );
      if (pgCheck.rowCount === 0) {
        await pool.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol)
           VALUES ($1, LOWER($2), $3, $4)
           ON CONFLICT DO NOTHING`,
          [nombreLimpio, emailLimpio, hashedPassword, rolFinal]
        );
      }
    }
  } catch (pgErr) {
    console.warn('[AuthService] Sincronización secundaria PostgreSQL omitida:', pgErr.message);
  }

  // Firmar JWT
  const payload = {
    id: nuevoUsuario.id,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol,
    nombre: nuevoUsuario.nombre,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      created_at: nuevoUsuario.created_at,
    },
    message: `¡Bienvenido(a) a PrediYogur, ${nuevoUsuario.nombre}! Cuenta creada exitosamente.`,
  };
}

/**
 * Autentica un usuario contra el almacén de credenciales y firma un JWT
 * @param {Object} credenciales
 * @param {string} credenciales.email
 * @param {string} credenciales.password
 */
async function autenticarUsuario({ email, password }) {
  if (!email || !password) {
    const error = new Error('Debe ingresar su correo electrónico y contraseña.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const emailLimpio = String(email).trim().toLowerCase();

  // 1. Buscar en SQLite
  let usuario = buscarUsuarioPorEmailSQLite(emailLimpio);

  // 2. Si no existe en SQLite, intentar en PostgreSQL
  if (!usuario) {
    try {
      if (pool && typeof pool.query === 'function') {
        const pgRes = await pool.query(
          `SELECT id, nombre, email as correo, password_hash as contrasena, rol
           FROM usuarios
           WHERE LOWER(email) = LOWER($1)
           LIMIT 1`,
          [emailLimpio]
        );
        if (pgRes.rowCount > 0) {
          const pgUser = pgRes.rows[0];
          crearUsuarioSQLite(pgUser.nombre, pgUser.correo, pgUser.contrasena, pgUser.rol);
          usuario = buscarUsuarioPorEmailSQLite(emailLimpio);
        }
      }
    } catch (pgErr) {
      console.warn('[AuthService] Fallback PostgreSQL no disponible:', pgErr.message);
    }
  }

  if (!usuario) {
    const error = new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    error.statusCode = 401;
    error.errorCode = 'AUTH_INVALID_CREDENTIALS';
    throw error;
  }

  // 3. Comparar contraseña con bcrypt
  const passwordValido = await bcrypt.compare(String(password), usuario.contrasena);
  if (!passwordValido) {
    const error = new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    error.statusCode = 401;
    error.errorCode = 'AUTH_INVALID_CREDENTIALS';
    throw error;
  }

  // 4. Firmar token JWT
  const payload = {
    id: usuario.id,
    email: usuario.correo,
    rol: usuario.rol,
    nombre: usuario.nombre,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.correo,
      rol: usuario.rol,
    },
    message: `¡Sesión iniciada correctamente! Bienvenido(a) ${usuario.nombre}.`,
  };
}

/**
 * Obtiene la lista de usuarios disponibles para demostración y cambio rápido de perfil
 */
function listarUsuarios() {
  return listarUsuariosSQLite();
}

/**
 * Obtiene el perfil de un usuario por su ID
 * @param {number|string} id
 */
function obtenerPerfilPorId(id) {
  return buscarUsuarioPorIdSQLite(Number(id));
}

module.exports = {
  registrarUsuario,
  autenticarUsuario,
  listarUsuarios,
  obtenerPerfilPorId,
  esEmailValido,
};
