/**
 * Índice Central de Middlewares — PrediYogur Backend
 * Cátedra de Química de Alimentos (ULEAM)
 */

const { errorHandler } = require('./errorHandler.middleware');
const { authenticateToken, requireRole } = require('./auth.middleware');
const { logger } = require('./logger.middleware');
const { validateCreateEnsayo } = require('./validateEnsayo.middleware');

module.exports = {
  errorHandler,
  authenticateToken,
  requireRole,
  logger,
  validateCreateEnsayo,
  // Compatibilidad hacia atrás:
  authMiddleware: authenticateToken,
};
