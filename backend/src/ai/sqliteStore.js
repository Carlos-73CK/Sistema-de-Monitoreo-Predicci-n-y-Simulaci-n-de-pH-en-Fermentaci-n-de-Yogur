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
const bcrypt = require('bcryptjs');

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
    lote_id TEXT DEFAULT 'LOTE-DEFAULT',
    investigador TEXT DEFAULT 'Lab. ULEAM',
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

  CREATE TABLE IF NOT EXISTS ensayos_laboratorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id TEXT UNIQUE NOT NULL,
    investigador TEXT NOT NULL,
    tipo_sustrato TEXT NOT NULL DEFAULT 'vaca',
    tipo_azucar TEXT NOT NULL DEFAULT 'sacarosa',
    temperatura_c REAL NOT NULL,
    masa_inoculo_g REAL NOT NULL,
    volumen_ml REAL NOT NULL,
    porcentaje_inoculo REAL NOT NULL,
    tiempo_corte_inicial_horas REAL NOT NULL,
    tiempo_corte_inicial_minutos INTEGER NOT NULL,
    tiempo_corte_estimado_horas REAL NOT NULL,
    tiempo_corte_estimado_minutos INTEGER NOT NULL,
    diferencia_minutos INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'EN_CURSO',
    lecturas_json TEXT NOT NULL DEFAULT '[]',
    diagnostico TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    usuario_id INTEGER DEFAULT 1,
    usuario_email TEXT DEFAULT 'carlos.delgado@uleam.edu.ec'
  );
`);

// Tabla de usuarios locales para autenticación y asignación de muestras
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT DEFAULT '',
    username TEXT DEFAULT '',
    correo TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol TEXT DEFAULT 'estudiante',
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TEXT DEFAULT NULL,
    reset_token TEXT DEFAULT NULL,
    reset_token_expira TEXT DEFAULT NULL,
    activo INTEGER DEFAULT 1,
    creado_en TEXT NOT NULL
  );
`);

// Migración defensiva de columnas en usuarios
try { db.exec(`ALTER TABLE usuarios ADD COLUMN apellidos TEXT DEFAULT ''`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN username TEXT DEFAULT ''`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN intentos_fallidos INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TEXT DEFAULT NULL`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN reset_token TEXT DEFAULT NULL`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN reset_token_expira TEXT DEFAULT NULL`); } catch (e) {}
try { db.exec(`ALTER TABLE usuarios ADD COLUMN activo INTEGER DEFAULT 1`); } catch (e) {}

