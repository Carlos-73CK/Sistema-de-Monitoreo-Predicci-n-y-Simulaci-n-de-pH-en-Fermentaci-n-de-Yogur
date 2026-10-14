const {
  predecirPunto,
  predecirTiempoCorte,
  predecirViscosidad,
  generarTrayectoria,
  evaluarMetricasModelo,
} = require('../ai/fermentationPredictor');
const { EXPERIMENTAL_BATCHES } = require('../ai/dataset');

/**
 * Retorna las métricas científicas de validación del modelo (R², RMSE, MAE)
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
  return res.status(200).json({
    success: true,
    data: {
      investigador: 'Dr. Stalin Gustavo Santacruz Terán',
      institucion: 'Facultad de Ciencias de la Vida y Tecnologías - ULEAM',
      lotes: EXPERIMENTAL_BATCHES,
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

    return res.status(200).json({
      success: true,
      data: trayectoria,
      message: 'Simulación cinética generada correctamente.',
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

module.exports = {
  getModelMetrics,
  getExperimentalDataset,
  predictPoint,
  simulateTrajectory,
};
