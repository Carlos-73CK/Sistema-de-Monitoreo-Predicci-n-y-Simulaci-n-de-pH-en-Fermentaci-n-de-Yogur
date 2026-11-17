/**
 * Repositorio de Usuarios — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 *
 * Capa de Acceso a Datos (DAL) Híbrida:
 * - Persistencia local garantizada en SQLite autónomo (`offline-first`).
 * - Sincronización parametrizada y transaccional con Neon PostgreSQL cuando `DATABASE_URL` está configurada.
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
  registrarAuditoriaSQLite,
  registrarSincronizacionSQLite,
} = require('../ai/sqliteStore');

/**
 * Busca un usuario por correo electrónico (insensible a mayúsculas)
 * @param {string} email
 */
async function buscarPorEmail(email) {
  if (!email) return null;
  const emailLimpio = String(email).trim().toLowerCase();

  let usuario = buscarUsuarioPorEmailSQLite(emailLimpio);

  if (!usuario && pool.isNeonConfigured()) {
    try {
      const pgRes = await pool.query(
        `SELECT id, sqlite_id, nombre, apellidos, username, email AS correo, password_hash AS contrasena,
                rol, estado_cuenta, intentos_fallidos, bloqueado_hasta, activo, created_at AS creado_en
         FROM usuarios
         WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
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
    } catch (err) {
      console.warn(`[UsuarioRepo] Fallback a SQLite en buscarPorEmail(${emailLimpio}): ${err.message}`);
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

  if (!usuario && pool.isNeonConfigured()) {
    try {
      const pgRes = await pool.query(
        `SELECT id, sqlite_id, nombre, apellidos, username, email AS correo, password_hash AS contrasena,
                rol, estado_cuenta, intentos_fallidos, bloqueado_hasta, activo, created_at AS creado_en
         FROM usuarios
         WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1))
           AND deleted_at IS NULL
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
    } catch (err) {
      console.warn(`[UsuarioRepo] Fallback a SQLite en buscarPorIdentificador(${idLimpio}): ${err.message}`);
    }
  }

  return usuario;
}

/**
 * Busca un usuario por su ID numérico o UUID
 * @param {number|string} id
 */
