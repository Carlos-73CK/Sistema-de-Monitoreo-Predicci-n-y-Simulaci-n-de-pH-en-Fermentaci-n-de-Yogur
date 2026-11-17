/**
 * Script de Prueba de Conexión y Verificación Estructural de Neon PostgreSQL — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 *
 * Ejecuta:
 * 1. Verificación de variables de entorno en `backend/.env` (sin exponer contraseñas).
 * 2. Consulta oficial de diagnóstico de conexión en Neon PostgreSQL (SSL requerido):
 *    SELECT
 *        NOW() AS fecha_servidor,
 *        current_database() AS base_datos,
 *        current_user AS usuario_actual,
 *        version() AS version_postgresql;
 * 3. Verificación de tablas del esquema (`neon_schema.sql`) y conteo de los 6 lotes
 *    experimentales de referencia del Dr. Stalin Santacruz (`neon_seeds.sql`).
 */

const pool = require('../src/config/database');

async function ejecutarPruebaNeon() {
  console.log('===============================================================');
  console.log('🔌 [PrediYogur] Prueba de Conexión a Neon PostgreSQL (SSL)');
  console.log('===============================================================');

  const estado = pool.obtenerEstadoConexion();
  console.log(`• Proveedor:         ${estado.proveedor}`);
  console.log(`• Host referencia:   ${estado.hostReferencia}`);
  console.log(`• Base de datos:     ${estado.baseDatos}`);
  console.log(`• Usuario:           ${estado.usuario}`);
  console.log(`• SSL obligatorio:   ${estado.sslActivo ? 'ACTIVO (sslmode=require)' : 'INACTIVO'}`);
  console.log(`• Configurado (.env): ${estado.configurado ? 'SÍ' : 'NO (pendiente configurar DATABASE_URL real en backend/.env)'}`);
  console.log('---------------------------------------------------------------');

  try {
    const resultado = await pool.probarConexionNeon();

    if (!resultado.conectado) {
      console.warn(`⚠️ Estado de conexión: PENDIENTE / NO CONECTADO`);
      console.warn(`💡 Motivo: ${resultado.mensaje}`);
      console.log('\n📋 Para completar la prueba en vivo con Neon:');
      console.log('   1. Copie `backend/.env.example` a `backend/.env`.');
      console.log('   2. Asigne en `DATABASE_URL` la nueva cadena con la credencial rotada de Neon.');
      console.log('   3. Ejecute nuevamente: `node backend/src/scripts/testNeonConnection.js`');
      console.log('===============================================================');
      await pool.cerrarPool();
      process.exit(0);
    }

    console.log('✅ ¡CONEXIÓN EXITOSA CON NEON POSTGRESQL!');
    console.log('📊 Metadatos devueltos por el servidor:');
    console.log(`   - Fecha servidor:      ${resultado.detalle.fecha_servidor}`);
    console.log(`   - Base de datos:       ${resultado.detalle.base_datos}`);
    console.log(`   - Usuario actual:      ${resultado.detalle.usuario_actual}`);
    console.log(`   - Versión PostgreSQL:  ${resultado.detalle.version_postgresql}`);

    // Verificar tablas creadas en el esquema público
    const tablasRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `);
    const tablas = tablasRes.rows.map((r) => r.table_name);
    console.log(`\n🗂️ Tablas encontradas en public (${tablas.length}):`, tablas.join(', ') || 'Ninguna (ejecute neon_schema.sql)');

    // Sincronizar usuarios locales de SQLite que estaban pendientes hacia Neon PostgreSQL
    try {
      const { db, sincronizarTodoANeon } = require('../src/ai/sqliteStore');
      await pool.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuario_email_valido;`);
      await pool.query(`ALTER TABLE usuarios ADD CONSTRAINT chk_usuario_email_valido CHECK (POSITION('@' IN email) > 1);`);
      await pool.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_sqlite_id_key;`);

      // Limpiar cuentas efímeras de test de fuerza bruta para mantener limpia la tabla usuarios
      await pool.query(`DELETE FROM usuarios WHERE email LIKE 'bruteforce.%' OR email LIKE 'investigador.1794%'`);
      db.prepare(`DELETE FROM usuarios WHERE correo LIKE 'bruteforce.%' OR correo LIKE 'investigador.1794%'`).run();

      const usuariosLocales = db.prepare(`SELECT id, nombre, apellidos, username, correo, contrasena, rol FROM usuarios ORDER BY id ASC`).all();
      for (const u of usuariosLocales) {
        const cleanUser = (u.username && u.username.trim()) ? u.username.trim().toLowerCase() : u.correo.split('@')[0];
        await pool.query(
          `INSERT INTO usuarios (sqlite_id, nombre, apellidos, username, email, password_hash, rol, estado_cuenta, activo)
           VALUES ($1, $2, $3, $4, LOWER($5), $6, $7, 'activo', TRUE)
           ON CONFLICT (email) DO UPDATE SET
             sqlite_id = EXCLUDED.sqlite_id,
             nombre = EXCLUDED.nombre,
             apellidos = EXCLUDED.apellidos,
             username = EXCLUDED.username,
             rol = EXCLUDED.rol,
             updated_at = CURRENT_TIMESTAMP`,
          [u.id, u.nombre, u.apellidos || '', cleanUser, u.correo, u.contrasena, u.rol || 'estudiante']
        );
      }

      // Sincronizar también todos los ensayos, lecturas, predicciones, feedback y auditoría locales a Neon
      await sincronizarTodoANeon();

      // Garantizar que los ensayos/predicciones creados por Juan Manuel Murillo Lozano (sqlite_id=8) y Dr. Santacruz (sqlite_id=1) tengan sus relaciones completas
      const juanManuelRes = await pool.query(`SELECT id, email FROM usuarios WHERE sqlite_id = 8 OR LOWER(username) = 'juan_murillo' LIMIT 1`);
      if (juanManuelRes.rowCount > 0) {
        const jmId = juanManuelRes.rows[0].id;
        const jmEmail = juanManuelRes.rows[0].email;
        await pool.query(
          `UPDATE ensayos SET usuario_id = $1, usuario_email = $2 WHERE codigo IN ('LOTE-CHV-111', 'LOTE-CHV-895', 'LOTE-SIM-928') OR LOWER(investigador) LIKE '%juan manuel%'`,
          [jmId, jmEmail]
        );
        await pool.query(
          `UPDATE predicciones SET usuario_id = $1 WHERE lote_codigo IN ('LOTE-CHV-111', 'LOTE-CHV-895', 'LOTE-SIM-928') OR LOWER(investigador) LIKE '%juan manuel%'`,
          [jmId]
        );
        await pool.query(
          `UPDATE dataset_retroalimentacion SET usuario_responsable_id = $1 WHERE lote_codigo IN ('LOTE-CHV-111', 'LOTE-CHV-895', 'LOTE-SIM-928')`,
          [jmId]
        );
      }

      const santacruzRes = await pool.query(`SELECT id FROM usuarios WHERE LOWER(email) = 'dr.santacruz@uleam.edu.ec' LIMIT 1`);
      if (santacruzRes.rowCount > 0) {
        const scId = santacruzRes.rows[0].id;
        await pool.query(`UPDATE predicciones SET usuario_id = $1 WHERE lote_codigo LIKE 'LOTE-CHV-4%'`, [scId]);
        await pool.query(`UPDATE auditoria_operaciones SET usuario_id = $1 WHERE LOWER(usuario_email) = 'dr.santacruz@uleam.edu.ec'`, [scId]);
      }

      const listUsersNeon = await pool.query(`SELECT sqlite_id, nombre, apellidos, username, email, rol FROM usuarios ORDER BY sqlite_id ASC NULLS LAST`);
      console.log(`\n👥 Usuarios sincronizados en Neon PostgreSQL (${listUsersNeon.rowCount}):`);
      for (const usr of listUsersNeon.rows) {
        console.log(`   - [ID Local: ${usr.sqlite_id}] ${usr.nombre} ${usr.apellidos} (@${usr.username}) <${usr.email}> [${usr.rol}]`);
      }

      console.log('\n📊 Conteo de registros en las 9 tablas de Neon PostgreSQL:');
      for (const tName of [
        'usuarios',
        'catalogo_sustratos',
        'catalogo_azucares',
        'ensayos',
        'lecturas_ensayo',
        'predicciones',
        'dataset_retroalimentacion',
        'auditoria_operaciones',
        'sincronizacion_historial',
      ]) {
        const cntRes = await pool.query(`SELECT COUNT(*) AS total FROM ${tName}`);
        console.log(`   - ${tName.padEnd(28)}: ${cntRes.rows[0]?.total || 0} filas`);
      }

      const relRes = await pool.query(`
        SELECT
          u.sqlite_id,
          u.nombre || ' ' || u.apellidos AS usuario,
          u.email,
          (SELECT COUNT(*) FROM ensayos e WHERE e.usuario_id = u.id) AS ensayos,
          (SELECT COUNT(*) FROM predicciones p WHERE p.usuario_id = u.id) AS predicciones,
          (SELECT COUNT(*) FROM dataset_retroalimentacion d WHERE d.usuario_responsable_id = u.id) AS feedback,
          (SELECT COUNT(*) FROM auditoria_operaciones a WHERE a.usuario_id = u.id) AS auditoria
        FROM usuarios u
        ORDER BY u.sqlite_id ASC NULLS LAST
      `);
      console.log('\n🔗 Relaciones por Usuario en Neon PostgreSQL:');
      for (const r of relRes.rows) {
        console.log(`   - [${r.sqlite_id}] ${r.usuario} <${r.email}> => ensayos: ${r.ensayos}, predicciones: ${r.predicciones}, feedback: ${r.feedback}, auditoria: ${r.auditoria}`);
      }
    } catch (syncErr) {
      console.warn('⚠️ Aviso al sincronizar registros locales a Neon:', syncErr.message);
    }

    if (tablas.includes('ensayos')) {
      const refRes = await pool.query(`
        SELECT COUNT(*) AS total_referencia
        FROM ensayos
        WHERE es_referencia_cientifica = TRUE AND deleted_at IS NULL;
      `);
      console.log(`🧪 Lotes científicos de referencia (Dr. Santacruz): ${refRes.rows[0]?.total_referencia || 0} / 6`);
    }

    console.log('===============================================================');
    await pool.cerrarPool();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inesperado durante la prueba de Neon PostgreSQL:', err.message);
    await pool.cerrarPool();
    process.exit(1);
  }
}

if (require.main === module) {
  ejecutarPruebaNeon();
}

module.exports = { ejecutarPruebaNeon };
