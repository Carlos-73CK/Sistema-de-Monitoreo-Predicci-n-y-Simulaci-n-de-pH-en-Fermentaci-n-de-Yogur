/**
 * Middleware centralizado de manejo de errores de Express para PrediYogur.
 * Captura excepciones no controladas en el ciclo de solicitud y responde
 * con formato JSON estandarizado: { status: 'error', message: err.message }.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const isProduction = process.env.NODE_ENV === 'production';
  const responseBody = {
    status: 'error',
    message: isProduction && statusCode === 500
      ? 'Error interno del servidor. Por favor, contacte al administrador.'
      : (err.message || 'Error interno del servidor'),
  };

  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
