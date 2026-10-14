const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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
    const result = await pool.query(
      `SELECT id, nombre, correo, contrasena, rol
       FROM usuarios
       WHERE LOWER(correo) = LOWER($1)
       LIMIT 1`,
      [email]
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
    const passwordValido = await bcrypt.compare(password, usuario.contrasena);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Credenciales inválidas.',
        error: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    const user = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    const token = jwt.sign(user, process.env.JWT_SECRET || 'supersecreto_jwt_prediyogur', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return res.status(200).json({
      success: true,
      data: { token, user },
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
  login,
  getPerfil,
};
