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
    correo TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol TEXT DEFAULT 'estudiante',
    creado_en TEXT NOT NULL
  );
`);

// Migración defensiva de columnas en ensayos_laboratorio
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN usuario_id INTEGER DEFAULT 1`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE ensayos_laboratorio ADD COLUMN usuario_email TEXT DEFAULT 'carlos.delgado@uleam.edu.ec'`);
} catch (e) {}

// Sembrar usuarios predeterminados si la tabla está vacía
try {
  const countUsers = db.prepare(`SELECT COUNT(*) as total FROM usuarios`).get();
  if (!countUsers || countUsers.total === 0) {
    const saltRounds = 10;
    const insertUser = db.prepare(`
      INSERT INTO usuarios (nombre, correo, contrasena, rol, creado_en)
      VALUES (?, LOWER(?), ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertUser.run('Dr. Stalin Santacruz Terán', 'dr.santacruz@uleam.edu.ec', bcrypt.hashSync('santacruz2026', saltRounds), 'investigador', now);
    insertUser.run('Carlos Delgado', 'carlos.delgado@uleam.edu.ec', bcrypt.hashSync('carlos2026', saltRounds), 'investigador', now);
    insertUser.run('Estudiante ULEAM', 'estudiante@uleam.edu.ec', bcrypt.hashSync('estudiante2026', saltRounds), 'estudiante', now);
  }
} catch (e) {
  console.warn('[SQLite] Aviso al sembrar usuarios base:', e.message);
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

  return {
    id: info.lastInsertRowid,
    ...p,
    lote_id: loteId,
    investigador,
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

  return obtenerEnsayoLaboratorio(loteId);
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
  const r = db.prepare(`SELECT * FROM ensayos_laboratorio WHERE lote_id = ?`).get(String(loteId).trim());
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

  return obtenerEnsayoLaboratorio(loteId);
}

/**
 * Elimina un ensayo y sus lecturas
 */
function eliminarEnsayoLaboratorio(loteId) {
  const info = db.prepare(`DELETE FROM ensayos_laboratorio WHERE lote_id = ?`).run(String(loteId).trim());
  return info.changes > 0;
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
  return obtenerEnsayoLaboratorio(loteId);
}


/**
 * Crea un nuevo usuario en la base de datos SQLite local
 */
function crearUsuarioSQLite(nombre, correo, contrasenaHash, rol = 'estudiante') {
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO usuarios (nombre, correo, contrasena, rol, creado_en)
    VALUES (?, LOWER(?), ?, ?, ?)
  `).run(String(nombre).trim(), String(correo).trim(), contrasenaHash, String(rol).trim().toLowerCase(), now);

  return {
    id: info.lastInsertRowid,
    nombre: String(nombre).trim(),
    email: String(correo).trim().toLowerCase(),
    rol: String(rol).trim().toLowerCase(),
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
 * Busca un usuario por ID en SQLite
 */
function buscarUsuarioPorIdSQLite(id) {
  if (!id) return null;
  return db.prepare(`SELECT id, nombre, correo, rol, creado_en FROM usuarios WHERE id = ?`).get(Number(id)) || null;
}

/**
 * Lista todos los usuarios registrados en SQLite
 */
function listarUsuariosSQLite() {
  return db.prepare(`SELECT id, nombre, correo, rol, creado_en FROM usuarios ORDER BY id ASC`).all();
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
  crearUsuarioSQLite,
  buscarUsuarioPorEmailSQLite,
  buscarUsuarioPorIdSQLite,
  listarUsuariosSQLite,
};
