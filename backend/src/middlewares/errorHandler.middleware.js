/**
 * Middleware global de captura y manejo de errores.
 * Captura excepciones no controladas y devuelve una respuesta estructurada en formato JSON.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? 'InternalServerError' : (err.stack || err.toString()),
  });
};

module.exports = {
  errorHandler,
};
