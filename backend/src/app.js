const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { logger } = require('./middlewares/logger.middleware');
const { registerRoutes } = require('./routes');

const app = express();

// Middlewares globales de parsing y seguridad
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

/**
 * Controlador de verificación de salud del sistema.
 * Valida la operatividad del backend y la conectividad activa con PostgreSQL.
 */
const healthCheckHandler = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      service: 'PrediYogur Backend API',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      service: 'PrediYogur Backend API',
      database: 'disconnected',
      message: 'Fallo de conexión a la base de datos PostgreSQL',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Rutas de verificación de salud
app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Registro de rutas API de la aplicación (/api/auth, /api/ensayos, etc.)
registerRoutes(app);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

module.exports = app;
