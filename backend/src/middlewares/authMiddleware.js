const jwt = require('jsonwebtoken');

/**
 * Middleware de Autenticación JWT.
 * Valida la cabecera Authorization: Bearer <token>, decodifica el token
 * y adjunta el payload del usuario en req.user.
 * En caso de ausencia o token inválido, responde inmediatamente con HTTP 401.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      message: 'Acceso no autorizado: Token no proporcionado',
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Acceso no autorizado: Formato de cabecera inválido (debe ser Bearer <token>)',
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Acceso no autorizado: Token no proporcionado',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'supersecreto_jwt_prediyogur';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Acceso no autorizado: Token inválido o expirado',
    });
  }
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
