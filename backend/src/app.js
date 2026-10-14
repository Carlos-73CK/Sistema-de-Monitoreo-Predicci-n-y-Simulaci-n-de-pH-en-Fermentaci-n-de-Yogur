const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { db } = require('./ai/sqliteStore');
const errorHandler = require('./middlewares/errorHandler');
const { logger } = require('./middlewares/logger.middleware');
const { registerRoutes } = require('./routes');

const app = express();

// Middlewares globales de parsing y seguridad
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Servir interfaz gráfica web estática para el prototipo
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Controlador de verificación de salud del sistema.
 * En modo prototipo local, SQLite es el motor de persistencia activo autónomo.
 */
const healthCheckHandler = async (req, res) => {
  let sqliteStatus = 'connected';
  try {
    const row = db.prepare('SELECT 1 as test').get();
    if (!row || row.test !== 1) sqliteStatus = 'warning';
  } catch (err) {
    sqliteStatus = 'error: ' + err.message;
  }

  let pgStatus = 'optional_standby (modo prototipo local activo)';
  try {
    await pool.query('SELECT 1');
    pgStatus = 'connected';
  } catch (error) {
    pgStatus = 'standby (almacenamiento local SQLite activo)';
  }

  return res.status(200).json({
    status: 'ok',
    service: 'PrediYogur Platform',
    mode: 'local_prototype_autonomous',
    databases: {
      sqlite_local: sqliteStatus,
      postgresql: pgStatus,
    },
    ai_engine: 'calibrado_r2_0.9774',
    timestamp: new Date().toISOString(),
  });
};

// Rutas de verificación de salud
app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Rutas directas para la interfaz gráfica web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
