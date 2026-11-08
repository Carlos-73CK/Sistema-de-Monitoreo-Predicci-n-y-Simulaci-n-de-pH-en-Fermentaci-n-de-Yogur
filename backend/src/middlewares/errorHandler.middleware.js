/**
 * Middleware centralizado de manejo de errores de Express para PrediYogur.
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Captura excepciones no controladas en el ciclo de solicitud y responde
 * con formato JSON estandarizado: { success: false, status: 'error', message: err.message }.
 */

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const isProduction = process.env.NODE_ENV === 'production';
  const responseBody = {
    success: false,
    status: 'error',
    message: isProduction && statusCode === 500
      ? 'Error interno del servidor. Por favor, contacte al administrador.'
      : (err.message || 'Error interno del servidor'),
    error: err.errorCode || 'INTERNAL_SERVER_ERROR',
  };

  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
