/**
 * Controlador de Autenticación y Autorización — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Controlador HTTP desacoplado: gestiona únicamente el ciclo de petición y respuesta (req, res, status codes)
 * y delega toda la lógica de validación, bcrypt y JWT a auth.service.js.
 */

const { authService } = require('../services');

/**
 * Registra un nuevo usuario en el sistema
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const register = async (req, res, next) => {
  try {
    const resultado = await authService.registrarUsuario(req.body || {});
    return res.status(201).json({
      success: true,
      data: {
        token: resultado.token,
        user: resultado.user,
      },
      message: resultado.message,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Autentica un usuario y retorna un token JWT firmado
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const login = async (req, res, next) => {
  try {
    const { email, username, identificador, password } = req.body || {};
    const resultado = await authService.autenticarUsuario({
      identificador: identificador || email || username,
      password,
    });
    return res.status(200).json({
      success: true,
      data: {
        token: resultado.token,
        user: resultado.user,
      },
      message: resultado.message,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Solicita enlace o token de recuperación de contraseña
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email, identificador } = req.body || {};
    const resultado = await authService.solicitarRecuperacionPassword(email || identificador);
    return res.status(200).json({
      success: true,
      data: resultado.dev_token ? { dev_token: resultado.dev_token } : null,
      message: resultado.message,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Restablece la contraseña mediante token temporal
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body || {};
    const resultado = await authService.restablecerPasswordConToken({
      token,
      password,
      confirmPassword,
    });
    return res.status(200).json({
      success: true,
      data: null,
      message: resultado.message,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Retorna el perfil del usuario autenticado a partir de su token Bearer
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
 * Retorna la lista de usuarios precalibrados para propósitos pedagógicos y switch rápido de perfil
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
const getUsuariosDisponibles = (_req, res, next) => {
  try {
    const usuarios = authService.listarUsuarios();
    return res.status(200).json({
      success: true,
      data: {
        total: usuarios.length,
        usuarios,
      },
      message: 'Lista de usuarios disponibles recuperada con éxito.',
      error: null,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getPerfil,
  getUsuariosDisponibles,
};
