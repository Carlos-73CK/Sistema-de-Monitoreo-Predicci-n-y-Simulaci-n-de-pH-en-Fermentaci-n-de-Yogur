/**
 * Servicio Cinético y Biofísico de Hill — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Implementa la lógica de cálculo bioestadístico y cinético:
 * - Solución del modelo no lineal sigmoidal de Hill
 * - Evaluación de métricas de precisión (R² = 0.9774, RMSE = 0.0961, MAE = 0.0773)
 * - Generación de trayectoria completa (curva de pH y °Brix en el tiempo)
 * - Recalibración bayesiana dinámica en tiempo real
 * - Aprendizaje continuo (Feedback Loop) con nuevos lotes experimentales
 */

const {
  predecirPunto,
  predecirTiempoCorte,
  predecirViscosidad,
  generarTrayectoria,
  evaluarMetricasModelo,
  recalibrarTrayectoriaDinamica,
} = require('../ai/fermentationPredictor');
const { EXPERIMENTAL_BATCHES } = require('../ai/dataset');
const {
  guardarPrediccion,
  listarPredicciones,
  insertarMuestrasFeedback,
  contarFeedback,
} = require('../ai/sqliteStore');
const {
  validarParametrosSimulacion,
  validarLoteFeedback,
  validarRecalibracionDinamica,
} = require('../validators/fermentationValidator');

/**
 * Obtiene las métricas bioestadísticas de validación del modelo
 */
function obtenerMetricasModelo() {
  return evaluarMetricasModelo();
}

/**
 * Obtiene el dataset experimental base del Dr. Stalin Santacruz y resumen de feedback
 */
function obtenerDatasetExperimental() {
  const conteo = contarFeedback();
  return {
    investigador: 'Dr. Stalin Gustavo Santacruz Terán',
    institucion: 'Facultad de Ciencias de la Vida y Tecnologías - ULEAM',
    lotesBase: EXPERIMENTAL_BATCHES,
    resumenAprendizaje: conteo,
  };
}

/**
 * Predice un punto cinético individual a un minuto específico t
 * @param {Object} body
 */