// Sembrar usuarios predeterminados si la tabla está vacía
try {
  const countUsers = db.prepare(`SELECT COUNT(*) as total FROM usuarios`).get();
  if (!countUsers || countUsers.total === 0) {
    const saltRounds = 10;
    const insertUser = db.prepare(`
      INSERT INTO usuarios (nombre, apellidos, username, correo, contrasena, rol, creado_en)
      VALUES (?, ?, ?, LOWER(?), ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertUser.run('Dr. Stalin', 'Santacruz Terán', 'stalin.santacruz', 'dr.santacruz@uleam.edu.ec', bcrypt.hashSync('santacruz2026', saltRounds), 'investigador', now);
    insertUser.run('Carlos', 'Delgado', 'carlos.delgado', 'carlos.delgado@uleam.edu.ec', bcrypt.hashSync('carlos2026', saltRounds), 'investigador', now);
    insertUser.run('Estudiante', 'ULEAM', 'estudiante.uleam', 'estudiante@uleam.edu.ec', bcrypt.hashSync('estudiante2026', saltRounds), 'estudiante', now);
  } else {
    // Backfill para usuarios base preexistentes que no tenían username o apellidos
    db.prepare(`UPDATE usuarios SET username = 'stalin.santacruz', apellidos = 'Santacruz Terán' WHERE LOWER(correo) = 'dr.santacruz@uleam.edu.ec' AND (username IS NULL OR username = '')`).run();
    db.prepare(`UPDATE usuarios SET username = 'carlos.delgado', apellidos = 'Delgado' WHERE LOWER(correo) = 'carlos.delgado@uleam.edu.ec' AND (username IS NULL OR username = '')`).run();
    db.prepare(`UPDATE usuarios SET username = 'estudiante.uleam', apellidos = 'ULEAM' WHERE LOWER(correo) = 'estudiante@uleam.edu.ec' AND (username IS NULL OR username = '')`).run();
  }
} catch (e) {
  console.warn('[SQLite] Aviso al sembrar usuarios base:', e.message);
}

// Migración defensiva de columnas en ensayos_laboratorio
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN usuario_id INTEGER DEFAULT 1`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN usuario_email TEXT DEFAULT 'carlos.delgado@uleam.edu.ec'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN viscosidad_final REAL DEFAULT NULL`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN es_referencia_cientifica INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN parametro_t50 REAL DEFAULT NULL`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN parametro_gamma REAL DEFAULT NULL`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN brix_final REAL DEFAULT NULL`);
} catch (e) {}

// Tablas de auditoría de operaciones y trazabilidad de sincronización híbrida SQLite <-> Neon
db.exec(`
  CREATE TABLE IF NOT EXISTS auditoria_operaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT DEFAULT NULL,
    usuario_email TEXT DEFAULT NULL,
    accion TEXT NOT NULL,
    entidad_afectada TEXT NOT NULL,
    registro_afectado_id TEXT DEFAULT NULL,
    datos_anteriores TEXT DEFAULT NULL,
    datos_posteriores TEXT DEFAULT NULL,
    informacion_tecnica TEXT DEFAULT '{}',
    fecha_evento TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sincronizacion_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT NOT NULL,
    clave_unica TEXT NOT NULL,
    sqlite_id INTEGER DEFAULT NULL,
    neon_uuid TEXT DEFAULT NULL,
    operacion TEXT NOT NULL DEFAULT 'UPSERT',
    estado TEXT NOT NULL DEFAULT 'SINCRONIZADO',
    detalle_error TEXT DEFAULT NULL,
    sincronizado_en TEXT NOT NULL
  );
`);

// Sembrar de forma idempotente los 6 lotes experimentales de referencia científica del Dr. Stalin Santacruz
try {
  const { EXPERIMENTAL_BATCHES } = require('./dataset');
  const paramsGrid = {
    'LOTE-CHV-40-2.5': { t50: 130, gamma: 2.8, brix: 5.9 },
    'LOTE-CHV-40-7.5': { t50: 75,  gamma: 1.9, brix: 5.5 },
    'LOTE-CHV-42-2.5': { t50: 300, gamma: 3.9, brix: 5.1 },
    'LOTE-CHV-42-7.5': { t50: 125, gamma: 3.0, brix: 5.7 },
    'LOTE-CHV-44-2.5': { t50: 230, gamma: 3.5, brix: 6.1 },
    'LOTE-CHV-44-7.5': { t50: 170, gamma: 2.6, brix: 7.4 },
  };

  const checkRefStmt = db.prepare(`SELECT id FROM ensayos_laboratorio WHERE lote_id = ?`);
  const insertRefStmt = db.prepare(`
    INSERT INTO ensayos_laboratorio (
      lote_id, investigador, tipo_sustrato, tipo_azucar, temperatura_c, masa_inoculo_g, volumen_ml,
      porcentaje_inoculo, tiempo_corte_inicial_horas, tiempo_corte_inicial_minutos,
      tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos, diferencia_minutos,
      estado, lecturas_json, diagnostico, creado_en, actualizado_en, usuario_id, usuario_email,
      viscosidad_final, es_referencia_cientifica, parametro_t50, parametro_gamma, brix_final
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nowIso = new Date().toISOString();
  for (const batch of EXPERIMENTAL_BATCHES) {
    const existe = checkRefStmt.get(batch.loteId);
    const meta = paramsGrid[batch.loteId] || { t50: 125, gamma: 3.0, brix: 5.7 };
    const lecturasReales = batch.lecturas.map((l) => ({
      tiempo_minutos: l.tiempoMinutos,
      minutos: l.tiempoMinutos,
      ph: l.ph,
      temperatura: l.temperaturaC,
      indice_refraccion: l.indiceRefraccion,
      registrado_en: nowIso,
    }));
    const tCorteMin = Math.round(batch.tiempoCorteHoras * 60);

    if (!existe) {
      insertRefStmt.run(
        batch.loteId,
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'lactosa',
        batch.temperaturaIncubacionC,
        batch.masaInoculoG,
        batch.masaLecheG,
        batch.porcentajeInoculo,
        batch.tiempoCorteHoras,
        tCorteMin,
        batch.tiempoCorteHoras,
        tCorteMin,
        0,
        'finalizado',
        JSON.stringify(lecturasReales),
        `Lote experimental de referencia ULEAM (${batch.temperaturaIncubacionC} °C / ${batch.porcentajeInoculo}% Chivería): Viscosidad ${batch.viscosidadFinalMpaS} mPa·s, corte ${batch.tiempoCorteHoras} h.`,
        nowIso,
        nowIso,
        1,
        'dr.santacruz@uleam.edu.ec',
        batch.viscosidadFinalMpaS,
        1,
        meta.t50,
        meta.gamma,
        meta.brix
      );
    }
  }
} catch (e) {
  console.warn('[SQLite] Aviso al verificar lotes de referencia científica:', e.message);
}

// Vincular lote de prueba existente al investigador Carlos Delgado
try {
  db.prepare(`UPDATE ensayos_laboratorio SET usuario_email = 'carlos.delgado@uleam.edu.ec', investigador = 'Carlos Delgado' WHERE lote_id = 'prueba1'`).run();
} catch (e) {}

// Migración defensiva si la tabla predicciones_historial ya existía sin las columnas
try {
  db.exec(`ALTER TABLE predicciones_historial ADD COLUMN lote_id TEXT DEFAULT 'LOTE-DEFAULT'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE predicciones_historial ADD COLUMN investigador TEXT DEFAULT 'Lab. ULEAM'`);
} catch (e) {}

// Migración de predicciones existentes hacia ensayos_laboratorio para no perder historial
try {
  const existentes = db.prepare(`SELECT * FROM predicciones_historial ORDER BY id ASC`).all();
  const checkStmt = db.prepare(`SELECT id FROM ensayos_laboratorio WHERE lote_id = ?`);
  const insertEnsayo = db.prepare(`
    INSERT INTO ensayos_laboratorio (
      lote_id, investigador, tipo_sustrato, tipo_azucar, temperatura_c, masa_inoculo_g, volumen_ml,
      porcentaje_inoculo, tiempo_corte_inicial_horas, tiempo_corte_inicial_minutos,
      tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos, diferencia_minutos,
      estado, lecturas_json, diagnostico, creado_en, actualizado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of existentes) {
    if (!row.lote_id || row.lote_id === 'LOTE-DEFAULT') continue;
    const exists = checkStmt.get(row.lote_id);
    if (!exists) {
      const lecturasIniciales = [
        {
          tiempo_minutos: 0,
          ph: 6.50,
          temperatura: row.temperatura_c || 42.0,
          indice_refraccion: null,
          registrado_en: row.creado_en
        }
      ];
      insertEnsayo.run(
        row.lote_id,
        row.investigador || 'Lab. Química de Alimentos — ULEAM',
        row.tipo_sustrato || 'vaca',
        'sacarosa',
        row.temperatura_c || 42.0,
        row.masa_inoculo_g || 18.75,
        row.volumen_ml || 250,
        row.porcentaje_inoculo || 7.5,
        row.tiempo_corte_horas || 4.25,
        row.tiempo_corte_minutos || 255,
        row.tiempo_corte_horas || 4.25,
        row.tiempo_corte_minutos || 255,
        0,
        'EN_CURSO',
        JSON.stringify(lecturasIniciales),
        row.diagnostico || 'Ensayo preservado desde historial',
        row.creado_en,
        row.creado_en
      );
    }
  }
} catch (e) {
  // Ignorar si ya fueron migradas
}

/**
 * Guarda una simulación o predicción realizada en el historial
 */
function guardarPrediccion(p) {
  const loteId = String(p.lote_id || p.loteId || p.nombre_lote || p.codigo || 'LOTE-CHV-' + Math.floor(100 + Math.random() * 900)).trim();
  const investigador = String(p.investigador || p.usuario || 'Lab. Química de Alimentos — ULEAM').trim();

  const insert = db.prepare(`
    INSERT INTO predicciones_historial (
      lote_id,
      investigador,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const creadoEn = new Date().toISOString();
  const info = insert.run(
    loteId,
    investigador,
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

  const predGuardada = {
    id: Number(info.lastInsertRowid),
    ...p,
    lote_id: loteId,
    investigador,
    creado_en: creadoEn,
  };

  sincronizarPrediccionANeon(predGuardada).catch((err) => {
    console.warn('[SQLite->Neon] Aviso al sincronizar predicción:', err.message);
  });

  registrarAuditoriaSQLite({
    usuarioEmail: p.usuario_email || p.usuarioEmail || null,
    accion: 'EJECUTAR_PREDICCION',
    entidadAfectada: 'predicciones',
    registroAfectadoId: loteId,
    datosPosteriores: {
      lote_id: loteId,
      investigador,
      tipo_sustrato: p.tipoSustrato || p.tipo_sustrato || 'vaca',
      temperatura_c: Number(p.temperaturaC || p.temperatura_c || 42),
      porcentaje_inoculo: Number(p.porcentajeInoculo || p.porcentaje_inoculo || 7.5),
      tiempo_corte_horas: Number(p.tiempoCorteHoras || p.tiempo_corte_horas || 4.25),
      viscosidad_predicha_mpas: Number(p.viscosidadPredichaMpaS || p.viscosidad_predicha || 2639),
    },
  });

  return predGuardada;
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
    const ph = Number(m.phReal !== undefined ? m.phReal : m.ph);
    const tempIncub = Number(m.temperaturaIncubacionC || m.temperatura_c || 42);
    const inocPct = Number(m.porcentajeInoculo || m.porcentaje_inoculo || 7.5);
    const tMin = Number(m.tiempoMinutos !== undefined ? m.tiempoMinutos : (m.tiempo_minutos || 0));

    // Filtro defensivo: Descartar anomalías extremas o NaN
    if (
      Number.isNaN(ph) || ph < 3.5 || ph > 7.5 ||
      Number.isNaN(tempIncub) || tempIncub < 15 || tempIncub > 55 ||
      Number.isNaN(inocPct) || inocPct <= 0 || inocPct > 25 ||
      Number.isNaN(tMin) || tMin < 0 || tMin > 1440
    ) {
      console.warn('[SQLite Feedback] Muestra descartada por anomalía fisicoquímica:', m);
      continue;
    }

    insert.run(
      String(m.loteId || m.lote_id || 'LOTE-NUEVO').trim(),
      tempIncub,
      inocPct,
      Number(m.masaInoculoG || m.masa_inoculo_g || 18.75),
      tMin,
      Number(m.tiempoHoras || m.tiempo_horas || (tMin / 60) || 0),
      ph,
      m.indiceRefraccionReal !== undefined && m.indiceRefraccionReal !== null ? Number(m.indiceRefraccionReal) : null,
      m.temperaturaRealMedida !== undefined && m.temperaturaRealMedida !== null ? Number(m.temperaturaRealMedida) : null,
      m.viscosidadFinalReal !== undefined && m.viscosidadFinalReal !== null ? Number(m.viscosidadFinalReal) : null,
      creadoEn
    );
    contador++;
  }

  if (contador > 0) {
    const primerLote = String(muestras[0]?.loteId || muestras[0]?.lote_id || 'LOTE-FEEDBACK').trim();
    sincronizarFeedbackANeon(muestras).catch((err) => {
      console.warn('[SQLite->Neon] Aviso al sincronizar feedback:', err.message);
    });
    registrarAuditoriaSQLite({
      accion: 'REGISTRAR_FEEDBACK',
      entidadAfectada: 'dataset_retroalimentacion',
      registroAfectadoId: primerLote,
      datosPosteriores: { lote_id: primerLote, muestras_incorporadas: contador },
    });
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
  const muestrasNuevas = countMuestras ? countMuestras.total : 0;
  const lotesNuevos = countLotes ? countLotes.total : 0;

  return {
    muestrasNuevas,
    lotesNuevos,
    muestras_totales: muestrasNuevas,
    lotes_incorporados: lotesNuevos,
  };
}

/**
 * Guarda o actualiza un ensayo experimental de laboratorio en SQLite
 */
function guardarEnsayoLaboratorio(e) {
  const loteId = String(e.lote_id || e.loteId || 'LOTE-EXP-' + Date.now()).trim();
  const investigador = String(e.investigador || 'Lab. Química de Alimentos — ULEAM').trim();
  const usuarioEmail = String(e.usuario_email || e.usuarioEmail || 'carlos.delgado@uleam.edu.ec').trim().toLowerCase();
  const usuarioId = Number(e.usuario_id || e.usuarioId || 1);
  const tipoSustrato = e.tipoSustrato || e.tipo_sustrato || 'vaca';
  const tipoAzucar = e.tipoAzucar || e.tipo_azucar || 'sacarosa';
  const tempC = Number(e.temperaturaC || e.temperatura_c || 42.0);
  const masaG = Number(e.masaInoculoG || e.masa_inoculo_g || 18.75);
  const volMl = Number(e.volumenMl || e.volumen_ml || 250);
  const pctInoc = Number(e.porcentajeInoculo || e.porcentaje_inoculo || ((masaG / volMl) * 100).toFixed(2));
  const tCorteIniH = Number(e.tiempoCorteInicialHoras || e.tiempo_corte_inicial_horas || e.tiempoCorteHoras || 4.25);
  const tCorteIniM = Number(e.tiempoCorteInicialMinutos || e.tiempo_corte_inicial_minutos || e.tiempoCorteMinutos || 255);
  const tCorteEstH = Number(e.tiempoCorteEstimadoHoras || e.tiempo_corte_estimado_horas || tCorteIniH);
  const tCorteEstM = Number(e.tiempoCorteEstimadoMinutos || e.tiempo_corte_estimado_minutos || tCorteIniM);
  const diffM = Number(e.diferenciaMinutos || e.diferencia_minutos || 0);
  const estado = e.estado || 'EN_CURSO';

  let lecturas = [
    { tiempo_minutos: 0, ph: 6.50, temperatura: tempC, indice_refraccion: null, registrado_en: new Date().toISOString() }
  ];
  if (Array.isArray(e.lecturas) && e.lecturas.length > 0) {
    lecturas = e.lecturas;
  } else if (e.lecturas_json) {
    try {
      lecturas = JSON.parse(e.lecturas_json);
    } catch (_) {}
  }

  const diagnostico = e.diagnostico || '';
  const now = new Date().toISOString();

  const existente = db.prepare(`SELECT * FROM ensayos_laboratorio WHERE lote_id = ?`).get(loteId);

  if (existente) {
    db.prepare(`
      UPDATE ensayos_laboratorio SET
        investigador = ?,
        tipo_sustrato = ?,
        tipo_azucar = ?,
        temperatura_c = ?,
        masa_inoculo_g = ?,
        volumen_ml = ?,
        porcentaje_inoculo = ?,
        tiempo_corte_estimado_horas = ?,
        tiempo_corte_estimado_minutos = ?,
        diferencia_minutos = ?,
        estado = ?,
        lecturas_json = ?,
        diagnostico = ?,
        actualizado_en = ?,
        usuario_email = COALESCE(?, usuario_email),
        usuario_id = COALESCE(?, usuario_id)
      WHERE lote_id = ?
    `).run(
      investigador,
      tipoSustrato,
      tipoAzucar,
      tempC,
      masaG,
      volMl,
      pctInoc,
      tCorteEstH,
      tCorteEstM,
      diffM,
      estado,
      JSON.stringify(lecturas),
      diagnostico,
      now,
      usuarioEmail,
      usuarioId,
      loteId
    );
  } else {
    db.prepare(`
      INSERT INTO ensayos_laboratorio (
        lote_id, investigador, tipo_sustrato, tipo_azucar, temperatura_c, masa_inoculo_g, volumen_ml,
        porcentaje_inoculo, tiempo_corte_inicial_horas, tiempo_corte_inicial_minutos,
        tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos, diferencia_minutos,
        estado, lecturas_json, diagnostico, creado_en, actualizado_en, usuario_id, usuario_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      loteId,
      investigador,
      tipoSustrato,
      tipoAzucar,
      tempC,
      masaG,
      volMl,
      pctInoc,
      tCorteIniH,
      tCorteIniM,
      tCorteEstH,
      tCorteEstM,
      diffM,
      estado,
      JSON.stringify(lecturas),
      diagnostico,
      now,
      now,
      usuarioId,
      usuarioEmail
    );
  }

  const resultado = obtenerEnsayoLaboratorio(loteId);
  sincronizarEnsayoANeon(resultado).catch((err) => {
    console.warn('[SQLite->Neon] Aviso al sincronizar ensayo:', err.message);
  });

  registrarAuditoriaSQLite({
    usuarioId,
    usuarioEmail,
    accion: existente ? 'ACTUALIZAR_ENSAYO' : 'CREAR_ENSAYO',
    entidadAfectada: 'ensayos',
    registroAfectadoId: loteId,
    datosAnteriores: existente ? { estado: existente.estado, temperatura_c: existente.temperatura_c } : null,
    datosPosteriores: {
      lote_id: loteId,
      tipo_sustrato: tipoSustrato,
      temperatura_c: tempC,
      porcentaje_inoculo: pctInoc,
      estado,
    },
  });

  return resultado;
}

/**
 * Retorna todos los ensayos ordenados cronológicamente (más recientes primero)
 */
function listarEnsayosLaboratorio(limite = 100, filtroUsuarioEmail = null) {
  let rows;
  if (filtroUsuarioEmail) {
    rows = db.prepare(`SELECT * FROM ensayos_laboratorio WHERE LOWER(usuario_email) = LOWER(?) ORDER BY actualizado_en DESC, id DESC LIMIT ?`).all(String(filtroUsuarioEmail).trim(), limite);
  } else {
    rows = db.prepare(`SELECT * FROM ensayos_laboratorio ORDER BY actualizado_en DESC, id DESC LIMIT ?`).all(limite);
  }
  return rows.map((r) => {
    let lecturas = [];
    try {
      lecturas = JSON.parse(r.lecturas_json || '[]');
    } catch (_) {
      lecturas = [];
    }
    return {
      id: r.id,
      lote_id: r.lote_id,
      investigador: r.investigador,
      usuario_id: r.usuario_id || 1,
      usuario_email: r.usuario_email || 'carlos.delgado@uleam.edu.ec',
      tipo_sustrato: r.tipo_sustrato,
      tipo_azucar: r.tipo_azucar,
      temperatura_c: r.temperatura_c,
      masa_inoculo_g: r.masa_inoculo_g,
      volumen_ml: r.volumen_ml,
      porcentaje_inoculo: r.porcentaje_inoculo,
      tiempo_corte_inicial_horas: r.tiempo_corte_inicial_horas,
      tiempo_corte_inicial_minutos: r.tiempo_corte_inicial_minutos,
      tiempo_corte_estimado_horas: r.tiempo_corte_estimado_horas,
      tiempo_corte_estimado_minutos: r.tiempo_corte_estimado_minutos,
      diferencia_minutos: r.diferencia_minutos,
      estado: r.estado,
      viscosidad_final: r.viscosidad_final !== undefined ? r.viscosidad_final : null,
      es_referencia_cientifica: Boolean(r.es_referencia_cientifica),
      parametro_t50: r.parametro_t50 !== undefined ? r.parametro_t50 : null,
      parametro_gamma: r.parametro_gamma !== undefined ? r.parametro_gamma : null,
      brix_final: r.brix_final !== undefined ? r.brix_final : null,
      lecturas,
      total_lecturas: lecturas.length,
      diagnostico: r.diagnostico,
      creado_en: r.creado_en,
      actualizado_en: r.actualizado_en,
    };
  });
}

/**
 * Obtiene un ensayo específico con sus lecturas completas
 */
function obtenerEnsayoLaboratorio(loteId) {
  const clean = String(loteId).trim();
  const idNum = Number(clean);
  const r = (!Number.isNaN(idNum) && idNum > 0)
    ? db.prepare(`SELECT * FROM ensayos_laboratorio WHERE lote_id = ? OR id = ? LIMIT 1`).get(clean, idNum)
    : db.prepare(`SELECT * FROM ensayos_laboratorio WHERE lote_id = ? LIMIT 1`).get(clean);
  if (!r) return null;
  let lecturas = [];
  try {
    lecturas = JSON.parse(r.lecturas_json || '[]');
  } catch (_) {
    lecturas = [];
  }
  return {
    id: r.id,
    lote_id: r.lote_id,
    investigador: r.investigador,
    usuario_id: r.usuario_id || 1,
    usuario_email: r.usuario_email || 'carlos.delgado@uleam.edu.ec',
    tipo_sustrato: r.tipo_sustrato,
    tipo_azucar: r.tipo_azucar,
    temperatura_c: r.temperatura_c,
    masa_inoculo_g: r.masa_inoculo_g,
    volumen_ml: r.volumen_ml,
    porcentaje_inoculo: r.porcentaje_inoculo,
    tiempo_corte_inicial_horas: r.tiempo_corte_inicial_horas,
    tiempo_corte_inicial_minutos: r.tiempo_corte_inicial_minutos,
    tiempo_corte_estimado_horas: r.tiempo_corte_estimado_horas,
    tiempo_corte_estimado_minutos: r.tiempo_corte_estimado_minutos,
    diferencia_minutos: r.diferencia_minutos,
    estado: r.estado,
    viscosidad_final: r.viscosidad_final !== undefined ? r.viscosidad_final : null,
    es_referencia_cientifica: Boolean(r.es_referencia_cientifica),
    parametro_t50: r.parametro_t50 !== undefined ? r.parametro_t50 : null,
    parametro_gamma: r.parametro_gamma !== undefined ? r.parametro_gamma : null,
    brix_final: r.brix_final !== undefined ? r.brix_final : null,
    lecturas,
    total_lecturas: lecturas.length,
    diagnostico: r.diagnostico,
    creado_en: r.creado_en,
    actualizado_en: r.actualizado_en,
  };
}

/**
 * Agrega o actualiza una lectura periódica en un ensayo existente y recalibra
 */
function registrarLecturaEnEnsayo(loteId, nuevaLectura, recalibracion = {}) {
  const ensayo = obtenerEnsayoLaboratorio(loteId);
  if (!ensayo) throw new Error(`El ensayo con lote '${loteId}' no existe en SQLite.`);

  const lecturas = [...ensayo.lecturas];
  const tMin = Number(nuevaLectura.tiempo_minutos !== undefined ? nuevaLectura.tiempo_minutos : nuevaLectura.minutos);
  const ph = Number(nuevaLectura.ph);
  const temp = Number(nuevaLectura.temperatura !== undefined ? nuevaLectura.temperatura : (nuevaLectura.temperatura_c || ensayo.temperatura_c));
  const brix = nuevaLectura.indice_refraccion !== undefined && nuevaLectura.indice_refraccion !== null
    ? Number(nuevaLectura.indice_refraccion)
    : (nuevaLectura.brix !== undefined && nuevaLectura.brix !== null ? Number(nuevaLectura.brix) : null);

  const idx = lecturas.findIndex((l) => Number(l.tiempo_minutos !== undefined ? l.tiempo_minutos : l.minutos) === tMin);
  const entry = {
    tiempo_minutos: tMin,
    ph,
    temperatura: temp,
    indice_refraccion: brix,
    registrado_en: new Date().toISOString(),
  };

  if (idx >= 0) {
    lecturas[idx] = entry;
  } else {
    lecturas.push(entry);
  }

  lecturas.sort((a, b) => Number(a.tiempo_minutos) - Number(b.tiempo_minutos));

  const tCorteEstH = recalibracion.tiempoCorteRecalibradoHoras !== undefined ? recalibracion.tiempoCorteRecalibradoHoras : ensayo.tiempo_corte_estimado_horas;
  const tCorteEstM = recalibracion.tiempoCorteRecalibradoMinutos !== undefined ? recalibracion.tiempoCorteRecalibradoMinutos : ensayo.tiempo_corte_estimado_minutos;
  const diffM = recalibracion.deltaMinutos !== undefined ? recalibracion.deltaMinutos : ensayo.diferencia_minutos;
  const diag = recalibracion.diagnostico || ensayo.diagnostico;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE ensayos_laboratorio SET
      lecturas_json = ?,
      tiempo_corte_estimado_horas = ?,
      tiempo_corte_estimado_minutos = ?,
      diferencia_minutos = ?,
      diagnostico = ?,
      actualizado_en = ?
    WHERE lote_id = ?
  `).run(
    JSON.stringify(lecturas),
    tCorteEstH,
    tCorteEstM,
    diffM,
    diag,
    now,
    loteId
  );

  const actualizado = obtenerEnsayoLaboratorio(loteId);
  sincronizarEnsayoANeon(actualizado).catch((err) => {
    console.warn('[SQLite->Neon] Aviso al sincronizar lectura:', err.message);
  });

  registrarAuditoriaSQLite({
    usuarioEmail: ensayo.usuario_email,
    accion: 'REGISTRAR_LECTURA',
    entidadAfectada: 'lecturas_ensayo',
    registroAfectadoId: `${loteId}:min_${tMin}`,
    datosPosteriores: entry,
  });

  return actualizado;
}

/**
 * Elimina un ensayo y sus lecturas
 */
function eliminarEnsayoLaboratorio(loteId) {
  const previo = obtenerEnsayoLaboratorio(loteId);
  const info = db.prepare(`DELETE FROM ensayos_laboratorio WHERE lote_id = ?`).run(String(loteId).trim());
  if (info.changes > 0) {
    registrarAuditoriaSQLite({
      usuarioEmail: previo?.usuario_email || null,
      accion: 'ELIMINAR_ENSAYO',
      entidadAfectada: 'ensayos',
      registroAfectadoId: String(loteId).trim(),
      datosAnteriores: previo ? { lote_id: previo.lote_id, estado: previo.estado } : null,
    });
  }
  return info.changes > 0;
}

/**
 * Finaliza un ensayo experimental en SQLite asignando el estado completado y la viscosidad final medida
 * @param {string|number} idOLoteId
 * @param {number} viscosidadFinal
 */
function finalizarEnsayoLaboratorioSQLite(idOLoteId, viscosidadFinal) {
  const ahora = new Date().toISOString();
  const idNum = Number(idOLoteId);
  const loteStr = String(idOLoteId).trim();

  if (!Number.isNaN(idNum) && idNum > 0) {
    db.prepare(`
      UPDATE ensayos_laboratorio 
      SET estado = 'completado', viscosidad_final = ?, actualizado_en = ? 
      WHERE id = ? OR lote_id = ?
    `).run(Number(viscosidadFinal), ahora, idNum, loteStr);
  } else {
    db.prepare(`
      UPDATE ensayos_laboratorio 
      SET estado = 'completado', viscosidad_final = ?, actualizado_en = ? 
      WHERE lote_id = ?
    `).run(Number(viscosidadFinal), ahora, loteStr);
  }

  const finalizado = obtenerEnsayoLaboratorio(idOLoteId);
  registrarAuditoriaSQLite({
    usuarioEmail: finalizado?.usuario_email || null,
    accion: 'FINALIZAR_ENSAYO',
    entidadAfectada: 'ensayos',
    registroAfectadoId: finalizado?.lote_id || loteStr,
    datosPosteriores: { estado: 'completado', viscosidad_final: Number(viscosidadFinal) },
  });
  return finalizado;
}

/**
 * Elimina una lectura periódica específica de un ensayo
 */
function eliminarLecturaDeEnsayo(loteId, min) {
  const ensayo = obtenerEnsayoLaboratorio(loteId);
  if (!ensayo) return null;
  const lecturas = ensayo.lecturas.filter((l) => Number(l.tiempo_minutos) !== Number(min));
  db.prepare(`UPDATE ensayos_laboratorio SET lecturas_json = ?, actualizado_en = ? WHERE lote_id = ?`)
    .run(JSON.stringify(lecturas), new Date().toISOString(), loteId);
  const resultado = obtenerEnsayoLaboratorio(loteId);
  registrarAuditoriaSQLite({
    usuarioEmail: ensayo.usuario_email,
    accion: 'ELIMINAR_LECTURA',
    entidadAfectada: 'lecturas_ensayo',
    registroAfectadoId: `${loteId}:min_${min}`,
    datosAnteriores: { lote_id: loteId, minuto_eliminado: Number(min) },
  });

  return resultado;
}


/**
 * Crea un nuevo usuario en la base de datos SQLite local
 */
function crearUsuarioSQLite(nombreOData, correoLegacy, contrasenaHashLegacy, rolLegacy = 'estudiante') {
  const now = new Date().toISOString();
  let nombre, apellidos, username, correo, contrasenaHash, rol;

  if (typeof nombreOData === 'object' && nombreOData !== null) {
    nombre = nombreOData.nombre || '';
    apellidos = nombreOData.apellidos || '';
    username = nombreOData.username || '';
    correo = nombreOData.correo || nombreOData.email || '';
    contrasenaHash = nombreOData.contrasenaHash || nombreOData.contrasena || nombreOData.password;
    rol = nombreOData.rol || 'estudiante';
  } else {
    nombre = nombreOData || '';
    apellidos = '';
    correo = correoLegacy || '';
    username = correo ? correo.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') : '';
    contrasenaHash = contrasenaHashLegacy;
    rol = rolLegacy || 'estudiante';
  }

  const cleanNombre = String(nombre).trim();
  const cleanApellidos = String(apellidos).trim();
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanCorreo = String(correo).trim().toLowerCase();
  const cleanRol = String(rol).trim().toLowerCase();

  const info = db.prepare(`
    INSERT INTO usuarios (nombre, apellidos, username, correo, contrasena, rol, creado_en)
    VALUES (?, ?, ?, LOWER(?), ?, ?, ?)
  `).run(cleanNombre, cleanApellidos, cleanUsername, cleanCorreo, contrasenaHash, cleanRol, now);

  return {
    id: info.lastInsertRowid,
    nombre: cleanNombre,
    apellidos: cleanApellidos,
    username: cleanUsername,
    email: cleanCorreo,
    correo: cleanCorreo,
    rol: cleanRol,
    activo: 1,
    created_at: now,
  };
}

/**
 * Busca un usuario por correo electrónico en SQLite
 */
function buscarUsuarioPorEmailSQLite(correo) {
  if (!correo) return null;
  return db.prepare(`SELECT * FROM usuarios WHERE LOWER(correo) = LOWER(?)`).get(String(correo).trim()) || null;
}

/**
 * Busca un usuario por nombre de usuario en SQLite
 */
function buscarUsuarioPorUsernameSQLite(username) {
  if (!username) return null;
  return db.prepare(`SELECT * FROM usuarios WHERE LOWER(username) = LOWER(?)`).get(String(username).trim()) || null;
}

/**
 * Busca un usuario por identificador (correo o nombre de usuario) en SQLite
 */
function buscarUsuarioPorIdentificadorSQLite(identificador) {
  if (!identificador) return null;
  const idLimpio = String(identificador).trim().toLowerCase();
  return db.prepare(`
    SELECT * FROM usuarios 
    WHERE LOWER(correo) = ? OR LOWER(username) = ?
    LIMIT 1
  `).get(idLimpio, idLimpio) || null;
}

/**
 * Busca un usuario por ID en SQLite
 */
function buscarUsuarioPorIdSQLite(id) {
  if (!id) return null;
  return db.prepare(`
    SELECT id, nombre, apellidos, username, correo, rol, activo, creado_en 
    FROM usuarios WHERE id = ?
  `).get(Number(id)) || null;
}

/**
 * Busca un usuario por token de recuperación vigente
 */
function buscarUsuarioPorResetTokenSQLite(token) {
  if (!token) return null;
  return db.prepare(`
    SELECT * FROM usuarios 
    WHERE reset_token = ? AND reset_token IS NOT NULL
    LIMIT 1
  `).get(String(token).trim()) || null;
}

/**
 * Guarda token de recuperación y su expiración para un usuario
 */
function guardarResetTokenSQLite(id, token, expiraIso) {
  if (!id) return false;
  return db.prepare(`
    UPDATE usuarios 
    SET reset_token = ?, reset_token_expira = ? 
    WHERE id = ?
  `).run(token, expiraIso, Number(id));
}

/**
 * Actualiza la contraseña usando el flujo de reseteo por token
 */
function actualizarPasswordPorTokenSQLite(id, contrasenaHash) {
  if (!id) return false;
  return db.prepare(`
    UPDATE usuarios 
    SET contrasena = ?, reset_token = NULL, reset_token_expira = NULL, intentos_fallidos = 0, bloqueado_hasta = NULL 
    WHERE id = ?
  `).run(contrasenaHash, Number(id));
}

/**
 * Registra un intento fallido de autenticación. Bloquea si supera 5 intentos.
 */
function registrarIntentoFallidoSQLite(id) {
  if (!id) return null;
  const user = db.prepare(`SELECT id, intentos_fallidos FROM usuarios WHERE id = ?`).get(Number(id));
  if (!user) return null;

  const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
  let bloqueadoHasta = null;

  if (nuevosIntentos >= 5) {
    // Bloqueo temporal por 15 minutos (OWASP brute force mitigation)
    const lockoutDate = new Date(Date.now() + 15 * 60 * 1000);
    bloqueadoHasta = lockoutDate.toISOString();
  }

  db.prepare(`
    UPDATE usuarios 
    SET intentos_fallidos = ?, bloqueado_hasta = ? 
    WHERE id = ?
  `).run(nuevosIntentos, bloqueadoHasta, Number(id));

  return { intentos_fallidos: nuevosIntentos, bloqueado_hasta: bloqueadoHasta };
}

/**
 * Resetea el contador de intentos fallidos y el bloqueo temporal tras login exitoso
 */
function resetearIntentosFallidosSQLite(id) {
  if (!id) return;
  try {
    db.exec(`ALTER TABLE usuarios ADD COLUMN ultimo_acceso TEXT DEFAULT NULL`);
  } catch (_) {}
  db.prepare(`
    UPDATE usuarios 
    SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = ? 
    WHERE id = ?
  `).run(new Date().toISOString(), Number(id));
}

/**
 * Obtiene el último usuario que inició sesión o se registró en el sistema
 */
function obtenerUltimoUsuarioActivoSQLite() {
  try {
    db.exec(`ALTER TABLE usuarios ADD COLUMN ultimo_acceso TEXT DEFAULT NULL`);
  } catch (_) {}
  const conAcceso = db.prepare(`
    SELECT id, nombre, apellidos, username, correo, rol
    FROM usuarios
    WHERE ultimo_acceso IS NOT NULL
    ORDER BY ultimo_acceso DESC, id DESC
    LIMIT 1
  `).get();
  if (conAcceso) return conAcceso;

  return db.prepare(`
    SELECT id, nombre, apellidos, username, correo, rol
    FROM usuarios
    WHERE correo NOT LIKE 'bruteforce.%' AND correo NOT LIKE 'investigador.17%'
    ORDER BY id DESC
    LIMIT 1
  `).get() || null;
}

/**
 * Lista todos los usuarios registrados en SQLite
 */
function listarUsuariosSQLite() {
  return db.prepare(`
    SELECT id, nombre, apellidos, username, correo, rol, activo, creado_en 
    FROM usuarios ORDER BY id ASC
  `).all();
}

/**
 * Archiva un ensayo experimental en SQLite cambiando su estado a 'archivado'
 */
function archivarEnsayoLaboratorioSQLite(idOLoteId) {
  const ahora = new Date().toISOString();
  const idNum = Number(idOLoteId);
  const loteStr = String(idOLoteId).trim();

  if (!Number.isNaN(idNum) && idNum > 0) {
    db.prepare(`
      UPDATE ensayos_laboratorio
      SET estado = 'archivado', actualizado_en = ?
      WHERE id = ? OR lote_id = ?
    `).run(ahora, idNum, loteStr);
  } else {
    db.prepare(`
      UPDATE ensayos_laboratorio
      SET estado = 'archivado', actualizado_en = ?
      WHERE lote_id = ?
    `).run(ahora, loteStr);
  }

  const archivado = obtenerEnsayoLaboratorio(idOLoteId);
  registrarAuditoriaSQLite({
    usuarioEmail: archivado?.usuario_email || null,
    accion: 'ARCHIVAR_ENSAYO',
    entidadAfectada: 'ensayos',
    registroAfectadoId: archivado?.lote_id || loteStr,
    datosPosteriores: { estado: 'archivado' },
  });

  return archivado;
}

/**
 * Sanitiza un objeto antes de registrarlo en auditoría para garantizar que jamás
 * se almacenen contraseñas, hashes, tokens JWT ni secretos (Sección 5.6).
 */
function sanitizarDatosAuditoria(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const camposProhibidos = new Set([
    'password',
    'contrasena',
    'password_hash',
    'contrasenaHash',
    'confirmPassword',
    'confirmarContrasena',
    'token',
    'reset_token',
    'jwt',
    'secret',
    'authorization',
  ]);
  const limpio = {};
  for (const [k, v] of Object.entries(obj)) {
    if (camposProhibidos.has(k) || /password|token|secret|contrasena/i.test(k)) {
      continue;
    }
    limpio[k] = v;
  }
  return limpio;
}

/**
 * Registra un evento en la tabla de auditoría local SQLite
 */
function registrarAuditoriaSQLite({
  usuarioId = null,
  usuarioEmail = null,
  accion,
  entidadAfectada,
  registroAfectadoId = null,
  datosAnteriores = null,
  datosPosteriores = null,
  informacionTecnica = {},
}) {
  try {
    const fechaEvento = new Date().toISOString();
    const antLimpio = sanitizarDatosAuditoria(datosAnteriores);
    const postLimpio = sanitizarDatosAuditoria(datosPosteriores);
    const infoLimpia = sanitizarDatosAuditoria(informacionTecnica) || {};

    const info = db.prepare(`
      INSERT INTO auditoria_operaciones (
        usuario_id, usuario_email, accion, entidad_afectada, registro_afectado_id,
        datos_anteriores, datos_posteriores, informacion_tecnica, fecha_evento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuarioId !== null && usuarioId !== undefined ? String(usuarioId) : null,
      usuarioEmail ? String(usuarioEmail).trim().toLowerCase() : null,
      String(accion || 'OPERACION'),
      String(entidadAfectada || 'sistema'),
      registroAfectadoId !== null && registroAfectadoId !== undefined ? String(registroAfectadoId) : null,
      antLimpio ? JSON.stringify(antLimpio) : null,
      postLimpio ? JSON.stringify(postLimpio) : null,
      JSON.stringify(infoLimpia),
      fechaEvento
    );

    const auditEntry = {
      id: Number(info.lastInsertRowid),
      usuario_id: usuarioId,
      usuario_email: usuarioEmail,
      accion: String(accion || 'OPERACION'),
      entidad_afectada: String(entidadAfectada || 'sistema'),
      registro_afectado_id: registroAfectadoId !== null && registroAfectadoId !== undefined ? String(registroAfectadoId) : null,
      datos_anteriores: antLimpio,
      datos_posteriores: postLimpio,
      informacion_tecnica: infoLimpia,
      fecha_evento: fechaEvento,
    };

    sincronizarAuditoriaANeon(auditEntry).catch(() => {});

    return auditEntry;
  } catch (e) {
    console.warn('[SQLite Auditoría] Aviso al registrar auditoría:', e.message);
    return null;
  }
}

/**
 * Consulta los registros de auditoría más recientes en SQLite
 */
function listarAuditoriaSQLite(limite = 100) {
  const rows = db.prepare(`
    SELECT * FROM auditoria_operaciones
    ORDER BY id DESC
    LIMIT ?
  `).all(Number(limite) || 100);

  return rows.map((r) => ({
    id: r.id,
    usuario_id: r.usuario_id,
    usuario_email: r.usuario_email,
    accion: r.accion,
    entidad_afectada: r.entidad_afectada,
    registro_afectado_id: r.registro_afectado_id,
    datos_anteriores: r.datos_anteriores ? JSON.parse(r.datos_anteriores) : null,
    datos_posteriores: r.datos_posteriores ? JSON.parse(r.datos_posteriores) : null,
    informacion_tecnica: r.informacion_tecnica ? JSON.parse(r.informacion_tecnica) : {},
    fecha_evento: r.fecha_evento,
  }));
}

/**
 * Registra el resultado de una operación de sincronización híbrida SQLite <-> Neon
 */
function registrarSincronizacionSQLite({
  entidad,
  claveUnica,
  sqliteId = null,
  neonUuid = null,
  operacion = 'UPSERT',
  estado = 'SINCRONIZADO',
  detalleError = null,
}) {
  try {
    const ahora = new Date().toISOString();
    db.prepare(`
      INSERT INTO sincronizacion_historial (
        entidad, clave_unica, sqlite_id, neon_uuid, operacion, estado, detalle_error, sincronizado_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(entidad),
      String(claveUnica),
      sqliteId !== null && sqliteId !== undefined ? Number(sqliteId) : null,
      neonUuid ? String(neonUuid) : null,
      String(operacion),
      String(estado),
      detalleError ? String(detalleError) : null,
      ahora
    );
  } catch (e) {
    console.warn('[SQLite Sincronización] Aviso al registrar trazabilidad:', e.message);
  }
}

/**
 * Lista el historial de sincronización SQLite <-> Neon
 */
function listarSincronizacionSQLite(limite = 50) {
  return db.prepare(`
    SELECT * FROM sincronizacion_historial
    ORDER BY id DESC
    LIMIT ?
  `).all(Number(limite) || 50);
}

/**
 * Resuelve el UUID de un usuario en Neon PostgreSQL a partir de su email, investigador o sesión activa
 */
async function resolverUsuarioUuidNeon(pool, { usuarioEmail, usuarioId, investigador, esReferencia = false }) {
  if (!pool || !pool.isNeonConfigured()) return { id: null, email: usuarioEmail || null };

  if (esReferencia) {
    const r = await pool.query(
      `SELECT id, email FROM usuarios WHERE LOWER(email) = 'dr.santacruz@uleam.edu.ec' LIMIT 1`
    );
    if (r.rowCount > 0) return r.rows[0];
  }

  // 1. Si el email es de un usuario específico (distinto del fallback genérico), buscar por email exacto
  const emailClean = usuarioEmail ? String(usuarioEmail).trim().toLowerCase() : '';
  if (emailClean && emailClean !== 'carlos.delgado@uleam.edu.ec') {
    const r = await pool.query(
      `SELECT id, email FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [emailClean]
    );
    if (r.rowCount > 0) return r.rows[0];
  }

  // 2. Si el nombre del investigador coincide con un usuario real en Neon (preferir cuentas creadas recientemente)
  if (investigador) {
    const invClean = String(investigador).trim();
    if (invClean && !invClean.toLowerCase().includes('lab.') && !invClean.toLowerCase().includes('uleam')) {
      const r = await pool.query(
        `SELECT id, email FROM usuarios
         WHERE LOWER(TRIM(nombre || ' ' || COALESCE(apellidos, ''))) = LOWER($1)
            OR LOWER(nombre) = LOWER($1)
            OR LOWER($1) LIKE '%' || LOWER(nombre) || '%'
         ORDER BY sqlite_id DESC NULLS LAST
         LIMIT 1`,
        [invClean]
      );
      if (r.rowCount > 0) return r.rows[0];
    }
  }

  // 3. Si tiene usuarioId explícito (> 3)
  if (usuarioId && Number(usuarioId) > 3) {
    const r = await pool.query(
      `SELECT id, email FROM usuarios WHERE sqlite_id = $1 LIMIT 1`,
      [Number(usuarioId)]
    );
    if (r.rowCount > 0) return r.rows[0];
  }

  // 4. Usar el último usuario real activo en la aplicación
  const ultimoLocal = obtenerUltimoUsuarioActivoSQLite();
  if (ultimoLocal && ultimoLocal.correo) {
    const r = await pool.query(
      `SELECT id, email FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [ultimoLocal.correo]
    );
    if (r.rowCount > 0) return r.rows[0];
  }

  // 5. Fallback por email si era carlos.delgado@uleam.edu.ec
  if (emailClean) {
    const r = await pool.query(
      `SELECT id, email FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [emailClean]
    );
    if (r.rowCount > 0) return r.rows[0];
  }

  const fallback = await pool.query(
    `SELECT id, email FROM usuarios ORDER BY sqlite_id DESC NULLS LAST LIMIT 1`
  );
  return fallback.rowCount > 0 ? fallback.rows[0] : { id: null, email: usuarioEmail || null };
}

/**
 * Sincroniza un ensayo y todas sus lecturas en tiempo real hacia Neon PostgreSQL
 * vinculando siempre `usuario_id` (UUID) para que aparezca en las relaciones de Neon
 */
async function sincronizarEnsayoANeon(trial) {
  if (!trial) return null;
  const pool = require('../config/db');
  if (!pool.isNeonConfigured()) return null;

  const userNeon = await resolverUsuarioUuidNeon(pool, {
    usuarioEmail: trial.usuario_email,
    usuarioId: trial.usuario_id,
    investigador: trial.investigador,
    esReferencia: Boolean(trial.es_referencia_cientifica),
  });

  const sustratosValidos = new Set(['vaca', 'avena', 'almendra', 'chocho', 'coco', 'soya', 'otra', 'vegetal_chocho', 'vegetal_coco']);
  const sustratoNorm = sustratosValidos.has(String(trial.tipo_sustrato).toLowerCase())
    ? String(trial.tipo_sustrato).toLowerCase()
    : 'otra';

  const azucaresValidos = new Set(['lactosa', 'sacarosa', 'glucosa', 'mezcla_sacarosa_glucosa']);
  const azucarNorm = azucaresValidos.has(String(trial.tipo_azucar).toLowerCase())
    ? String(trial.tipo_azucar).toLowerCase()
    : 'sacarosa';

  const resEnsayo = await pool.query(
    `INSERT INTO ensayos (
       sqlite_id, codigo, nombre_lote, usuario_id, usuario_email, investigador,
       tipo_sustrato, tipo_azucar, masa_solucion_g, volumen_ml,
       porcentaje_inoculo, masa_inoculo_g, temperatura_incubacion,
       tiempo_corte_inicial_horas, tiempo_corte_inicial_minutos,
       tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos,
       diferencia_minutos, viscosidad_final_mpas, estado,
       es_referencia_cientifica, diagnostico, origen_sincronizacion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'sqlite_local')
     ON CONFLICT (codigo) DO UPDATE SET
       sqlite_id = COALESCE(EXCLUDED.sqlite_id, ensayos.sqlite_id),
       usuario_id = EXCLUDED.usuario_id,
       usuario_email = EXCLUDED.usuario_email,
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
       viscosidad_final_mpas = COALESCE(EXCLUDED.viscosidad_final_mpas, ensayos.viscosidad_final_mpas),
       estado = EXCLUDED.estado,
       diagnostico = EXCLUDED.diagnostico,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [
      trial.id || null,
      trial.lote_id,
      trial.lote_id,
      userNeon.id,
      userNeon.email || trial.usuario_email,
      trial.investigador || 'Investigador ULEAM',
      sustratoNorm,
      azucarNorm,
      Number(trial.volumen_ml || 250),
      Number(trial.volumen_ml || 250),
      Number(trial.porcentaje_inoculo || 7.5),
      Number(trial.masa_inoculo_g || 18.75),
      Number(trial.temperatura_c || 42.0),
      Number(trial.tiempo_corte_inicial_horas || 4.25),
      Number(trial.tiempo_corte_inicial_minutos || 255),
      Number(trial.tiempo_corte_estimado_horas || 4.25),
      Number(trial.tiempo_corte_estimado_minutos || 255),
      Number(trial.diferencia_minutos || 0),
      trial.viscosidad_final !== undefined && trial.viscosidad_final !== null ? Number(trial.viscosidad_final) : null,
      trial.estado || 'EN_CURSO',
      Boolean(trial.es_referencia_cientifica),
      trial.diagnostico || '',
    ]
  );

  const ensayoUuid = resEnsayo.rows[0]?.id;
  if (ensayoUuid && Array.isArray(trial.lecturas)) {
    for (const lec of trial.lecturas) {
      const min = Number(lec.tiempo_minutos ?? lec.minutos ?? 0);
      const ph = Number(lec.ph ?? 6.25);
      const temp = Number(lec.temperatura ?? trial.temperatura_c ?? 42.0);
      const brix = lec.indice_refraccion !== undefined && lec.indice_refraccion !== null
        ? Number(lec.indice_refraccion)
        : null;

      await pool.query(
        `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
           ph = EXCLUDED.ph,
           temperatura = EXCLUDED.temperatura,
           indice_refraccion_brix = EXCLUDED.indice_refraccion_brix`,
        [ensayoUuid, min, ph, temp, brix]
      );
    }
  }

  return ensayoUuid;
}

/**
 * Sincroniza una predicción en tiempo real hacia Neon PostgreSQL vinculando `usuario_id` y `ensayo_id`
 */
async function sincronizarPrediccionANeon(p) {
  if (!p) return null;
  const pool = require('../config/db');
  if (!pool.isNeonConfigured()) return null;

  const loteCodigo = String(p.lote_id || p.lote_codigo || 'LOTE-SIM').trim();
  const ensRes = await pool.query(
    `SELECT id, usuario_id, investigador FROM ensayos WHERE codigo = $1 LIMIT 1`,
    [loteCodigo]
  );
  const ensayoUuid = ensRes.rowCount > 0 ? ensRes.rows[0].id : null;

  let usuarioUuid = ensRes.rowCount > 0 ? ensRes.rows[0].usuario_id : null;
  if (!usuarioUuid) {
    const u = await resolverUsuarioUuidNeon(pool, {
      usuarioEmail: p.usuario_email,
      usuarioId: p.usuario_id,
      investigador: p.investigador,
    });
    usuarioUuid = u.id;
  }

  const sqliteId = p.id ? Number(p.id) : null;
  await pool.query(
    `INSERT INTO predicciones (
       sqlite_id, ensayo_id, lote_codigo, usuario_id, investigador,
       tipo_sustrato, tipo_azucar, temperatura_c, porcentaje_inoculo,
       masa_inoculo_g, volumen_ml, tiempo_corte_horas, tiempo_corte_minutos,
       viscosidad_predicha_mpas, calidad_gel, diagnostico
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     ON CONFLICT (sqlite_id) DO UPDATE SET
       ensayo_id = COALESCE(EXCLUDED.ensayo_id, predicciones.ensayo_id),
       usuario_id = EXCLUDED.usuario_id,
       tiempo_corte_horas = EXCLUDED.tiempo_corte_horas,
       viscosidad_predicha_mpas = EXCLUDED.viscosidad_predicha_mpas`,
    [
      sqliteId,
      ensayoUuid,
      loteCodigo,
      usuarioUuid,
      p.investigador || 'Investigador ULEAM',
      p.tipoSustrato || p.tipo_sustrato || 'vaca',
      p.tipoAzucar || p.tipo_azucar || 'lactosa',
      Number(p.temperaturaC || p.temperatura_c || 42.0),
      Number(p.porcentajeInoculo || p.porcentaje_inoculo || 7.5),
      Number(p.masaInoculoG || p.masa_inoculo_g || 18.75),
      Number(p.volumenMl || p.volumen_ml || 250),
      Number(p.tiempoCorteHoras || p.tiempo_corte_horas || 4.25),
      Number(p.tiempoCorteMinutos || p.tiempo_corte_minutos || 255),
      Number(p.viscosidadPredichaMpaS || p.viscosidad_predicha_mpas || 2639),
      p.calidadGel || p.calidad_gel || 'ESTANDAR',
      p.diagnostico || '',
    ]
  );
}

/**
 * Sincroniza un registro de auditoría hacia Neon PostgreSQL vinculando `usuario_id`
 */
async function sincronizarAuditoriaANeon(a) {
  if (!a) return;
  const pool = require('../config/db');
  if (!pool.isNeonConfigured()) return;

  const userNeon = await resolverUsuarioUuidNeon(pool, {
    usuarioEmail: a.usuario_email,
    usuarioId: a.usuario_id,
  });

  await pool.query(
    `INSERT INTO auditoria_operaciones (
       usuario_id, usuario_email, accion, entidad_afectada, registro_afectado_id,
       datos_anteriores, datos_posteriores, informacion_tecnica, fecha_evento
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)`,
    [
      userNeon.id,
      userNeon.email || a.usuario_email,
      a.accion,
      a.entidad_afectada,
      a.registro_afectado_id,
      a.datos_anteriores ? JSON.stringify(a.datos_anteriores) : null,
      a.datos_posteriores ? JSON.stringify(a.datos_posteriores) : null,
      JSON.stringify(a.informacion_tecnica || {}),
      a.fecha_evento || new Date().toISOString(),
    ]
  );
}

/**
 * Sincroniza muestras de retroalimentación (Feedback Loop) hacia Neon PostgreSQL
 */
async function sincronizarFeedbackANeon(muestras = []) {
  if (!Array.isArray(muestras) || muestras.length === 0) return;
  const pool = require('../config/db');
  if (!pool.isNeonConfigured()) return;

  for (const m of muestras) {
    const loteCodigo = String(m.loteId || m.lote_id || m.lote_codigo || 'LOTE-FEEDBACK').trim();
    const ensRes = await pool.query(
      `SELECT id, usuario_id FROM ensayos WHERE codigo = $1 LIMIT 1`,
      [loteCodigo]
    );
    const ensayoUuid = ensRes.rowCount > 0 ? ensRes.rows[0].id : null;
    let usuarioUuid = ensRes.rowCount > 0 ? ensRes.rows[0].usuario_id : null;
    if (!usuarioUuid) {
      const u = await resolverUsuarioUuidNeon(pool, {
        usuarioEmail: m.usuario_email,
        usuarioId: m.usuario_id,
      });
      usuarioUuid = u.id;
    }

    const tMin = Math.round(Number(m.tiempoMinutos ?? m.tiempo_minutos ?? m.minutos ?? 0));
    const tHoras = Number((tMin / 60).toFixed(2));
    const phReal = Number(m.phReal ?? m.ph_real ?? m.ph ?? 6.20);
    const tempIncub = Number(m.temperaturaIncubacionC ?? m.temperatura_incubacion_c ?? m.temperatura_c ?? 42.0);
    const pctInoc = Number(m.porcentajeInoculo ?? m.porcentaje_inoculo ?? 7.5);
    const masaInoc = Number(m.masaInoculoG ?? m.masa_inoculo_g ?? 18.75);
    const tempMed = m.temperaturaRealMedida ?? m.temperatura_real_medida ?? m.temperatura ?? tempIncub;
    const brixReal = m.indiceRefraccionReal ?? m.indice_refraccion_real ?? m.indice_refraccion ?? null;
    const viscoReal = m.viscosidadFinalReal ?? m.viscosidad_final_real ?? null;
    const estadoVal = m.estado_validacion || (loteCodigo.startsWith('LOTE-CHV-4') ? 'referencia_oficial' : 'validado');

    await pool.query(
      `INSERT INTO dataset_retroalimentacion (
         ensayo_origen_id, lote_codigo, usuario_responsable_id,
         temperatura_incubacion_c, porcentaje_inoculo, masa_inoculo_g, volumen_ml,
         tiempo_minutos, tiempo_horas, ph_real, temperatura_real_medida,
         indice_refraccion_real, viscosidad_final_real, estado_validacion
       )
       VALUES ($1, $2, $3, $4, $5, $6, 250.0, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (lote_codigo, tiempo_minutos) DO UPDATE SET
         ensayo_origen_id = COALESCE(EXCLUDED.ensayo_origen_id, dataset_retroalimentacion.ensayo_origen_id),
         usuario_responsable_id = COALESCE(EXCLUDED.usuario_responsable_id, dataset_retroalimentacion.usuario_responsable_id),
         ph_real = EXCLUDED.ph_real,
         viscosidad_final_real = COALESCE(EXCLUDED.viscosidad_final_real, dataset_retroalimentacion.viscosidad_final_real)`,
      [
        ensayoUuid,
        loteCodigo,
        usuarioUuid,
        tempIncub,
        pctInoc,
        masaInoc,
        tMin,
        tHoras,
        phReal,
        tempMed !== null && tempMed !== undefined ? Number(tempMed) : null,
        brixReal !== null && brixReal !== undefined ? Number(brixReal) : null,
        viscoReal !== null && viscoReal !== undefined ? Number(viscoReal) : null,
        estadoVal,
      ]
    );
  }
}

/**
 * Sincroniza de forma masiva e idempotente todos los ensayos, lecturas, predicciones,
 * dataset de retroalimentación, auditoría e historial de sincronización hacia Neon PostgreSQL
 */
async function sincronizarTodoANeon() {
  const pool = require('../config/db');
  if (!pool.isNeonConfigured()) return;

  await pool.query(`ALTER TABLE ensayos DROP CONSTRAINT IF EXISTS ensayos_sqlite_id_key;`);

  const trials = listarEnsayosLaboratorio(200);
  for (const t of trials) {
    const neonUuid = await sincronizarEnsayoANeon(t);
    if (neonUuid) {
      await pool.query(
        `INSERT INTO sincronizacion_historial (entidad, clave_unica, sqlite_id, neon_uuid, operacion, estado)
         VALUES ('ensayos', $1, $2, $3, 'UPSERT', 'SINCRONIZADO')`,
        [t.lote_id, t.id || null, neonUuid]
      ).catch(() => {});
    }
  }

  const preds = listarPredicciones(200);
  for (const p of preds) {
    await sincronizarPrediccionANeon(p);
  }

  // Sincronizar dataset_retroalimentacion (muestras base + muestras de feedback + lecturas de ensayos de usuarios)
  const { getFlattenedDataset } = require('./dataset');
  const muestrasBase = getFlattenedDataset().map((m) => ({ ...m, estado_validacion: 'referencia_oficial' }));
  const muestrasFeedback = obtenerMuestrasFeedback().map((m) => ({ ...m, estado_validacion: 'validado' }));
  const muestrasEnsayosUsuarios = [];
  for (const t of trials) {
    if (!t.es_referencia_cientifica && Array.isArray(t.lecturas)) {
      for (const l of t.lecturas) {
        muestrasEnsayosUsuarios.push({
          loteId: t.lote_id,
          usuario_email: t.usuario_email,
          usuario_id: t.usuario_id,
          temperaturaIncubacionC: t.temperatura_c,
          porcentajeInoculo: t.porcentaje_inoculo,
          masaInoculoG: t.masa_inoculo_g,
          tiempoMinutos: l.tiempo_minutos ?? l.minutos ?? 0,
          phReal: l.ph,
          temperaturaRealMedida: l.temperatura ?? t.temperatura_c,
          indiceRefraccionReal: l.indice_refraccion ?? null,
          viscosidadFinalReal: t.viscosidad_final ?? null,
          estado_validacion: 'validado',
        });
      }
    }
  }
  await sincronizarFeedbackANeon([...muestrasBase, ...muestrasFeedback, ...muestrasEnsayosUsuarios]);

  // Sincronizar auditoría local a Neon vinculando usuario_id
  const audits = listarAuditoriaSQLite(100);
  const countAuditNeon = await pool.query(`SELECT COUNT(*) AS total FROM auditoria_operaciones`);
  if (Number(countAuditNeon.rows[0]?.total || 0) < audits.length) {
    for (const a of audits.slice(0, 30)) {
      await sincronizarAuditoriaANeon(a);
    }
  }
}

module.exports = {
  db,
  sqliteFilePath,
  guardarPrediccion,
  listarPredicciones,
  insertarMuestrasFeedback,
  obtenerMuestrasFeedback,
  contarFeedback,
  guardarEnsayoLaboratorio,
  listarEnsayosLaboratorio,
  obtenerEnsayoLaboratorio,
  registrarLecturaEnEnsayo,
  eliminarEnsayoLaboratorio,
  eliminarLecturaDeEnsayo,
  finalizarEnsayoLaboratorioSQLite,
  archivarEnsayoLaboratorioSQLite,
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
  obtenerUltimoUsuarioActivoSQLite,
  listarUsuariosSQLite,
  registrarAuditoriaSQLite,
  listarAuditoriaSQLite,
  registrarSincronizacionSQLite,
  listarSincronizacionSQLite,
  sanitizarDatosAuditoria,
  sincronizarEnsayoANeon,
  sincronizarPrediccionANeon,
  sincronizarFeedbackANeon,
  sincronizarTodoANeon,
};
