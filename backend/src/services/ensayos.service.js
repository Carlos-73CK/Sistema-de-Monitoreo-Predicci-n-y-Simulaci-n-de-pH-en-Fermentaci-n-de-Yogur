/**
 * Servicio de Gestión de Ensayos y Lotes Experimentales — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Implementa la lógica de negocio para:
 * - Creación, listado y consulta de lotes experimentales
 * - Registro continuo de lecturas periódicas de laboratorio (pH, temp, Brix)
 * - Recálculo dinámico en tiempo real ante nuevas mediciones
 * - Exportación de series temporales en formato CSV y JSON
 */

const {
  guardarEnsayoLaboratorio,
  listarEnsayosLaboratorio,
  obtenerEnsayoLaboratorio,
  registrarLecturaEnEnsayo,
  eliminarEnsayoLaboratorio,
  eliminarLecturaDeEnsayo,
  guardarPrediccion,
} = require('../ai/sqliteStore');
const {
  predecirTiempoCorte,
  predecirViscosidad,
  generarTrayectoria,
  recalibrarTrayectoriaDinamica,
} = require('../ai/fermentationPredictor');
const { validarParametrosSimulacion } = require('../validators/fermentationValidator');

/**
 * Obtiene el listado de ensayos con soporte para filtrado por correo de usuario
 * @param {string|null} filtroEmail
 */
function listarEnsayos(filtroEmail = null) {
  return listarEnsayosLaboratorio(100, filtroEmail);
}

/**
 * Obtiene el detalle de un ensayo junto a su proyección cinética recalculada
 * @param {string} loteId
 */
function obtenerEnsayoDetalle(loteId) {
  const trial = obtenerEnsayoLaboratorio(loteId);
  if (!trial) {
    const error = new Error(`El ensayo con lote '${loteId}' no existe.`);
    error.statusCode = 404;
    error.errorCode = 'TRIAL_NOT_FOUND';
    throw error;
  }

  const rec = recalibrarTrayectoriaDinamica({
    configuracion: {
      temperaturaC: trial.temperatura_c,
      masaInoculoG: trial.masa_inoculo_g,
      volumenMl: trial.volumen_ml,
      tipoSustrato: trial.tipo_sustrato,
      tipoAzucar: trial.tipo_azucar,
    },
    lecturas: trial.lecturas,
    intervaloMinutos: 15,
  });

  return {
    trial,
    recalibracion: rec,
    curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
    curvaProyeccion: rec.curvaProyeccion,
  };
}

/**
 * Registra un nuevo ensayo experimental en el sistema
 * @param {Object} body
 * @param {Object|null} usuarioAuth
 */
