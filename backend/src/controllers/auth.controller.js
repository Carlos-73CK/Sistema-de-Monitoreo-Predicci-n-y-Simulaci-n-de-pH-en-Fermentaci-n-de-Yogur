const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Registra un nuevo usuario en PostgreSQL con contraseña hasheada con bcrypt
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const register = async (req, res) => {
  const { nombre, email, password, rol = 'estudiante' } = req.body || {};

  if (!nombre || !email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe proporcionar nombre, email y password.',
      error: 'VALIDATION_ERROR',
    });
  }

  // Validar rol según restricciones de la base de datos
  const rolNormalizado = String(rol).trim().toLowerCase();
  const rolesValidos = ['docente', 'estudiante', 'investigador'];
  const rolFinal = rolesValidos.includes(rolNormalizado) ? rolNormalizado : 'estudiante';

  try {
    // 1. Validar si ya existe un usuario con el mismo correo
    const userExistente = await pool.query(
      `SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    if (userExistente.rowCount > 0) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'El correo electrónico ya se encuentra registrado.',
        error: 'USER_ALREADY_EXISTS',
      });
    }

    // 2. Hashear la contraseña con bcrypt (10 rounds de salt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insertar usuario en la tabla usuarios de PostgreSQL
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, contrasena, rol)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, nombre, correo, rol, created_at`,
      [nombre.trim(), email.trim(), hashedPassword, rolFinal]
    );

    const nuevoUsuario = result.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.correo,
          rol: nuevoUsuario.rol,
          created_at: nuevoUsuario.created_at,
        },
      },
      message: 'Usuario registrado correctamente.',
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
 * Autentica un usuario contra PostgreSQL, valida hash con bcrypt y firma un JWT real
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar email y password.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    // 1. Consultar usuario por correo
    const result = await pool.query(
      `SELECT id, nombre, correo, contrasena, rol
       FROM usuarios
       WHERE LOWER(correo) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas.',
        error: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    const usuario = result.rows[0];

    // 2. Comparar contraseña en texto plano con el hash de bcrypt
    const passwordValido = await bcrypt.compare(password, usuario.contrasena);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas.',
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

    const secret = process.env.JWT_SECRET || 'prediyogur_super_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(payload, secret, { expiresIn });

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
      message: 'Inicio de sesión exitoso.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'No fue posible iniciar sesión.',
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

module.exports = {
  register,
  login,
  getPerfil,
};
