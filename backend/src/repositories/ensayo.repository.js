/**
 * Repositorio de Ensayos, Lecturas y Auditoría — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 *
 * Capa de Acceso a Datos (DAL) Híbrida (Neon PostgreSQL + SQLite Local):
 * - Si Neon PostgreSQL está configurado y disponible (`pool.isNeonConfigured()`),
 *   ejecuta operaciones transaccionales parametrizadas en Neon y sincroniza con SQLite.
 * - Si Neon PostgreSQL no está disponible o no tiene credenciales configuradas,
 *   registra explícitamente la causa en consola y en `sincronizacion_historial` y
 *   opera de manera autónoma sobre SQLite local (`offline-first`).
 */

const pool = require('../config/db');
const {
  guardarEnsayoLaboratorio,
  listarEnsayosLaboratorio,
  obtenerEnsayoLaboratorio,
  registrarLecturaEnEnsayo,
  eliminarEnsayoLaboratorio,
  eliminarLecturaDeEnsayo,
  finalizarEnsayoLaboratorioSQLite,
  archivarEnsayoLaboratorioSQLite,
  registrarAuditoriaSQLite,
  listarAuditoriaSQLite,
  registrarSincronizacionSQLite,
} = require('../ai/sqliteStore');

/**
 * Normaliza un ensayo al contrato unificado de la REST API
 */
function adaptarEnsayo(trial) {
  if (!trial) return null;
  const codigo = trial.codigo || trial.lote_id || trial.nombre_lote;
  const temp = Number(trial.temperatura_incubacion ?? trial.temperatura_c ?? trial.temperatura_objetivo ?? 42.0);
  const masaSol = Number(trial.masa_solucion_g ?? trial.volumen_ml ?? trial.masa_leche ?? 250);
  const masaInoc = Number(trial.masa_inoculo_g ?? trial.masa_inoculo ?? 18.75);
  const pctInoc = Number(trial.porcentaje_inoculo ?? ((masaInoc / (masaSol || 250)) * 100).toFixed(2));
  const visco = trial.viscosidad_final_mpas !== undefined && trial.viscosidad_final_mpas !== null
    ? Number(trial.viscosidad_final_mpas)
    : (trial.viscosidad_final !== undefined && trial.viscosidad_final !== null ? Number(trial.viscosidad_final) : null);

  return {
    id: trial.id,
    codigo,
    lote_id: codigo,
    nombre_lote: trial.nombre_lote || codigo,
    investigador: trial.investigador || 'Lab. Química de Alimentos — ULEAM',
    tipo_sustrato: trial.tipo_sustrato || trial.tipo_leche || 'vaca',
    tipo_leche: trial.tipo_sustrato || trial.tipo_leche || 'vaca',
    tipo_azucar: trial.tipo_azucar || 'lactosa',
    temperatura_c: temp,
    temperatura_incubacion: temp,
    temperatura_objetivo: temp,
    masa_inoculo_g: masaInoc,
    masa_inoculo: masaInoc,
    volumen_ml: masaSol,
    masa_solucion_g: masaSol,
    masa_leche: masaSol,
    porcentaje_inoculo: pctInoc,
    tiempo_corte_inicial_horas: trial.tiempo_corte_inicial_horas ?? 4.25,
    tiempo_corte_inicial_minutos: trial.tiempo_corte_inicial_minutos ?? 255,
    tiempo_corte_estimado_horas: trial.tiempo_corte_estimado_horas ?? 4.25,
    tiempo_corte_estimado_minutos: trial.tiempo_corte_estimado_minutos ?? 255,
    diferencia_minutos: trial.diferencia_minutos ?? 0,
    viscosidad_final: visco,
    viscosidad_final_mpas: visco,
    es_referencia_cientifica: Boolean(trial.es_referencia_cientifica),
    estado: trial.estado || 'EN_CURSO',
    lecturas: Array.isArray(trial.lecturas) ? trial.lecturas : [],
    diagnostico: trial.diagnostico || '',
    usuario_email: trial.usuario_email || 'carlos.delgado@uleam.edu.ec',
    usuario_id: trial.usuario_id || 1,
    created_at: trial.created_at || trial.creado_en,
    creado_en: trial.creado_en || trial.created_at,
    actualizado_en: trial.actualizado_en || trial.updated_at || trial.created_at,
  };
}

