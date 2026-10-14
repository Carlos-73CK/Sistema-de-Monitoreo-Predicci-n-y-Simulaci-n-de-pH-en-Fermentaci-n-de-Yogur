const {
  predecirPunto,
  predecirTiempoCorte,
  predecirViscosidad,
  generarTrayectoria,
  evaluarMetricasModelo,
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
} = require('../validators/fermentationValidator');

/**
 * Retorna las métricas científicas de validación del modelo (R², RMSE, MAE)
 * Combina el dataset de base del Dr. Santacruz con cualquier nuevo lote aprendido
 */
const getModelMetrics = (_req, res) => {
  try {
    const metricas = evaluarMetricasModelo();
    return res.status(200).json({
      success: true,
      data: metricas,
      message: 'Métricas de validación del modelo predictivo calculadas con éxito.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al evaluar las métricas del modelo.',
      error: error.message,
    });
  }
};

/**
 * Retorna el dataset experimental del Dr. Stalin Santacruz
 */
const getExperimentalDataset = (_req, res) => {
  const conteo = contarFeedback();
  return res.status(200).json({
    success: true,
    data: {
      investigador: 'Dr. Stalin Gustavo Santacruz Terán',
      institucion: 'Facultad de Ciencias de la Vida y Tecnologías - ULEAM',
      lotesBase: EXPERIMENTAL_BATCHES,
      resumenAprendizaje: conteo,
    },
    message: 'Dataset experimental de laboratorio recuperado con éxito.',
    error: null,
  });
};

/**
 * Predice un punto cinético específico (pH y Brix a tiempo t) y tiempo de corte
 */
const predictPoint = (req, res) => {
  const { minutos = 0 } = req.body || {};
  const minutosNum = Number(minutos);

  if (Number.isNaN(minutosNum) || minutosNum < 0 || minutosNum > 720) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'El tiempo de predicción debe ser un número entre 0 y 720 minutos (máx 12h).',
      error: 'VALIDATION_ERROR',
    });
  }

  const validacion = validarParametrosSimulacion(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Parámetros fisicoquímicos fuera de rango biológico.',
      errores: validacion.errores,
      error: 'VALIDATION_ERROR',
    });
  }

  const params = validacion.parametrosSaneados;

  try {
    const punto = predecirPunto({
      temperaturaC: params.temperaturaC,
      masaInoculoG: params.masaInoculoG,
      volumenMl: params.volumenMl,
      minutos: minutosNum,
      tipoSustrato: params.tipoSustrato,
    });

    const corte = predecirTiempoCorte({
      temperaturaC: params.temperaturaC,
      masaInoculoG: params.masaInoculoG,
      volumenMl: params.volumenMl,
    });

    const viscosidad = predecirViscosidad({
      temperaturaC: params.temperaturaC,
      masaInoculoG: params.masaInoculoG,
      volumenMl: params.volumenMl,
    });

    return res.status(200).json({
      success: true,
      data: {
        punto,
        corte,
        viscosidad,
        advertencias: validacion.advertencias,
      },
      message: 'Predicción cinética generada con éxito.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al generar la predicción.',
      error: error.message,
    });
  }
};

/**
 * Genera la trayectoria completa de simulación cinética ("What-If")
 * Opcionalmente la persiste de forma automática en SQLite local
 */
const simulateTrajectory = (req, res) => {
  const validacion = validarParametrosSimulacion(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Parámetros de simulación fuera de rango aceptable.',
      errores: validacion.errores,
      error: 'VALIDATION_ERROR',
    });
  }

  const params = validacion.parametrosSaneados;
  const intervaloMin = Math.max(5, Math.min(60, Number(req.body?.intervalo_minutos) || 15));
  const guardar = req.body?.guardar !== false;

  try {
    const trayectoria = generarTrayectoria({
      temperaturaC: params.temperaturaC,
      masaInoculoG: params.masaInoculoG,
      volumenMl: params.volumenMl,
      tipoSustrato: params.tipoSustrato,
      intervaloMinutos: intervaloMin,
    });

    // Guardar en el historial de SQLite local si guardar es true
    if (guardar) {
      try {
        guardarPrediccion({
          tipo_sustrato: params.tipoSustrato,
          temperatura_c: params.temperaturaC,
          masa_inoculo_g: params.masaInoculoG,
          volumen_ml: params.volumenMl,
          porcentaje_inoculo: trayectoria.configuracion.porcentajeInoculo,
          tiempo_corte_horas: trayectoria.prediccionCorte.tiempoCorteHoras,
          tiempo_corte_minutos: trayectoria.prediccionCorte.tiempoCorteMinutos,
          viscosidad_predicha: trayectoria.prediccionViscosidad.viscosidadPredichaMpaS,
          calidad_gel: trayectoria.prediccionViscosidad.calidadGel,
          diagnostico: trayectoria.prediccionViscosidad.diagnostico,
        });
      } catch (sqliteErr) {
        console.warn('[AI Store] Advertencia al persistir en SQLite:', sqliteErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...trayectoria,
        advertencias: validacion.advertencias,
      },
      message: 'Simulación cinética generada y almacenada en SQLite con éxito.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al simular la trayectoria.',
      error: error.message,
    });
  }
};

/**
 * Retorna el historial de simulaciones y predicciones guardadas en SQLite local
 */
const getSavedSimulations = (req, res) => {
  try {
    const limite = parseInt(req.query.limite || '50', 10);
    const lista = listarPredicciones(limite);
    return res.status(200).json({
      success: true,
      data: {
        total: lista.length,
        simulaciones: lista,
      },
      message: 'Historial de simulaciones recuperado de SQLite local.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al recuperar historial de simulaciones.',
      error: error.message,
    });
  }
};

/**
 * Feedback Loop: Recibe un nuevo lote real finalizado para incorporarlo al dataset
 * y reentrenar/recalibrar el modelo de IA dinámicamente con validación fisicoquímica estricta
 */
const submitFeedbackBatch = (req, res) => {
  const validacion = validarLoteFeedback(req.body);

  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validación fisicoquímica fallida para el lote experimental.',
      errores: validacion.errores,
      error: 'DATA_VALIDATION_ERROR',
    });
  }

  try {
    const { lecturasSaneadas, metadata } = validacion;
    const totalInsertadas = insertarMuestrasFeedback(lecturasSaneadas);

    // Recalcular métricas de IA con el dataset ampliado y verificado
    const metricasActualizadas = evaluarMetricasModelo();

    return res.status(201).json({
      success: true,
      data: {
        lote_id: metadata.loteId,
        muestras_agregadas: totalInsertadas,
        metadata_lote: metadata,
        metricas_recalibradas: metricasActualizadas.metricasValidacion,
        dataset_actualizado: metricasActualizadas.datasetInfo,
      },
      message: `¡Aprendizaje continuo exitoso! Se validaron e incorporaron ${totalInsertadas} muestras fisicoquímicas al modelo predictivo.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al incorporar lote para aprendizaje continuo.',
      error: error.message,
    });
  }
};

module.exports = {
  getModelMetrics,
  getExperimentalDataset,
  predictPoint,
  simulateTrajectory,
  getSavedSimulations,
  submitFeedbackBatch,
};
