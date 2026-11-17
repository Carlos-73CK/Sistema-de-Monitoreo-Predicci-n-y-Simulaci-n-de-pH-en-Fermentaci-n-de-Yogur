/**
 * Módulo Centralizado de Conexión a Neon PostgreSQL — PrediYogur
 * Cátedra de Química de Alimentos y Maestría en Alimentos (ULEAM)
 *
 * Características:
 * - Instancia única centralizada de pg.Pool (sin pools duplicados).
 * - Soporte prioritario de DATABASE_URL con SSL obligatorio para Neon PostgreSQL.
 * - Prevención de conexiones innecesarias cuando no existen credenciales válidas configuradas.
 * - Consultas parametrizadas seguras contra inyección SQL.
 * - Soporte de transacciones atómicas (BEGIN / COMMIT / ROLLBACK) con liberación garantizada.
 * - Diagnóstico explícito de errores de conexión (sin caídas silenciosas).
 */

const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Cargar variables de entorno exclusivamente desde backend/.env si existe
const envFilePath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  dotenv.config();
}

/**
 * Determina si una cadena de conexión o contraseña es un valor de plantilla (.env.example)
 * @param {string} valor
 * @returns {boolean}
 */
function esValorPlaceholder(valor) {
  if (!valor || typeof valor !== 'string') return true;
  const v = valor.trim();
  if (!v) return true;
  const patronesPlaceholder = [
    'USUARIO:CONTRASENA',
    'REEMPLAZAR_CON_CONTRASENA',
    'TU_CONTRASENA',
    'YOUR_PASSWORD',
    '<PASSWORD>',
  ];
  return patronesPlaceholder.some((p) => v.toUpperCase().includes(p));
}

/**
 * Verifica si el entorno dispone de credenciales configuradas para intentar conexión a PostgreSQL/Neon
 * @returns {boolean}
 */
function isNeonConfigured() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !esValorPlaceholder(dbUrl)) {
    return true;
  }
  const host = process.env.DB_HOST;
  const pass = process.env.DB_PASSWORD;
  if (host && pass && !esValorPlaceholder(pass) && pass !== 'secret') {
    return true;
  }
  return false;
}

/**
 * Construye la configuración del Pool de PostgreSQL / Neon a partir de las variables de entorno
 */