function crearNuevoEnsayo(body, usuarioAuth = null) {
  const validacion = validarParametrosSimulacion(body);
  if (!validacion.esValido) {
    const error = new Error('Parámetros fisicoquímicos fuera de rango biológico.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = validacion.errores;
    throw error;
  }

  const params = validacion.parametrosSaneados;
  const loteId = String(body.lote_id || body.loteId || 'LOTE-EXP-' + Date.now()).trim();
  const investigador = String(body.investigador || 'Lab. Química de Alimentos — ULEAM').trim();

  let usuarioEmail = (body.usuario_email || (usuarioAuth && usuarioAuth.email) || '').trim().toLowerCase();
  let usuarioId = body.usuario_id || (usuarioAuth && usuarioAuth.id) || null;

  if (!usuarioEmail) {
    if (investigador.toLowerCase().includes('santacruz')) {
      usuarioEmail = 'dr.santacruz@uleam.edu.ec';
      usuarioId = 1;
    } else {
      usuarioEmail = 'carlos.delgado@uleam.edu.ec';
      usuarioId = 2;
    }
  }

  const corte = predecirTiempoCorte({
    temperaturaC: params.temperaturaC,
    masaInoculoG: params.masaInoculoG,
    volumenMl: params.volumenMl,
    tipoAzucar: params.tipoAzucar,
  });

  const visco = predecirViscosidad({
    temperaturaC: params.temperaturaC,
    masaInoculoG: params.masaInoculoG,
    volumenMl: params.volumenMl,
  });

  const trayectoria = generarTrayectoria({
    temperaturaC: params.temperaturaC,
    masaInoculoG: params.masaInoculoG,
    volumenMl: params.volumenMl,
    tipoSustrato: params.tipoSustrato,
    tipoAzucar: params.tipoAzucar,
    intervaloMinutos: 15,
  });

  const initialLecturas = [
    {
      tiempo_minutos: 0,
      ph: 6.50,
      temperatura: params.temperaturaC,
      indice_refraccion: null,
      registrado_en: new Date().toISOString(),
    },
  ];

  const trial = guardarEnsayoLaboratorio({
    lote_id: loteId,
    investigador,
    usuario_email: usuarioEmail,
    usuario_id: usuarioId,
    tipo_sustrato: params.tipoSustrato,
    tipo_azucar: params.tipoAzucar,
    temperatura_c: params.temperaturaC,
    masa_inoculo_g: params.masaInoculoG,
    volumen_ml: params.volumenMl,
    porcentaje_inoculo: params.porcentajeInoculo,
    tiempo_corte_inicial_horas: corte.tiempoCorteHoras,
    tiempo_corte_inicial_minutos: corte.tiempoCorteMinutos,
    tiempo_corte_estimado_horas: corte.tiempoCorteHoras,
    tiempo_corte_estimado_minutos: corte.tiempoCorteMinutos,
    diferencia_minutos: 0,
    estado: 'EN_CURSO',
    lecturas: initialLecturas,
    diagnostico: visco.diagnostico,
  });

  guardarPrediccion({
    lote_id: loteId,
    investigador,
    tipo_sustrato: params.tipoSustrato,
    temperatura_c: params.temperaturaC,
    masa_inoculo_g: params.masaInoculoG,
    volumen_ml: params.volumenMl,
    porcentaje_inoculo: params.porcentajeInoculo,
    tiempo_corte_horas: corte.tiempoCorteHoras,
    tiempo_corte_minutos: corte.tiempoCorteMinutos,
    viscosidad_predicha_mpas: visco.viscosidadPredichaMpaS,
    calidad_gel: visco.calidadGel,
    diagnostico: visco.diagnostico,
  });

  return {
    trial,
    corte,
    viscosidad: visco,
    curva: trayectoria.curva,
    advertencias: validacion.advertencias,
  };
}

/**
 * Agrega una lectura periódica a un ensayo existente y recalibra dinámicamente
 * @param {string} loteId
 * @param {Object} lecturaData
 */
function agregarLectura(loteId, lecturaData) {
  const trial = obtenerEnsayoLaboratorio(loteId);
  if (!trial) {
    const error = new Error(`El ensayo con lote '${loteId}' no existe.`);
    error.statusCode = 404;
    error.errorCode = 'TRIAL_NOT_FOUND';
    throw error;
  }

  const min = Number(lecturaData.tiempo_minutos !== undefined ? lecturaData.tiempo_minutos : lecturaData.minutos);
  const ph = Number(lecturaData.ph);
  const temp = Number(lecturaData.temperatura !== undefined ? lecturaData.temperatura : (lecturaData.temperatura_c || trial.temperatura_c));
  const brix = lecturaData.indice_refraccion !== undefined && lecturaData.indice_refraccion !== null
    ? Number(lecturaData.indice_refraccion)
    : (lecturaData.brix !== undefined && lecturaData.brix !== null ? Number(lecturaData.brix) : null);

  if (isNaN(min) || min < 0) {
    const error = new Error('El tiempo transcurrido en minutos debe ser mayor o igual a 0.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }
  if (isNaN(ph) || ph < 3.8 || ph > 7.2) {
    const error = new Error('El pH medido debe encontrarse dentro del rango biológico [3.80 - 7.20].');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const updatedLecturas = [...trial.lecturas];
  const idx = updatedLecturas.findIndex((l) => Number(l.tiempo_minutos !== undefined ? l.tiempo_minutos : l.minutos) === min);
  const readingEntry = {
    tiempo_minutos: min,
    ph,
    temperatura: temp,
    indice_refraccion: brix,
    registrado_en: new Date().toISOString(),
  };

  if (idx >= 0) {
    updatedLecturas[idx] = readingEntry;
  } else {
    updatedLecturas.push(readingEntry);
  }
  updatedLecturas.sort((a, b) => Number(a.tiempo_minutos) - Number(b.tiempo_minutos));

  const rec = recalibrarTrayectoriaDinamica({
    configuracion: {
      temperaturaC: trial.temperatura_c,
      masaInoculoG: trial.masa_inoculo_g,
      volumenMl: trial.volumen_ml,
      tipoSustrato: trial.tipo_sustrato,
      tipoAzucar: trial.tipo_azucar,
    },
    lecturas: updatedLecturas,
    intervaloMinutos: 15,
  });

  const updatedTrial = registrarLecturaEnEnsayo(loteId, readingEntry, rec);

  return {
    trial: updatedTrial,
    recalibracion: rec,
    curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
    curvaProyeccion: rec.curvaProyeccion,
  };
}

/**
 * Elimina una lectura específica y recalibra la proyección
 * @param {string} loteId
 * @param {number} min
 */
function eliminarLectura(loteId, min) {
  const minNum = Number(min);
  if (minNum === 0) {
    const error = new Error('No se puede eliminar la lectura de inicio (T0).');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const updatedTrial = eliminarLecturaDeEnsayo(loteId, minNum);
  if (!updatedTrial) {
    const error = new Error(`El ensayo '${loteId}' no existe.`);
    error.statusCode = 404;
    error.errorCode = 'TRIAL_NOT_FOUND';
    throw error;
  }

  const rec = recalibrarTrayectoriaDinamica({
    configuracion: {
      temperaturaC: updatedTrial.temperatura_c,
      masaInoculoG: updatedTrial.masa_inoculo_g,
      volumenMl: updatedTrial.volumen_ml,
      tipoSustrato: updatedTrial.tipo_sustrato,
      tipoAzucar: updatedTrial.tipo_azucar,
    },
    lecturas: updatedTrial.lecturas,
    intervaloMinutos: 15,
  });

  return {
    trial: updatedTrial,
    recalibracion: rec,
    curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
  };
}

/**
 * Elimina un ensayo experimental
 * @param {string} loteId
 */
function eliminarEnsayo(loteId) {
  const ok = eliminarEnsayoLaboratorio(loteId);
  if (!ok) {
    const error = new Error(`El ensayo con lote '${loteId}' no existe o ya fue eliminado.`);
    error.statusCode = 404;
    error.errorCode = 'TRIAL_NOT_FOUND';
    throw error;
  }
  return true;
}

/**
 * Genera el contenido para exportación en CSV o JSON
 * @param {string} loteId
 * @param {string} formato
 */
function exportarDatosEnsayo(loteId, formato = 'csv') {
  const trial = obtenerEnsayoLaboratorio(loteId);
  if (!trial) {
    const error = new Error(`El ensayo con lote '${loteId}' no existe.`);
    error.statusCode = 404;
    error.errorCode = 'TRIAL_NOT_FOUND';
    throw error;
  }

  const formatoNorm = String(formato || 'csv').trim().toLowerCase();
  if (formatoNorm === 'json') {
    return {
      tipo: 'json',
      data: trial,
    };
  }

  if (formatoNorm !== 'csv') {
    const error = new Error("Formato no soportado. Los formatos permitidos son 'csv' y 'json'.");
    error.statusCode = 400;
    error.errorCode = 'INVALID_FORMAT';
    throw error;
  }

  const headers = 'tiempo_minutos,ph,temperatura,indice_refraccion,fecha_registro';
  const rows = (trial.lecturas || []).map((l) => {
    const tiempoMinutos = l.tiempo_minutos !== undefined ? l.tiempo_minutos : (l.minutos !== undefined ? l.minutos : '');
    const ph = l.ph !== undefined && l.ph !== null ? l.ph : '';
    const temperatura = l.temperatura !== undefined && l.temperatura !== null
      ? l.temperatura
      : (l.temperatura_c !== undefined && l.temperatura_c !== null ? l.temperatura_c : '');
    const indiceRefraccion = l.indice_refraccion !== undefined && l.indice_refraccion !== null
      ? l.indice_refraccion
      : (l.brix !== undefined && l.brix !== null ? l.brix : '');
    const fechaRegistro = l.fecha_registro || l.registrado_en || l.created_at || '';

    return `${tiempoMinutos},${ph},${temperatura},${indiceRefraccion},${fechaRegistro}`;
  });

  return {
    tipo: 'csv',
    filename: `${loteId}_cinetica.csv`,
    content: [headers, ...rows].join('\n'),
  };
}

module.exports = {
  listarEnsayos,
  obtenerEnsayoDetalle,
  crearNuevoEnsayo,
  agregarLectura,
  eliminarLectura,
  eliminarEnsayo,
  exportarDatosEnsayo,
};
