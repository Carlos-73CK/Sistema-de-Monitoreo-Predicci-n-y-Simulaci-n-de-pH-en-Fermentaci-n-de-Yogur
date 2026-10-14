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
  const {
    temperatura = 42,
    temperatura_c,
    masa_inoculo_g = 18.75,
    masa_inoculo,
    volumen_ml = 250,
    minutos = 0,
    tipo_sustrato = 'vaca',
  } = req.body || {};

  const temp = temperatura_c !== undefined ? temperatura_c : temperatura;
  const inoc = masa_inoculo !== undefined ? masa_inoculo : masa_inoculo_g;

  try {
    const punto = predecirPunto({
      temperaturaC: temp,
      masaInoculoG: inoc,
      volumenMl: volumen_ml,
      minutos,
      tipoSustrato: tipo_sustrato,
    });

    const corte = predecirTiempoCorte({
      temperaturaC: temp,
      masaInoculoG: inoc,
      volumenMl: volumen_ml,
    });

    const viscosidad = predecirViscosidad({
      temperaturaC: temp,
      masaInoculoG: inoc,
      volumenMl: volumen_ml,
    });

    return res.status(200).json({
      success: true,
      data: {
        punto,
        corte,
        viscosidad,
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
  const {
    temperatura = 42,
    temperatura_c,
    masa_inoculo_g = 18.75,
    masa_inoculo,
    volumen_ml = 250,
    tipo_sustrato = 'vaca',
    intervalo_minutos = 15,
    guardar = true,
  } = req.body || {};

  const temp = temperatura_c !== undefined ? temperatura_c : temperatura;
  const inoc = masa_inoculo !== undefined ? masa_inoculo : masa_inoculo_g;

  try {
    const trayectoria = generarTrayectoria({
      temperaturaC: temp,
      masaInoculoG: inoc,
      volumenMl: volumen_ml,
      tipoSustrato: tipo_sustrato,
      intervaloMinutos: intervalo_minutos,
    });

    // Guardar en el historial de SQLite local si guardar es true
    if (guardar) {
      try {
        guardarPrediccion({
          tipo_sustrato,
          temperatura_c: temp,
          masa_inoculo_g: inoc,
          volumen_ml,
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
      data: trayectoria,
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
 * y reentrenar/recalibrar el modelo de IA dinámicamente
 */
const submitFeedbackBatch = (req, res) => {
  const {
    lote_id,
    temperatura_c = 42,
    masa_inoculo_g = 18.75,
    volumen_ml = 250,
    viscosidad_final,
    lecturas = [],
  } = req.body || {};

  if (!lote_id || !Array.isArray(lecturas) || lecturas.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar lote_id y un arreglo de lecturas para el aprendizaje.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const porcentajeInoculo = ((Number(masa_inoculo_g) || 18.75) / (Number(volumen_ml) || 250)) * 100;

    const muestras = lecturas.map((lec) => ({
      loteId: lote_id,
      temperaturaIncubacionC: Number(temperatura_c) || 42,
      porcentajeInoculo,
      masaInoculoG: Number(masa_inoculo_g) || 18.75,
      tiempoMinutos: Number(lec.tiempo_minutos !== undefined ? lec.tiempo_minutos : lec.minutos),
      phReal: Number(lec.ph),
      indiceRefraccionReal: lec.indice_refraccion !== undefined ? Number(lec.indice_refraccion) : null,
      temperaturaRealMedida: lec.temperatura !== undefined ? Number(lec.temperatura) : null,
      viscosidadFinalReal: viscosidad_final !== undefined ? Number(viscosidad_final) : null,
    }));

    const totalInsertadas = insertarMuestrasFeedback(muestras);

    // Recalcular métricas de IA con el dataset ampliado
    const metricasActualizadas = evaluarMetricasModelo();

    return res.status(201).json({
      success: true,
      data: {
        lote_id,
        muestras_agregadas: totalInsertadas,
        metricas_recalibradas: metricasActualizadas.metricasValidacion,
        dataset_actualizado: metricasActualizadas.datasetInfo,
      },
      message: `¡Aprendizaje continuo exitoso! Se agregaron ${totalInsertadas} muestras al modelo predictivo.`,
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