/**
 * Lista todos los ensayos experimentales desde Neon PostgreSQL (si está activo) o SQLite
 * @param {string|null} filtroEmail
 */
async function listar(filtroEmail = null) {
  if (pool.isNeonConfigured()) {
    try {
      const params = [];
      let whereClause = 'WHERE e.deleted_at IS NULL';
      if (filtroEmail) {
        params.push(String(filtroEmail).trim().toLowerCase());
        whereClause += ` AND LOWER(e.usuario_email) = $1`;
      }

      const pgRes = await pool.query(
        `SELECT e.id, e.codigo, e.nombre_lote, e.usuario_id, e.usuario_email, e.investigador,
                e.tipo_sustrato, e.tipo_azucar, e.masa_solucion_g, e.volumen_ml,
                e.porcentaje_inoculo, e.masa_inoculo_g, e.temperatura_incubacion,
                e.tiempo_corte_inicial_horas, e.tiempo_corte_inicial_minutos,
                e.tiempo_corte_estimado_horas, e.tiempo_corte_estimado_minutos,
                e.diferencia_minutos, e.estado, e.viscosidad_final_mpas,
                e.es_referencia_cientifica, e.diagnostico, e.created_at, e.updated_at
         FROM ensayos e
         ${whereClause}
         ORDER BY e.created_at DESC`,
        params
      );

      if (pgRes && pgRes.rowCount > 0) {
        return pgRes.rows.map(adaptarEnsayo);
      }
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite en listar(): ${err.message}`);
    }
  }

  const trials = listarEnsayosLaboratorio(100, filtroEmail);
  return trials.map(adaptarEnsayo);
}

/**
 * Busca un ensayo por su ID o código de lote, incluyendo su serie temporal de lecturas
 * @param {string|number} idOCodigo
 */
async function buscarPorIdOCodigo(idOCodigo) {
  if (!idOCodigo) return null;
  const codigoStr = String(idOCodigo).trim();

  if (pool.isNeonConfigured()) {
    try {
      const pgRes = await pool.query(
        `SELECT * FROM ensayos
         WHERE (id::text = $1 OR codigo = $1 OR nombre_lote = $1)
           AND deleted_at IS NULL
         LIMIT 1`,
        [codigoStr]
      );
      if (pgRes.rowCount > 0) {
        const row = pgRes.rows[0];
        const lecRes = await pool.query(
          `SELECT id, ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones, registrado_en, created_at
           FROM lecturas_ensayo
           WHERE ensayo_id = $1
           ORDER BY tiempo_minutos ASC`,
          [row.id]
        );
        return adaptarEnsayo({
          ...row,
          lecturas: lecRes.rows.map((l) => ({
            id: l.id,
            ensayo_id: l.ensayo_id,
            minutos: Number(l.tiempo_minutos),
            tiempo_minutos: Number(l.tiempo_minutos),
            ph: Number(l.ph),
            temperatura: Number(l.temperatura),
            indice_refraccion: l.indice_refraccion_brix !== null ? Number(l.indice_refraccion_brix) : null,
            created_at: l.created_at || l.registrado_en,
          })),
        });
      }
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite en buscarPorIdOCodigo(${codigoStr}): ${err.message}`);
    }
  }

  const trial = obtenerEnsayoLaboratorio(codigoStr);
  return trial ? adaptarEnsayo(trial) : null;
}

/**
 * Guarda o actualiza un ensayo en SQLite y, si Neon está disponible, lo replica transaccionalmente
 * @param {Object} ensayoData
 */
