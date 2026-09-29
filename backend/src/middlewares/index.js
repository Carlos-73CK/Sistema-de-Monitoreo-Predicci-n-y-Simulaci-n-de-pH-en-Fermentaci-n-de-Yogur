const { errorHandler } = require('./errorHandler.middleware');
const { logger } = require('./logger.middleware');
const { validateCreateEnsayo } = require('./validateEnsayo.middleware');

module.exports = {
  errorHandler,
  logger,
  validateCreateEnsayo,
};