function predecirPuntoCinético(body) {
  const { minutos = 0 } = body || {};
  const minutosNum = Number(minutos);

  if (Number.isNaN(minutosNum) || minutosNum < 0 || minutosNum > 720) {
    const error = new Error('El tiempo de predicción debe ser un número entre 0 y 720 minutos (máx 12h).');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  const validacion = validarParametrosSimulacion(body);
  if (!validacion.esValido) {
    const error = new Error('Parámetros fisicoquímicos fuera de rango biológico.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = validacion.errores;
    throw error;
  }

  const params = validacion.parametrosSaneados;
  const punto = predecirPunto({
    temperatura_c: params.temperatura_c,
    masa_inoculo_g: params.masa_inoculo_g,
    volumen_ml: params.volumen_ml,
    tipo_sustrato: params.tipo_sustrato,
    tipo_azucar: params.tipo_azucar,
    t_minutos: minutosNum,
  });

  const tiempoCorte = predecirTiempoCorte(params);
  const viscosidad = predecirViscosidad(params);

  return {
    punto_evaluado: punto,
    tiempo_estimado_corte_ph_4_50: tiempoCorte,
    viscosidad_esperada_gel: viscosidad,
    parametros_utilizados: params,
  };
}

/**
 * Simula la fermentación completa y calcula la trayectoria del modelo Hill
 * @param {Object} body
 */
function simularTrayectoriaCompleta(body) {
  const validacion = validarParametrosSimulacion(body);
  if (!validacion.esValido) {
    const error = new Error('Parámetros de fermentación inválidos o fuera de rango.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = validacion.errores;
    throw error;
  }

  const params = validacion.parametrosSaneados;
  const intervaloMinutos = Number(body.intervalo_minutos || body.intervaloMinutos || body.paso_minutos || 15);

  // Generar curva cinética discreta mediante el modelo Hill
  const trayectoria = generarTrayectoria({
    temperaturaC: params.temperaturaC,
    masaInoculoG: params.masaInoculoG,
    volumenMl: params.volumenMl,
    tipoSustrato: params.tipoSustrato,
    tipoAzucar: params.tipoAzucar,
    intervaloMinutos,
  });

  const tiempoCorte = trayectoria.prediccionCorte || predecirTiempoCorte(params);
  const viscosidad = trayectoria.prediccionViscosidad || predecirViscosidad(params);

  // Determinar calidad reológica del gel de caseína
  let calidadGel = 'ÓPTIMA';
  const viscoVal = viscosidad.viscosidadPredichaMpaS || viscosidad.viscosidad_mpas || 2000;
  if (viscoVal < 1200) {
    calidadGel = 'DÉBIL (Riesgo de sinéresis o bajo inóculo)';
  } else if (viscoVal > 2800) {
    calidadGel = 'ALTA FIRMEZA (Excelente textura para yogur batido)';
  }

  const resultado = {
    ...trayectoria,
    curva: trayectoria.curva,
    curvaCineticapH: trayectoria.curva,
    curva_cinetica: trayectoria.curva,
    prediccionCorte: tiempoCorte,
    tiempo_corte: tiempoCorte,
    reologia: {
      ...viscosidad,
      calidad_gel: calidadGel,
    },
    meta_ph_coagulacion: 4.50,
    total_puntos: trayectoria.curva.length,
    timestamp: new Date().toISOString(),
  };

  // Persistir en SQLite para trazabilidad
  try {
    guardarPrediccion({
      lote_id: body.lote_id || `LOTE-SIM-${Date.now().toString(36).toUpperCase()}`,
      investigador: body.investigador || 'Laboratorio ULEAM',
      tipo_sustrato: params.tipo_sustrato,
      temperatura_c: params.temperatura_c,
      masa_inoculo_g: params.masa_inoculo_g,
      volumen_ml: params.volumen_ml,
      porcentaje_inoculo: params.porcentaje_inoculo,
      tiempo_corte_horas: tiempoCorte.tiempo_horas,
      tiempo_corte_minutos: tiempoCorte.tiempo_minutos,
      viscosidad_predicha_mpas: viscosidad.viscosidad_mpas,
      calidad_gel: calidadGel,
      diagnostico: tiempoCorte.diagnostico_cinetico,
    });
  } catch (err) {
    console.warn('[KineticService] Aviso al registrar historial de predicción:', err.message);
  }

  return resultado;
}

/**
 * Ejecuta la recalibración bayesiana dinámica con base en lecturas observadas
 * @param {Object} body
 */
function recalibrarDinamica(body) {
  const validacion = validarRecalibracionDinamica(body);
  if (!validacion.esValido) {
    const error = new Error('Datos de recalibración inválidos.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = validacion.errores;
    throw error;
  }

  const { parametros_base, lecturas_observadas } = validacion.datosSaneados;
  const pasoMinutos = Math.max(5, Math.min(30, Number(body.paso_minutos) || 15));
  const maxHoras = Math.max(4, Math.min(12, Number(body.max_horas) || 8));

  return recalibrarTrayectoriaDinamica(
    parametros_base,
    lecturas_observadas,
    pasoMinutos,
    maxHoras
  );
}

/**
 * Incorpora un lote completado para aprendizaje continuo (Feedback Loop)
 * @param {Object} body
 */
function registrarLoteFeedback(body) {
  const validacion = validarLoteFeedback(body);
  if (!validacion.esValido) {
    const error = new Error('Datos del lote experimental inválidos.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = validacion.errores;
    throw error;
  }

  const loteSaneado = validacion.loteSaneado;
  const guardados = insertarMuestrasFeedback(loteSaneado);
  const metricasActualizadas = evaluarMetricasModelo();
  const conteoActual = contarFeedback();

  return {
    lote_id: loteSaneado.lote_id,
    muestras_incorporadas: guardados,
    total_lotes_aprendidos: conteoActual.lotes_incorporados,
    total_muestras_dataset: conteoActual.muestras_totales,
    metricas_modelo_actualizadas: metricasActualizadas,
    mensaje: `Lote ${loteSaneado.lote_id} incorporado exitosamente al dataset continuo.`,
  };
}

/**
 * Consulta el historial de simulaciones realizadas
 * @param {number} limite
 */
function listarHistorialPredicciones(limite = 50) {
  return listarPredicciones(limite);
}

module.exports = {
  obtenerMetricasModelo,
  obtenerDatasetExperimental,
  predecirPuntoCinético,
  simularTrayectoriaCompleta,
  recalibrarDinamica,
  registrarLoteFeedback,
  listarHistorialPredicciones,
};