async function guardar(ensayoData) {
  const trialLocal = guardarEnsayoLaboratorio(ensayoData);

  if (pool.isNeonConfigured()) {
    try {
      const pgRow = await pool.withTransaction(async (client) => {
        const resEnsayo = await client.query(
          `INSERT INTO ensayos (
             sqlite_id, codigo, nombre_lote, investigador, usuario_email,
             tipo_sustrato, tipo_azucar, masa_solucion_g, volumen_ml,
             porcentaje_inoculo, masa_inoculo_g, temperatura_incubacion,
             tiempo_corte_inicial_horas, tiempo_corte_inicial_minutos,
             tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos,
             diferencia_minutos, estado, diagnostico, origen_sincronizacion
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'sqlite_local')
           ON CONFLICT (codigo) DO UPDATE SET
             investigador = EXCLUDED.investigador,
             tipo_sustrato = EXCLUDED.tipo_sustrato,
             tipo_azucar = EXCLUDED.tipo_azucar,
             masa_solucion_g = EXCLUDED.masa_solucion_g,
             volumen_ml = EXCLUDED.volumen_ml,
             porcentaje_inoculo = EXCLUDED.porcentaje_inoculo,
             masa_inoculo_g = EXCLUDED.masa_inoculo_g,
             temperatura_incubacion = EXCLUDED.temperatura_incubacion,
             tiempo_corte_estimado_horas = EXCLUDED.tiempo_corte_estimado_horas,
             tiempo_corte_estimado_minutos = EXCLUDED.tiempo_corte_estimado_minutos,
             diferencia_minutos = EXCLUDED.diferencia_minutos,
             estado = EXCLUDED.estado,
             diagnostico = EXCLUDED.diagnostico,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            trialLocal.id,
            trialLocal.lote_id,
            trialLocal.lote_id,
            trialLocal.investigador,
            trialLocal.usuario_email,
            trialLocal.tipo_sustrato,
            trialLocal.tipo_azucar,
            trialLocal.volumen_ml,
            trialLocal.volumen_ml,
            trialLocal.porcentaje_inoculo,
            trialLocal.masa_inoculo_g,
            trialLocal.temperatura_c,
            trialLocal.tiempo_corte_inicial_horas,
            trialLocal.tiempo_corte_inicial_minutos,
            trialLocal.tiempo_corte_estimado_horas,
            trialLocal.tiempo_corte_estimado_minutos,
            trialLocal.diferencia_minutos,
            trialLocal.estado,
            trialLocal.diagnostico,
          ]
        );

        const neonEnsayo = resEnsayo.rows[0];

        // Sincronizar lecturas asociadas evitando duplicados (ON CONFLICT DO UPDATE)
        if (Array.isArray(trialLocal.lecturas)) {
          for (const lec of trialLocal.lecturas) {
            const min = Number(lec.tiempo_minutos ?? lec.minutos ?? 0);
            const ph = Number(lec.ph ?? 6.25);
            const temp = Number(lec.temperatura ?? trialLocal.temperatura_c ?? 42.0);
            const brix = lec.indice_refraccion !== undefined && lec.indice_refraccion !== null
              ? Number(lec.indice_refraccion)
              : null;

            await client.query(
              `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
                 ph = EXCLUDED.ph,
                 temperatura = EXCLUDED.temperatura,
                 indice_refraccion_brix = EXCLUDED.indice_refraccion_brix`,
              [neonEnsayo.id, min, ph, temp, brix]
            );
          }
        }

        await client.query(
          `INSERT INTO auditoria_operaciones (usuario_email, accion, entidad_afectada, registro_afectado_id, datos_posteriores)
           VALUES ($1, 'CREAR_ENSAYO', 'ensayos', $2, $3::jsonb)`,
          [
            trialLocal.usuario_email,
            trialLocal.lote_id,
            JSON.stringify({
              codigo: trialLocal.lote_id,
              tipo_sustrato: trialLocal.tipo_sustrato,
              temperatura_c: trialLocal.temperatura_c,
              porcentaje_inoculo: trialLocal.porcentaje_inoculo,
            }),
          ]
        );

        return neonEnsayo;
      });

      registrarSincronizacionSQLite({
        entidad: 'ensayos',
        claveUnica: trialLocal.lote_id,
        sqliteId: trialLocal.id,
        neonUuid: pgRow.id,
        operacion: 'UPSERT',
        estado: 'SINCRONIZADO',
      });
    } catch (err) {
      console.warn(`[EnsayoRepo] Sincronización con Neon pendiente para lote '${trialLocal.lote_id}': ${err.message}`);
      registrarSincronizacionSQLite({
        entidad: 'ensayos',
        claveUnica: trialLocal.lote_id,
        sqliteId: trialLocal.id,
        operacion: 'UPSERT',
        estado: 'PENDIENTE',
        detalleError: err.message,
      });
    }
  } else {
    registrarSincronizacionSQLite({
      entidad: 'ensayos',
      claveUnica: trialLocal.lote_id,
      sqliteId: trialLocal.id,
      operacion: 'INSERT',
      estado: 'PENDIENTE',
      detalleError: 'Neon PostgreSQL no configurado en backend/.env (almacenado en SQLite local).',
    });
  }

  return adaptarEnsayo(trialLocal);
}

/**
 * Registra una lectura y recalibra la proyección en SQLite y Neon PostgreSQL (con transacción)
 */
async function registrarLectura(loteId, lectura, recalibracion) {
  const updated = registrarLecturaEnEnsayo(loteId, lectura, recalibracion);

  if (pool.isNeonConfigured()) {
    try {
      await pool.withTransaction(async (client) => {
        const ensRes = await client.query(
          `SELECT id FROM ensayos WHERE (codigo = $1 OR id::text = $1) AND deleted_at IS NULL LIMIT 1`,
          [String(loteId).trim()]
        );
        if (ensRes.rowCount > 0) {
          const ensayoUuid = ensRes.rows[0].id;
          const min = Number(lectura.tiempo_minutos ?? lectura.minutos ?? 0);
          const ph = Number(lectura.ph);
          const temp = Number(lectura.temperatura ?? updated.temperatura_c ?? 42.0);
          const brix = lectura.indice_refraccion !== undefined && lectura.indice_refraccion !== null
            ? Number(lectura.indice_refraccion)
            : null;

          await client.query(
            `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
               ph = EXCLUDED.ph,
               temperatura = EXCLUDED.temperatura,
               indice_refraccion_brix = EXCLUDED.indice_refraccion_brix`,
            [ensayoUuid, min, ph, temp, brix]
          );

          await client.query(
            `UPDATE ensayos SET
               tiempo_corte_estimado_horas = $2,
               tiempo_corte_estimado_minutos = $3,
               diferencia_minutos = $4,
               diagnostico = $5,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [
              ensayoUuid,
              updated.tiempo_corte_estimado_horas,
              updated.tiempo_corte_estimado_minutos,
              updated.diferencia_minutos,
              updated.diagnostico,
            ]
          );

          await client.query(
            `INSERT INTO auditoria_operaciones (usuario_email, accion, entidad_afectada, registro_afectado_id, datos_posteriores)
             VALUES ($1, 'REGISTRAR_LECTURA', 'lecturas_ensayo', $2, $3::jsonb)`,
            [
              updated.usuario_email,
              `${updated.lote_id}:min_${min}`,
              JSON.stringify({ minutos: min, ph, temperatura: temp, indice_refraccion_brix: brix }),
            ]
          );
        }
      });
    } catch (err) {
      console.warn(`[EnsayoRepo] Sincronización de lectura con Neon en espera (${loteId}): ${err.message}`);
    }
  }

  return adaptarEnsayo(updated);
}