async function buscarPorId(id) {
  if (!id) return null;
  const idNum = Number(id);

  let usuario = !Number.isNaN(idNum) ? buscarUsuarioPorIdSQLite(idNum) : null;
  if (!usuario && pool.isNeonConfigured()) {
    try {
      const pgRes = await pool.query(
        `SELECT id, nombre, apellidos, username, email AS correo, rol, estado_cuenta, activo, created_at AS creado_en
         FROM usuarios
         WHERE (id::text = $1 OR sqlite_id::text = $1) AND deleted_at IS NULL
         LIMIT 1`,
        [String(id)]
      );
      if (pgRes.rowCount > 0) {
        usuario = pgRes.rows[0];
      }
    } catch (err) {
      console.warn(`[UsuarioRepo] Fallback a SQLite en buscarPorId(${id}): ${err.message}`);
    }
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
 * Registra un nuevo usuario en SQLite y lo sincroniza transaccionalmente con Neon PostgreSQL
 */
async function crearUsuario({ nombre, apellidos = '', username = '', email, hashedPassword, rol }) {
  const emailLimpio = String(email).trim().toLowerCase();
  const nombreLimpio = String(nombre).trim();
  const apellidosLimpio = String(apellidos).trim();
  const usernameLimpio = String(username).trim().toLowerCase();

  // 1. Guardar en SQLite local
  const nuevoUsuario = crearUsuarioSQLite({
    nombre: nombreLimpio,
    apellidos: apellidosLimpio,
    username: usernameLimpio,
    correo: emailLimpio,
    contrasenaHash: hashedPassword,
    rol,
  });

  registrarAuditoriaSQLite({
    usuarioId: nuevoUsuario.id,
    usuarioEmail: emailLimpio,
    accion: 'REGISTRO_USUARIO',
    entidadAfectada: 'usuarios',
    registroAfectadoId: emailLimpio,
    datosPosteriores: {
      id: nuevoUsuario.id,
      nombre: nombreLimpio,
      apellidos: apellidosLimpio,
      username: usernameLimpio,
      email: emailLimpio,
      rol,
    },
  });

  // 2. Replicar en Neon PostgreSQL si está configurado
  if (pool.isNeonConfigured()) {
    try {
      const pgRes = await pool.withTransaction(async (client) => {
        const r = await client.query(
          `INSERT INTO usuarios (sqlite_id, nombre, apellidos, username, email, password_hash, rol, estado_cuenta, activo)
           VALUES ($1, $2, $3, $4, LOWER($5), $6, $7, 'activo', TRUE)
           ON CONFLICT (email) DO UPDATE SET
             sqlite_id = EXCLUDED.sqlite_id,
             nombre = EXCLUDED.nombre,
             apellidos = EXCLUDED.apellidos,
             username = EXCLUDED.username,
             rol = EXCLUDED.rol,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [nuevoUsuario.id, nombreLimpio, apellidosLimpio, usernameLimpio, emailLimpio, hashedPassword, rol]
        );

        await client.query(
          `INSERT INTO auditoria_operaciones (usuario_id, usuario_email, accion, entidad_afectada, registro_afectado_id, datos_posteriores)
           VALUES ($1, $2, 'REGISTRO_USUARIO', 'usuarios', $3, $4::jsonb)`,
          [
            r.rows[0]?.id || null,
            emailLimpio,
            emailLimpio,
            JSON.stringify({ nombre: nombreLimpio, username: usernameLimpio, email: emailLimpio, rol }),
          ]
        );
        return r.rows[0];
      });

      registrarSincronizacionSQLite({
        entidad: 'usuarios',
        claveUnica: emailLimpio,
        sqliteId: nuevoUsuario.id,
        neonUuid: pgRes?.id || null,
        operacion: 'UPSERT',
        estado: 'SINCRONIZADO',
      });
    } catch (err) {
      console.warn(`[UsuarioRepo] Sincronización con Neon pendiente para usuario '${emailLimpio}': ${err.message}`);
      registrarSincronizacionSQLite({
        entidad: 'usuarios',
        claveUnica: emailLimpio,
        sqliteId: nuevoUsuario.id,
        operacion: 'INSERT',
        estado: 'PENDIENTE',
        detalleError: err.message,
      });
    }
  }

  return nuevoUsuario;
}

/**
 * Guarda token de reseteo para usuario
 */
async function guardarResetToken(id, token, expiraIso) {
  guardarResetTokenSQLite(id, token, expiraIso);
  if (pool.isNeonConfigured()) {
    try {
      await pool.query(
        `UPDATE usuarios SET reset_token = $1, reset_token_expira = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $3 OR sqlite_id::text = $3`,
        [token, expiraIso, String(id)]
      );
    } catch (err) {
      console.warn(`[UsuarioRepo] Fallback a SQLite en guardarResetToken: ${err.message}`);
    }
  }
}

/**
 * Actualiza la contraseña y anula token de reseteo
 */
async function actualizarPassword(id, hashedPassword) {
  actualizarPasswordPorTokenSQLite(id, hashedPassword);
  if (pool.isNeonConfigured()) {
    try {
      await pool.query(
        `UPDATE usuarios
         SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL,
             intentos_fallidos = 0, bloqueado_hasta = NULL, estado_cuenta = 'activo',
             updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $2 OR sqlite_id::text = $2`,
        [hashedPassword, String(id)]
      );
    } catch (err) {
      console.warn(`[UsuarioRepo] Fallback a SQLite en actualizarPassword: ${err.message}`);
    }
  }
}

/**
 * Registra un intento fallido (incrementa intentos y bloquea temporalmente si >= 5)
 */
function registrarIntentoFallido(id, usuarioEmail = null) {
  const res = registrarIntentoFallidoSQLite(id);
  registrarAuditoriaSQLite({
    usuarioId: id,
    usuarioEmail,
    accion: 'LOGIN_FALLIDO',
    entidadAfectada: 'usuarios',
    registroAfectadoId: String(usuarioEmail || id),
    datosPosteriores: {
      intentos_fallidos: res?.intentos_fallidos || 1,
      bloqueado_hasta: res?.bloqueado_hasta || null,
    },
  });
  return res;
}

/**
 * Resetea intentos fallidos y registra el último acceso tras autenticación correcta
 */
function resetearIntentosFallidos(id, usuarioEmail = null) {
  resetearIntentosFallidosSQLite(id);
  registrarAuditoriaSQLite({
    usuarioId: id,
    usuarioEmail,
    accion: 'LOGIN',
    entidadAfectada: 'usuarios',
    registroAfectadoId: String(usuarioEmail || id),
    datosPosteriores: { login_exitoso: true },
  });

  if (pool.isNeonConfigured()) {
    pool.query(
      `UPDATE usuarios
       SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = CURRENT_TIMESTAMP
       WHERE sqlite_id::text = $1 OR LOWER(email) = LOWER($2)`,
      [String(id), String(usuarioEmail || '')]
    ).catch((err) => {
      console.warn(`[UsuarioRepo] Aviso al actualizar ultimo_acceso en Neon: ${err.message}`);
    });
  }
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