function buildPoolConfig() {
  const max = parseInt(process.env.DB_POOL_MAX, 10) || 10;
  const idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000;
  const connectionTimeoutMillis = parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000;

  const databaseUrl = process.env.DATABASE_URL;
  const usarUrl = Boolean(databaseUrl && !esValorPlaceholder(databaseUrl));
  const host = process.env.DB_HOST || 'ep-small-salad-bdlzp55d-pooler.c-8.us-east-2.aws.neon.tech';

  const requiereSsl =
    String(process.env.DB_SSL).toLowerCase() === 'true' ||
    (usarUrl && (databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech'))) ||
    host.includes('neon.tech');

  const sslConfig = requiereSsl ? { rejectUnauthorized: false } : false;

  if (usarUrl) {
    return {
      connectionString: databaseUrl.trim(),
      ssl: sslConfig,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  return {
    host,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'neondb',
    user: process.env.DB_USER || 'neondb_owner',
    password: process.env.DB_PASSWORD || '',
    ssl: sslConfig,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

const poolConfig = buildPoolConfig();
const pool = new Pool(poolConfig);

// Estado interno de disponibilidad para evitar bloqueos repetitivos cuando Neon no está configurado
let estadoConexion = {
  configurado: isNeonConfigured(),
  disponible: false,
  ultimaVerificacionMs: 0,
  ultimoError: isNeonConfigured()
    ? null
    : 'Credenciales de Neon PostgreSQL no configuradas en backend/.env (operando con SQLite local autónomo).',
  datosServidor: null,
};

const REINTENTO_COOLDOWN_MS = 15000;

pool.on('connect', () => {
  estadoConexion.disponible = true;
  estadoConexion.ultimoError = null;
});

pool.on('error', (err) => {
  estadoConexion.disponible = false;
  estadoConexion.ultimoError = err.message;
  console.error('⚠️ [Neon PostgreSQL Pool] Error en cliente inactivo del pool:', err.message);
});

const rawPoolQuery = pool.query.bind(pool);

/**
 * Ejecuta una consulta SQL parametrizada de forma segura.
 * Si las credenciales de Neon no están configuradas o el servidor no está accesible,
 * registra explícitamente la causa y lanza un error controlado para activar el fallback documentado a SQLite.
 *
 * @param {string|Object} text - Consulta SQL parametrizada ($1, $2, ...)
 * @param {Array} [params] - Arreglo de parámetros
 */
async function query(text, params) {
  estadoConexion.configurado = isNeonConfigured();

  if (!estadoConexion.configurado) {
    const err = new Error(
      'Conexión a Neon PostgreSQL omitida: DATABASE_URL no está configurada con credenciales reales en backend/.env. Fallback activo a SQLite local.'
    );
    err.code = 'NEON_NOT_CONFIGURED';
    estadoConexion.ultimoError = err.message;
    throw err;
  }

  const ahora = Date.now();
  if (!estadoConexion.disponible && estadoConexion.ultimaVerificacionMs > 0 && (ahora - estadoConexion.ultimaVerificacionMs) < REINTENTO_COOLDOWN_MS) {
    const err = new Error(
      `Neon PostgreSQL temporalmente inaccesible (en enfriamiento de reintento): ${estadoConexion.ultimoError}`
    );
    err.code = 'NEON_COOLDOWN';
    throw err;
  }

  try {
    const res = await rawPoolQuery(text, params);
    estadoConexion.disponible = true;
    estadoConexion.ultimaVerificacionMs = Date.now();
    estadoConexion.ultimoError = null;
    return res;
  } catch (err) {
    // Si es un error de red/autenticación/conexión, actualizar estado de disponibilidad
    const codigosConexion = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '28P01', '3D000', '08006', '08001', '57P01'];
    if (
      codigosConexion.includes(err.code) ||
      /connect|timeout|authentication|password|ENOTFOUND|ECONNREFUSED/i.test(err.message)
    ) {
      estadoConexion.disponible = false;
      estadoConexion.ultimaVerificacionMs = Date.now();
      estadoConexion.ultimoError = err.message;
      console.warn(`⚠️ [Neon PostgreSQL] Fallo de conexión (${err.code || 'NET_ERR'}): ${err.message}. Activando fallback a SQLite.`);
    } else {
      console.warn(`⚠️ [Neon PostgreSQL] Error en consulta SQL (${err.code || 'SQL_ERR'}): ${err.message}`);
    }
    throw err;
  }
}

/**
 * Ejecuta múltiples operaciones dentro de una transacción atómica (BEGIN / COMMIT / ROLLBACK)
 * liberando siempre el cliente de vuelta al pool.
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  if (!isNeonConfigured()) {
    const err = new Error('Transacción PostgreSQL omitida: DATABASE_URL no configurada en backend/.env.');
    err.code = 'NEON_NOT_CONFIGURED';
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    estadoConexion.disponible = true;
    return resultado;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('❌ [Neon PostgreSQL] Error al ejecutar ROLLBACK:', rbErr.message);
    }
    console.warn(`⚠️ [Neon PostgreSQL] Transacción revertida: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Ejecuta la consulta oficial de prueba y diagnóstico en Neon PostgreSQL (Sección 4)
 */
async function probarConexionNeon() {
  estadoConexion.configurado = isNeonConfigured();
  if (!estadoConexion.configurado) {
    return {
      conectado: false,
      configurado: false,
      mensaje: 'DATABASE_URL no configurada o contiene valores de ejemplo en backend/.env.',
      detalle: null,
    };
  }

  let client;
  try {
    client = await pool.connect();
    const res = await client.query(`
      SELECT
          NOW() AS fecha_servidor,
          current_database() AS base_datos,
          current_user AS usuario_actual,
          version() AS version_postgresql;
    `);
    const fila = res.rows[0] || null;
    estadoConexion.disponible = true;
    estadoConexion.ultimaVerificacionMs = Date.now();
    estadoConexion.ultimoError = null;
    estadoConexion.datosServidor = fila;

    return {
      conectado: true,
      configurado: true,
      mensaje: 'Conexión exitosa con Neon PostgreSQL (SSL activo).',
      detalle: fila,
    };
  } catch (err) {
    estadoConexion.disponible = false;
    estadoConexion.ultimaVerificacionMs = Date.now();
    estadoConexion.ultimoError = err.message;
    return {
      conectado: false,
      configurado: true,
      mensaje: `No fue posible conectar a Neon PostgreSQL: ${err.message}`,
      codigoError: err.code || 'CONNECTION_ERROR',
      detalle: null,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Retorna el estado actual de la conexión central sin exponer secretos ni contraseñas
 */
function obtenerEstadoConexion() {
  return {
    proveedor: 'Neon Serverless PostgreSQL',
    hostReferencia: process.env.DB_HOST || 'ep-small-salad-bdlzp55d-pooler.c-8.us-east-2.aws.neon.tech',
    baseDatos: process.env.DB_NAME || 'neondb',
    usuario: process.env.DB_USER || 'neondb_owner',
    sslActivo: Boolean(poolConfig.ssl),
    configurado: isNeonConfigured(),
    disponible: estadoConexion.disponible,
    ultimoError: estadoConexion.ultimoError,
    datosServidor: estadoConexion.datosServidor,
  };
}

/**
 * Cierra de forma controlada el pool de conexiones de PostgreSQL
 */
let poolCerrado = false;
async function cerrarPool() {
  if (poolCerrado) return;
  poolCerrado = true;
  try {
    await pool.end();
    estadoConexion.disponible = false;
  } catch (err) {
    console.error('❌ [Neon PostgreSQL] Error al cerrar el pool:', err.message);
  }
}

// Exponer interfaz compatible tanto con uso directo `pool.query(...)` como con importación desestructurada
pool.pool = pool;
pool.query = query;
pool.rawQuery = rawPoolQuery;
pool.withTransaction = withTransaction;
pool.probarConexionNeon = probarConexionNeon;
pool.obtenerEstadoConexion = obtenerEstadoConexion;
pool.isNeonConfigured = isNeonConfigured;
pool.cerrarPool = cerrarPool;

module.exports = pool;