/**
 * Finaliza un ensayo registrando su viscosidad final Brookfield
 */
async function finalizar(idOLoteId, viscosidadFinal) {
  const updated = finalizarEnsayoLaboratorioSQLite(idOLoteId, viscosidadFinal);

  if (pool.isNeonConfigured()) {
    try {
      await pool.withTransaction(async (client) => {
        const res = await client.query(
          `UPDATE ensayos
           SET estado = 'completado',
               viscosidad_final_mpas = $2,
               finished_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE (id::text = $1 OR codigo = $1 OR nombre_lote = $1)
           RETURNING id, codigo, usuario_email`,
          [String(idOLoteId).trim(), Number(viscosidadFinal)]
        );
        if (res.rowCount > 0) {
          await client.query(
            `INSERT INTO auditoria_operaciones (usuario_email, accion, entidad_afectada, registro_afectado_id, datos_posteriores)
             VALUES ($1, 'FINALIZAR_ENSAYO', 'ensayos', $2, $3::jsonb)`,
            [
              res.rows[0].usuario_email,
              res.rows[0].codigo,
              JSON.stringify({ estado: 'completado', viscosidad_final_mpas: Number(viscosidadFinal) }),
            ]
          );
        }
      });
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite al finalizar ensayo (${idOLoteId}): ${err.message}`);
    }
  }

  return adaptarEnsayo(updated);
}

/**
 * Archiva un ensayo experimental cambiando su estado a 'archivado'
 */
async function archivar(idOLoteId) {
  const updated = archivarEnsayoLaboratorioSQLite(idOLoteId);

  if (pool.isNeonConfigured()) {
    try {
      await pool.withTransaction(async (client) => {
        const res = await client.query(
          `UPDATE ensayos
           SET estado = 'archivado',
               updated_at = CURRENT_TIMESTAMP
           WHERE (id::text = $1 OR codigo = $1 OR nombre_lote = $1)
           RETURNING id, codigo, usuario_email`,
          [String(idOLoteId).trim()]
        );
        if (res.rowCount > 0) {
          await client.query(
            `INSERT INTO auditoria_operaciones (usuario_email, accion, entidad_afectada, registro_afectado_id, datos_posteriores)
             VALUES ($1, 'ARCHIVAR_ENSAYO', 'ensayos', $2, '{"estado":"archivado"}'::jsonb)`,
            [res.rows[0].usuario_email, res.rows[0].codigo]
          );
        }
      });
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite al archivar ensayo (${idOLoteId}): ${err.message}`);
    }
  }

  return adaptarEnsayo(updated);
}

