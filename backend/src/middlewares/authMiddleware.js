/**
 * Re-exportación y compatibilidad hacia atrás con auth.middleware.js
 */
const { authenticateToken, requireRole } = require('./auth.middleware');

const authMiddleware = authenticateToken;

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.authenticateToken = authenticateToken;
module.exports.requireRole = requireRole;
