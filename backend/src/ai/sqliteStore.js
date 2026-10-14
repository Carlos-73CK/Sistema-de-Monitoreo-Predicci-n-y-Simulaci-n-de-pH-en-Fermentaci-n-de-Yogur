/**
 * Almacenamiento Local Autónomo SQLite — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Utiliza SQLite nativo (node:sqlite) para persistir:
 * 1. Historial de predicciones y simulaciones "What-If" realizadas.
 * 2. Feedback Loop de Aprendizaje Continuo: Almacena nuevos lotes experimentales
 *    finalizados para enriquecer el dataset e incrementar la precisión del modelo de IA.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Asegurar existencia del directorio backend/data
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqliteFilePath = path.join(dataDir, 'prediyogur_local.sqlite');
const db = new DatabaseSync(sqliteFilePath);

// Inicializar tablas locales en SQLite
db.exec(`
  CREATE TABLE IF NOT EXISTS predicciones_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_sustrato TEXT NOT NULL,
    temperatura_c REAL NOT NULL,
    masa_inoculo_g REAL NOT NULL,
    volumen_ml REAL NOT NULL,
    porcentaje_inoculo REAL NOT NULL,
    tiempo_corte_horas REAL NOT NULL,
    tiempo_corte_minutos INTEGER NOT NULL,
    viscosidad_predicha_mpas REAL NOT NULL,
    calidad_gel TEXT,
    diagnostico TEXT,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dataset_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id TEXT NOT NULL,
    temperatura_incubacion_c REAL NOT NULL,
    porcentaje_inoculo REAL NOT NULL,
    masa_inoculo_g REAL NOT NULL,
    tiempo_minutos INTEGER NOT NULL,
    tiempo_horas REAL NOT NULL,
    ph_real REAL NOT NULL,
    indice_refraccion_real REAL,
    temperatura_real_medida REAL,
    viscosidad_final_real REAL,
    creado_en TEXT NOT NULL
  );
`);

/**
 * Guarda una simulación o predicción realizada en el historial
 */
function guardarPrediccion(p) {
  const insert = db.prepare(`
    INSERT INTO predicciones_historial (
      tipo_sustrato,
      temperatura_c,
      masa_inoculo_g,
      volumen_ml,
      porcentaje_inoculo,
      tiempo_corte_horas,
      tiempo_corte_minutos,
      viscosidad_predicha_mpas,
      calidad_gel,
      diagnostico,
      creado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const creadoEn = new Date().toISOString();
  const info = insert.run(
    p.tipoSustrato || p.tipo_sustrato || 'vaca',
    Number(p.temperaturaC || p.temperatura_c || 42),
    Number(p.masaInoculoG || p.masa_inoculo_g || 18.75),
    Number(p.volumenMl || p.volumen_ml || 250),
    Number(p.porcentajeInoculo || p.porcentaje_inoculo || 7.5),
    Number(p.tiempoCorteHoras || p.tiempo_corte_horas || 4.25),
    Number(p.tiempoCorteMinutos || p.tiempo_corte_minutos || 255),
    Number(p.viscosidadPredichaMpaS || p.viscosidad_predicha || 2639),
    p.calidadGel || p.calidad_gel || 'ESTANDAR',
    p.diagnostico || '',
    creadoEn
  );

  return {
    id: info.lastInsertRowid,
    ...p,
    creado_en: creadoEn,
  };
}

/**
 * Retorna las predicciones guardadas ordenadas de más recientes a más antiguas
 */
function listarPredicciones(limite = 50) {
  const stmt = db.prepare(`
    SELECT * FROM predicciones_historial
    ORDER BY id DESC
    LIMIT ?
  `);
  return stmt.all(limite);
}

/**
 * Registra nuevas lecturas reales de un lote completado para aprendizaje continuo
 * @param {Array<Object>} muestras
 */
function insertarMuestrasFeedback(muestras) {
  if (!Array.isArray(muestras) || muestras.length === 0) return 0;

  const insert = db.prepare(`
    INSERT INTO dataset_feedback (
      lote_id,
      temperatura_incubacion_c,
      porcentaje_inoculo,
      masa_inoculo_g,
      tiempo_minutos,
      tiempo_horas,
      ph_real,
      indice_refraccion_real,
      temperatura_real_medida,
      viscosidad_final_real,
      creado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const creadoEn = new Date().toISOString();
  let contador = 0;

  for (const m of muestras) {
    insert.run(
      m.loteId || m.lote_id || 'LOTE-NUEVO',
      Number(m.temperaturaIncubacionC || m.temperatura_c || 42),
      Number(m.porcentajeInoculo || m.porcentaje_inoculo || 7.5),
      Number(m.masaInoculoG || m.masa_inoculo_g || 18.75),
      Number(m.tiempoMinutos || m.tiempo_minutos || 0),
      Number(m.tiempoHoras || m.tiempo_horas || (m.tiempoMinutos / 60) || 0),
      Number(m.phReal || m.ph || 4.6),
      m.indiceRefraccionReal !== undefined ? Number(m.indiceRefraccionReal) : null,
      m.temperaturaRealMedida !== undefined ? Number(m.temperaturaRealMedida) : null,
      m.viscosidadFinalReal !== undefined ? Number(m.viscosidadFinalReal) : null,
      creadoEn
    );
    contador++;
  }

  return contador;
}

/**
 * Retorna todas las observaciones registradas en feedback para integrarlas al dataset
 */
function obtenerMuestrasFeedback() {
  const stmt = db.prepare(`SELECT * FROM dataset_feedback ORDER BY id ASC`);
  const rows = stmt.all();

  return rows.map((r) => ({
    loteId: r.lote_id,
    temperaturaIncubacionC: r.temperatura_incubacion_c,
    porcentajeInoculo: r.porcentaje_inoculo,
    masaInoculoG: r.masa_inoculo_g,
    tiempoMinutos: r.tiempo_minutos,
    tiempoHoras: r.tiempo_horas,
    phReal: r.ph_real,
    indiceRefraccionReal: r.indice_refraccion_real,
    temperaturaRealMedida: r.temperatura_real_medida,
    viscosidadFinalReal: r.viscosidad_final_real,
  }));
}

/**
 * Retorna el conteo de muestras y lotes adicionales aprendidos
 */
function contarFeedback() {
  const countMuestras = db.prepare(`SELECT COUNT(*) as total FROM dataset_feedback`).get();
  const countLotes = db.prepare(`SELECT COUNT(DISTINCT lote_id) as total FROM dataset_feedback`).get();

  return {
    muestrasNuevas: countMuestras ? countMuestras.total : 0,
    lotesNuevos: countLotes ? countLotes.total : 0,
  };
}

module.exports = {
  db,
  sqliteFilePath,
  guardarPrediccion,
  listarPredicciones,
  insertarMuestrasFeedback,
  obtenerMuestrasFeedback,
  contarFeedback,
};
