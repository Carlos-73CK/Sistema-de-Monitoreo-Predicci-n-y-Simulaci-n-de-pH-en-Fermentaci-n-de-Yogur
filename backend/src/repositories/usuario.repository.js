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
  buscarUsuarioPorUsernameSQLite,
  buscarUsuarioPorIdentificadorSQLite,
  buscarUsuarioPorIdSQLite,
  buscarUsuarioPorResetTokenSQLite,
  guardarResetTokenSQLite,
  actualizarPasswordPorTokenSQLite,
  registrarIntentoFallidoSQLite,
  resetearIntentosFallidosSQLite,
  listarUsuariosSQLite,
} = require('../ai/sqliteStore');

/**
 * Busca un usuario por correo electrónico (búsqueda insensible a mayúsculas)
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
          `SELECT id, nombre, apellidos, username, email as correo, password_hash as contrasena, rol,
                  intentos_fallidos, bloqueado_hasta, activo, created_at as creado_en
           FROM usuarios
           WHERE LOWER(email) = LOWER($1)
           LIMIT 1`,
          [emailLimpio]
        );
        if (pgRes.rowCount > 0) {
          const pgUser = pgRes.rows[0];
          crearUsuarioSQLite({
            nombre: pgUser.nombre,
            apellidos: pgUser.apellidos,
            username: pgUser.username,
            correo: pgUser.correo,
            contrasenaHash: pgUser.contrasena,
            rol: pgUser.rol,
          });
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
 * Busca un usuario por nombre de usuario
 * @param {string} username
 */
async function buscarPorUsername(username) {
  if (!username) return null;
  const userLimpio = String(username).trim().toLowerCase();
  return buscarUsuarioPorUsernameSQLite(userLimpio);
}

/**
 * Busca un usuario por identificador (correo o username)
 * @param {string} identificador
 */
async function buscarPorIdentificador(identificador) {
  if (!identificador) return null;
  const idLimpio = String(identificador).trim().toLowerCase();
  let usuario = buscarUsuarioPorIdentificadorSQLite(idLimpio);

  if (!usuario) {
    try {
      if (pool && typeof pool.query === 'function') {
        const pgRes = await pool.query(
          `SELECT id, nombre, apellidos, username, email as correo, password_hash as contrasena, rol,
                  intentos_fallidos, bloqueado_hasta, activo, created_at as creado_en
           FROM usuarios
           WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)
           LIMIT 1`,
          [idLimpio]
        );
        if (pgRes.rowCount > 0) {
          const pgUser = pgRes.rows[0];
          crearUsuarioSQLite({
            nombre: pgUser.nombre,
            apellidos: pgUser.apellidos,
            username: pgUser.username,
            correo: pgUser.correo,
            contrasenaHash: pgUser.contrasena,
            rol: pgUser.rol,
          });
          usuario = buscarUsuarioPorIdentificadorSQLite(idLimpio);
        }
      }
    } catch (err) {}
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
          `SELECT id, nombre, apellidos, username, email as correo, rol, activo, created_at as creado_en 
           FROM usuarios WHERE id::text = $1 LIMIT 1`,
          [String(id)]
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
 * Busca un usuario por token de recuperación
 * @param {string} token
 */
async function buscarPorResetToken(token) {
  if (!token) return null;
  return buscarUsuarioPorResetTokenSQLite(token);
}

/**
 * Registra un nuevo usuario en la base de datos
 */
async function crearUsuario({ nombre, apellidos = '', username = '', email, hashedPassword, rol }) {
  const emailLimpio = String(email).trim().toLowerCase();
  const nombreLimpio = String(nombre).trim();
  const apellidosLimpio = String(apellidos).trim();
  const usernameLimpio = String(username).trim().toLowerCase();

  // 1. Guardar en SQLite
  const nuevoUsuario = crearUsuarioSQLite({
    nombre: nombreLimpio,
    apellidos: apellidosLimpio,
    username: usernameLimpio,
    correo: emailLimpio,
    contrasenaHash: hashedPassword,
    rol,
  });

  // 2. Intentar replicar en PostgreSQL / Supabase si está disponible
  try {
    if (pool && typeof pool.query === 'function') {
      await pool.query(
        `INSERT INTO usuarios (nombre, apellidos, username, email, password_hash, rol)
         VALUES ($1, $2, $3, LOWER($4), $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [nombreLimpio, apellidosLimpio, usernameLimpio, emailLimpio, hashedPassword, rol]
      );
    }
  } catch (err) {
    console.warn('[UsuarioRepo] Sincronización secundaria en standby:', err.message);
  }

  return nuevoUsuario;
}

/**
 * Guarda token de reseteo para usuario
 */
async function guardarResetToken(id, token, expiraIso) {
  guardarResetTokenSQLite(id, token, expiraIso);
  try {
    if (pool && typeof pool.query === 'function') {
      await pool.query(
        `UPDATE usuarios SET reset_token = $1, reset_token_expira = $2 WHERE id::text = $3`,
        [token, expiraIso, String(id)]
      );
    }
  } catch (err) {}
}

/**
 * Actualiza la contraseña y anula token de reseteo
 */
async function actualizarPassword(id, hashedPassword) {
  actualizarPasswordPorTokenSQLite(id, hashedPassword);
  try {
    if (pool && typeof pool.query === 'function') {
      await pool.query(
        `UPDATE usuarios 
         SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL, 
             intentos_fallidos = 0, bloqueado_hasta = NULL 
         WHERE id::text = $2`,
        [hashedPassword, String(id)]
      );
    }
  } catch (err) {}
}

/**
 * Registra un intento fallido (incrementa intentos y bloquea temporalmente si >= 5)
 */
function registrarIntentoFallido(id) {
  return registrarIntentoFallidoSQLite(id);
}

/**
 * Resetea intentos fallidos y bloqueo tras autenticación correcta
 */
function resetearIntentosFallidos(id) {
  resetearIntentosFallidosSQLite(id);
}

/**
 * Lista todos los usuarios registrados
 */
function listarTodos() {
  return listarUsuariosSQLite();
}

module.exports = {
  buscarPorEmail,
  buscarPorUsername,
  buscarPorIdentificador,
  buscarPorId,
  buscarPorResetToken,
  crearUsuario,
  guardarResetToken,
  actualizarPassword,
  registrarIntentoFallido,
  resetearIntentosFallidos,
  listarTodos,
};
