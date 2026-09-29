const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prediyogur_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  // Conexión cliente establecida en el pool
});

pool.on('error', (err) => {
  console.error('Error inesperado en cliente inactivo del pool PostgreSQL:', err.message);
});

// Soporte para importación directa del pool o desestructuración { pool, query }
pool.pool = pool;
pool.query = pool.query.bind(pool);

module.exports = pool;
