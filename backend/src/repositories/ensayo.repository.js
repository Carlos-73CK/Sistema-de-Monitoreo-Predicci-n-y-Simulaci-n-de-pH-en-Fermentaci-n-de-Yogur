/**
 * Repositorio de Ensayos y Lecturas — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Capa de Acceso a Datos (DAL) para:
 * - Persistencia y consulta de lotes experimentales en SQLite
 * - Fallback inteligente de compatibilidad con PostgreSQL / Supabase
 * - Adaptador de modelos para soportar los contratos REST unificados
 */

const pool = require('../config/db');
const {
  guardarEnsayoLaboratorio,
  listarEnsayosLaboratorio,
  obtenerEnsayoLaboratorio,
  registrarLecturaEnEnsayo,
  eliminarEnsayoLaboratorio,
  eliminarLecturaDeEnsayo,
} = require('../ai/sqliteStore');

/**
 * Normaliza un ensayo de SQLite al formato estándar de la REST API
 */
function adaptarEnsayo(trial) {
  if (!trial) return null;
  return {
    id: trial.id,
    codigo: trial.lote_id,
    lote_id: trial.lote_id,
    nombre_lote: trial.lote_id,
    investigador: trial.investigador,
    tipo_sustrato: trial.tipo_sustrato,
    tipo_leche: trial.tipo_sustrato,
    tipo_azucar: trial.tipo_azucar,
    temperatura_c: trial.temperatura_c,
    temperatura_objetivo: trial.temperatura_c,
    masa_inoculo_g: trial.masa_inoculo_g,
    masa_inoculo: trial.masa_inoculo_g,
    volumen_ml: trial.volumen_ml,
    masa_leche: trial.volumen_ml,
    porcentaje_inoculo: trial.porcentaje_inoculo,
    tiempo_corte_inicial_horas: trial.tiempo_corte_inicial_horas,
    tiempo_corte_inicial_minutos: trial.tiempo_corte_inicial_minutos,
    tiempo_corte_estimado_horas: trial.tiempo_corte_estimado_horas,
    tiempo_corte_estimado_minutos: trial.tiempo_corte_estimado_minutos,
    diferencia_minutos: trial.diferencia_minutos,
    estado: trial.estado || 'EN_CURSO',
    lecturas: trial.lecturas || [],
    diagnostico: trial.diagnostico,
    usuario_email: trial.usuario_email,
    usuario_id: trial.usuario_id,
    created_at: trial.creado_en,
    creado_en: trial.creado_en,
    actualizado_en: trial.actualizado_en,
  };
}

/**
 * Lista todos los ensayos experimentales
 * @param {string|null} filtroEmail
 */
async function listar(filtroEmail = null) {
  // 1. Intentar consultar PostgreSQL si está conectado activamente
  try {
    if (pool && typeof pool.query === 'function') {
      const pgRes = await pool.query(
        `SELECT id, usuario_id, nombre_lote, tipo_leche, tipo_azucar, masa_leche, masa_inoculo,
                temperatura_objetivo, estado, viscosidad_final, created_at
         FROM ensayos
         ORDER BY created_at DESC`
      );
      if (pgRes && pgRes.rowCount > 0) {
        return pgRes.rows.map((row) => ({
          id: row.id,
          codigo: row.nombre_lote,
          lote_id: row.nombre_lote,
          nombre_lote: row.nombre_lote,
          tipo_sustrato: row.tipo_leche,
          tipo_leche: row.tipo_leche,
          tipo_azucar: row.tipo_azucar,
          masa_inoculo_g: Number(row.masa_inoculo),
          temperatura_objetivo: Number(row.temperatura_objetivo),
          volumen_ml: Number(row.masa_leche),
          estado: row.estado,
          viscosidad_final: row.viscosidad_final !== null ? Number(row.viscosidad_final) : null,
          created_at: row.created_at,
          usuario_id: row.usuario_id,
        }));
      }
    }
  } catch (err) {
    // Modo SQLite activo
  }

  // 2. Consulta en SQLite (motor autónomo garantizado)
  const trials = listarEnsayosLaboratorio(100, filtroEmail);
  return trials.map(adaptarEnsayo);
}

/**
 * Busca un ensayo por su ID numérico o código de lote
 * @param {string|number} idOCodigo
 */
async function buscarPorIdOCodigo(idOCodigo) {
  if (!idOCodigo) return null;
  const codigoStr = String(idOCodigo).trim();

  // 1. Buscar en SQLite
  const trial = obtenerEnsayoLaboratorio(codigoStr);
  if (trial) {
    return adaptarEnsayo(trial);
  }

  // 2. Si no está en SQLite, intentar por ID numérico en PostgreSQL
  const idNum = Number(idOCodigo);
  if (!Number.isNaN(idNum)) {
    try {
      if (pool && typeof pool.query === 'function') {
        const pgRes = await pool.query(`SELECT * FROM ensayos WHERE id = $1 LIMIT 1`, [idNum]);
        if (pgRes.rowCount > 0) {
          const row = pgRes.rows[0];
          return {
            id: row.id,
            codigo: row.nombre_lote || row.lote_codigo,
            lote_id: row.nombre_lote || row.lote_codigo,
            tipo_sustrato: row.tipo_leche,
            temperatura_c: Number(row.temperatura_objetivo || row.temperatura_incubacion),
            lecturas: [],
            created_at: row.created_at,
          };
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Guarda un nuevo ensayo experimental
 * @param {Object} ensayoData
 */
function guardar(ensayoData) {
  const trial = guardarEnsayoLaboratorio(ensayoData);
  return adaptarEnsayo(trial);
}

/**
 * Registra una lectura y recalibra la proyección en SQLite
 * @param {string} loteId
 * @param {Object} lectura
 * @param {Object} recalibracion
 */
function registrarLectura(loteId, lectura, recalibracion) {
  const updated = registrarLecturaEnEnsayo(loteId, lectura, recalibracion);
  return adaptarEnsayo(updated);
}

/**
 * Elimina una lectura específica
 * @param {string} loteId
 * @param {number} min
 */
function eliminarLectura(loteId, min) {
  const updated = eliminarLecturaDeEnsayo(loteId, min);
  return adaptarEnsayo(updated);
}

/**
 * Elimina un ensayo completo
 * @param {string} loteId
 */
function eliminar(loteId) {
  return eliminarEnsayoLaboratorio(loteId);
}

module.exports = {
  listar,
  buscarPorIdOCodigo,
  guardar,
  registrarLectura,
  eliminarLectura,
  eliminar,
  adaptarEnsayo,
};
