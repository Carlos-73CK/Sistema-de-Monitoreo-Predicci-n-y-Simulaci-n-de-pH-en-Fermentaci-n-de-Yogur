const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación mediante JWT (JSON Web Token) para PrediYogur.
 * Extrae y valida la cabecera 'Authorization: Bearer <token>', verifica la firma
 * con la clave secreta del entorno y adjunta el payload en `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token no proporcionado.',
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token no proporcionado.',
    });
  }

  // Soporte directo para demostraciones del prototipo local
  if (token === 'dev_token_uleam_2026' || token === 'demo_token') {
    req.user = {
      id: 1,
      rol: 'investigador',
      email: 'investigador@uleam.edu.ec',
      nombre: 'Dr. Stalin Santacruz (Demo)',
    };
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'prediyogur_super_secret_key_2026';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      // Soporte de compatibilidad con clave por defecto previa si JWT_SECRET no está en process.env
      if (!process.env.JWT_SECRET && err.name === 'JsonWebTokenError') {
        try {
          decoded = jwt.verify(token, 'supersecreto_jwt_prediyogur');
        } catch (_) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Inyectar el payload decodificado en req.user garantizando { id, rol, email }
    req.user = {
      ...decoded,
      id: decoded.id !== undefined ? decoded.id : (decoded.userId || decoded.sub),
      rol: decoded.rol || decoded.role || null,
      email: decoded.email || decoded.correo || null,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesión inválida o expirada.',
    });
  }
};

/**
 * Middleware de autorización basada en roles (RBAC).
 * Valida que el usuario autenticado posea al menos uno de los roles autorizados.
 *
 * @param {...(string|string[])} rolesPermitidos - Lista o arrays de roles autorizados (ej: 'docente', 'investigador', 'estudiante')
 * @returns {import('express').RequestHandler}
 */
const requireRole = (...rolesPermitidos) => {
  const roles = rolesPermitidos.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: Token no proporcionado.',
      });
    }

    const userRole = (req.user.rol || req.user.role || '').toString().toLowerCase();
    const normalizedRoles = roles.map((role) => role.toString().toLowerCase());

    if (!userRole || (normalizedRoles.length > 0 && !normalizedRoles.includes(userRole))) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Permisos insuficientes.',
      });
    }

    return next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