/**
 * Elimina una lectura específica
 */
function eliminarLectura(loteId, min) {
  const updated = eliminarLecturaDeEnsayo(loteId, min);
  return adaptarEnsayo(updated);
}

/**
 * Elimina un ensayo (eliminación lógica en Neon PostgreSQL y limpieza en SQLite)
 */
async function eliminar(loteId) {
  if (pool.isNeonConfigured()) {
    try {
      await pool.withTransaction(async (client) => {
        await client.query(
          `UPDATE ensayos SET deleted_at = CURRENT_TIMESTAMP, estado = 'cancelado' WHERE codigo = $1 OR id::text = $1`,
          [String(loteId).trim()]
        );
        await client.query(
          `INSERT INTO auditoria_operaciones (accion, entidad_afectada, registro_afectado_id, datos_posteriores)
           VALUES ('ELIMINAR_LOGICO_ENSAYO', 'ensayos', $1, '{"deleted": true}'::jsonb)`,
          [String(loteId).trim()]
        );
      });
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite al eliminar ensayo (${loteId}): ${err.message}`);
    }
  }
  return eliminarEnsayoLaboratorio(loteId);
}

/**
 * Consulta la bitácora de auditoría desde Neon PostgreSQL (si está disponible) o SQLite
 */
async function listarAuditoria(limite = 100) {
  if (pool.isNeonConfigured()) {
    try {
      const res = await pool.query(
        `SELECT id, usuario_id, usuario_email, accion, entidad_afectada, registro_afectado_id,
                datos_anteriores, datos_posteriores, informacion_tecnica, fecha_evento
         FROM auditoria_operaciones
         ORDER BY fecha_evento DESC
         LIMIT $1`,
        [Number(limite) || 100]
      );
      if (res && res.rowCount > 0) {
        return res.rows;
      }
    } catch (err) {
      console.warn(`[EnsayoRepo] Fallback a SQLite al consultar auditoría: ${err.message}`);
    }
  }
  return listarAuditoriaSQLite(limite);
}

module.exports = {
  listar,
  buscarPorIdOCodigo,
  guardar,
  registrarLectura,
  finalizar,
  archivar,
  eliminarLectura,
  eliminar,
  listarAuditoria,
  adaptarEnsayo,
};
