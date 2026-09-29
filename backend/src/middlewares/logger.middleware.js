/**
 * Middleware de logging básico para solicitudes HTTP entrantes.
 * Registra timestamp, método HTTP, URL, código de estado y tiempo de respuesta en milisegundos.
 */
const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    console.log(`[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = {
  logger,
};
