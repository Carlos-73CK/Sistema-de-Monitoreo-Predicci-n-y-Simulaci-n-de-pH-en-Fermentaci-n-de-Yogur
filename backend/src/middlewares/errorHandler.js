/**
 * Re-exportación y compatibilidad hacia atrás con errorHandler.middleware.js
 */
const errorHandler = require('./errorHandler.middleware');

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
