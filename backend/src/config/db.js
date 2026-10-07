const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuración del Pool de conexiones de PostgreSQL para PrediYogur.
 * Administra conexiones concurrentes de manera eficiente y maneja eventos globales.
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'prediyogur_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Manejo del evento cuando un cliente nuevo se conecta al pool
pool.on('connect', () => {
  console.log('🔌 Cliente conectado exitosamente al pool de PostgreSQL');
});

// Manejo de errores inesperados en clientes inactivos del pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en cliente inactivo del pool PostgreSQL:', err.message);
});

// Soporte para importación directa o desestructuración
pool.pool = pool;
pool.query = pool.query.bind(pool);

module.exports = pool;
