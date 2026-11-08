const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');
const pool = require('./config/db');
const { db } = require('./ai/sqliteStore');
const { errorHandler, logger } = require('./middlewares');
const { registerRoutes } = require('./routes');

const app = express();

// Middlewares globales de parsing y seguridad
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Directorio de la aplicación Web Universal (React Native Web)
const publicDir = fs.existsSync(path.resolve(__dirname, 'public', 'index.html'))
  ? path.resolve(__dirname, 'public')
  : path.resolve(__dirname, '../../mobile/dist');

app.use(express.static(publicDir));

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
    frontend: 'React Native Universal Web (modular)',
    documentation: 'GET /api/docs (Swagger UI)',
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

// Documentación interactiva de la API con Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Registro de rutas API de la aplicación (/api/auth, /api/ensayos, /api/ai)
registerRoutes(app);

// Enrutamiento SPA para React Native Web (cualquier ruta que no empiece con /api o /health)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return next();
});

// Manejo de rutas inexistentes de API (404)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

module.exports = app;
