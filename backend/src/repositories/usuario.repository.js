/**
 * Repositorio de Usuarios — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Capa de Acceso a Datos (DAL) desacoplada:
 * - Persistencia primaria en SQLite autónomo (modo local confiable).
 * - Preparado para sincronización transparente con PostgreSQL / Supabase mediante variable de entorno.
 */

const pool = require('../config/db');
const {
  crearUsuarioSQLite,
  buscarUsuarioPorEmailSQLite,
  buscarUsuarioPorIdSQLite,
  listarUsuariosSQLite,
} = require('../ai/sqliteStore');

/**
 * Busca un usuario por su correo electrónico (búsqueda insensible a mayúsculas)
 * @param {string} email
 */
async function buscarPorEmail(email) {
  if (!email) return null;
  const emailLimpio = String(email).trim().toLowerCase();

  // 1. Consulta en SQLite (motor primario activo)
  let usuario = buscarUsuarioPorEmailSQLite(emailLimpio);

  // 2. Si no existe en SQLite, intentar fallback a PostgreSQL / Supabase
  if (!usuario) {
    try {
      if (pool && typeof pool.query === 'function') {
        const pgRes = await pool.query(
          `SELECT id, nombre, email as correo, password_hash as contrasena, rol, creado_en
           FROM usuarios
           WHERE LOWER(email) = LOWER($1) OR LOWER(correo) = LOWER($1)
           LIMIT 1`,
          [emailLimpio]
        );
        if (pgRes.rowCount > 0) {
          const pgUser = pgRes.rows[0];
          crearUsuarioSQLite(pgUser.nombre, pgUser.correo, pgUser.contrasena, pgUser.rol);
          usuario = buscarUsuarioPorEmailSQLite(emailLimpio);
        }
      }
    } catch (err) {
      // PostgreSQL / Supabase en standby (silencioso)
    }
  }

  return usuario;
}

/**
 * Busca un usuario por su ID numérico
 * @param {number|string} id
 */
async function buscarPorId(id) {
  if (!id) return null;
  const idNum = Number(id);

  let usuario = buscarUsuarioPorIdSQLite(idNum);
  if (!usuario) {
    try {
      if (pool && typeof pool.query === 'function') {
        const pgRes = await pool.query(
          `SELECT id, nombre, email as correo, rol, creado_en FROM usuarios WHERE id = $1 LIMIT 1`,
          [idNum]
        );
        if (pgRes.rowCount > 0) {
          usuario = pgRes.rows[0];
        }
      }
    } catch (err) {}
  }

  return usuario;
}

/**
 * Registra un nuevo usuario en la base de datos
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.email
 * @param {string} datos.hashedPassword
 * @param {string} datos.rol
 */
async function crearUsuario({ nombre, email, hashedPassword, rol }) {
  const emailLimpio = String(email).trim().toLowerCase();
  const nombreLimpio = String(nombre).trim();

  // 1. Guardar en SQLite
  const nuevoUsuario = crearUsuarioSQLite(nombreLimpio, emailLimpio, hashedPassword, rol);

  // 2. Intentar replicar en PostgreSQL / Supabase si está disponible
  try {
    if (pool && typeof pool.query === 'function') {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol)
         VALUES ($1, LOWER($2), $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [nombreLimpio, emailLimpio, hashedPassword, rol]
      );
    }
  } catch (err) {
    console.warn('[UsuarioRepo] Sincronización secundaria en standby:', err.message);
  }

  return nuevoUsuario;
}

/**
 * Lista todos los usuarios registrados
 */
function listarTodos() {
  return listarUsuariosSQLite();
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  crearUsuario,
  listarTodos,
};
