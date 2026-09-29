const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { logger } = require('./middlewares/logger.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const { registerRoutes } = require('./routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Endpoint utilitario de salud del sistema (valida conexión a PostgreSQL)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      db: 'connected',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: 'Fallo de conexión a la base de datos PostgreSQL',
      error: error.message,
    });
  }
});

// Registro de rutas API (definidas por el encargado de API)
registerRoutes(app);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware global de captura de errores
app.use(errorHandler);

module.exports = app;
