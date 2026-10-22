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
 * Registra un nuevo usuario en SQLite (y sincroniza con PostgreSQL si está disponible)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const register = async (req, res) => {
  const { nombre, email, password, rol = 'estudiante' } = req.body || {};

  // Validaciones rigurosas
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
    return res.status(400).json({
      success: false,
      data: null,
      message: errores[0],
      errores,
      error: 'VALIDATION_ERROR',
    });
  }

  const emailLimpio = email.trim().toLowerCase();
  const nombreLimpio = nombre.trim();

  try {
    // 1. Validar si ya existe en SQLite
    const existenteSQLite = buscarUsuarioPorEmailSQLite(emailLimpio);
    if (existenteSQLite) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'El correo electrónico ya se encuentra registrado en el sistema.',
        error: 'USER_ALREADY_EXISTS',
      });
    }

    // 2. Hashear la contraseña con bcrypt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Crear usuario en SQLite (almacén garantizado y autónomo)
    const nuevoUsuario = crearUsuarioSQLite(nombreLimpio, emailLimpio, hashedPassword, rolFinal);

    // 4. Intentar sincronización con PostgreSQL si la base remota está conectada
    try {
      if (pool && typeof pool.query === 'function') {
        const pgCheck = await pool.query(
          `SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1) LIMIT 1`,
          [emailLimpio]
        );
        if (pgCheck.rowCount === 0) {
          await pool.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, rol)
             VALUES ($1, LOWER($2), $3, $4)`,
            [nombreLimpio, emailLimpio, hashedPassword, rolFinal]
          );
        }
      }
    } catch (pgErr) {
      console.warn('[Auth] Sincronización secundaria PostgreSQL omitida (modo SQLite autónomo):', pgErr.message);
    }

    // 5. Emitir token JWT firmado para autenticación inmediata
    const payload = {
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      nombre: nuevoUsuario.nombre,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
          created_at: nuevoUsuario.created_at,
        },
      },
      message: `¡Bienvenido(a) a PrediYogur, ${nuevoUsuario.nombre}! Cuenta creada exitosamente.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'No fue posible completar el registro del usuario.',
      error: error.message,
    });
  }
};

/**
 * Autentica un usuario contra SQLite (con fallback a PostgreSQL), valida hash con bcrypt y firma un JWT real
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe ingresar su correo electrónico y contraseña.',
      error: 'VALIDATION_ERROR',
    });
  }

  const emailLimpio = String(email).trim().toLowerCase();

  try {
    // 1. Consultar usuario en SQLite
    let usuario = buscarUsuarioPorEmailSQLite(emailLimpio);

    // Si no está en SQLite, intentar buscar en PostgreSQL como respaldo
    if (!usuario) {
      try {
        if (pool && typeof pool.query === 'function') {
          const pgRes = await pool.query(
            `SELECT id, nombre, correo, contrasena, rol
             FROM usuarios
             WHERE LOWER(correo) = LOWER($1)
             LIMIT 1`,
            [emailLimpio]
          );
          if (pgRes.rowCount > 0) {
            const pgUser = pgRes.rows[0];
            // Importar a SQLite para futuras consultas
            crearUsuarioSQLite(pgUser.nombre, pgUser.correo, pgUser.contrasena, pgUser.rol);
            usuario = buscarUsuarioPorEmailSQLite(emailLimpio);
          }
        }
      } catch (pgErr) {
        console.warn('[Auth] Fallback a PostgreSQL no disponible:', pgErr.message);
      }
    }

    if (!usuario) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas. Correo o contraseña incorrectos.',
        error: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    // 2. Comparar contraseña en texto plano con el hash de bcrypt
    const passwordValido = await bcrypt.compare(String(password), usuario.contrasena);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas. Correo o contraseña incorrectos.',
        error: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    // 3. Preparar payload del token JWT
    const payload = {
      id: usuario.id,
      email: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol,
        },
      },
      message: `¡Sesión iniciada correctamente! Bienvenido(a) ${usuario.nombre}.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'No fue posible iniciar sesión en este momento.',
      error: error.message,
    });
  }
};

/**
 * Retorna el perfil del usuario autenticado
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getPerfil = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Usuario no autenticado.',
      error: 'AUTH_UNAUTHORIZED',
    });
  }

  return res.status(200).json({
    success: true,
    data: { user: req.user },
    message: 'Perfil obtenido correctamente.',
    error: null,
  });
};

/**
 * Retorna la lista de usuarios para propósitos de pruebas / selector de perfil
 */
const getUsuariosDisponibles = (_req, res) => {
  try {
    const usuarios = listarUsuariosSQLite();
    return res.status(200).json({
      success: true,
      data: {
        total: usuarios.length,
        usuarios,
      },
      message: 'Lista de usuarios disponibles recuperada.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al recuperar usuarios.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getPerfil,
  getUsuariosDisponibles,
};
