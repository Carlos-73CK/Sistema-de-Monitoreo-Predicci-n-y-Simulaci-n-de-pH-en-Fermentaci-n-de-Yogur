const jwt = require('jsonwebtoken');
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
  guardarEnsayoLaboratorio,
  listarEnsayosLaboratorio,
  obtenerEnsayoLaboratorio,
  registrarLecturaEnEnsayo,
  eliminarEnsayoLaboratorio,
  eliminarLecturaDeEnsayo,
} = require('../ai/sqliteStore');
const {
  validarParametrosSimulacion,
  validarLoteFeedback,
  validarRecalibracionDinamica,
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
      tipoAzucar: params.tipoAzucar,
    });

    const corte = predecirTiempoCorte({
      temperaturaC: params.temperaturaC,
      masaInoculoG: params.masaInoculoG,
      volumenMl: params.volumenMl,
      tipoAzucar: params.tipoAzucar,
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
      tipoAzucar: params.tipoAzucar,
      intervaloMinutos: intervaloMin,
    });

    // Guardar en el historial de SQLite local si guardar es true
    if (guardar) {
      try {
        guardarPrediccion({
          lote_id: req.body?.lote_id || req.body?.nombre_lote || req.body?.codigo || 'LOTE-SIM-' + Math.floor(100 + Math.random() * 900),
          investigador: req.body?.investigador || 'Lab. Química de Alimentos — ULEAM',
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

/**
 * Recalibra dinámicamente la trayectoria de fermentación a partir de lecturas observadas en tiempo real
 */
const recalibrateDynamicTrajectory = (req, res) => {
  const validacion = validarRecalibracionDinamica(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Parámetros o lecturas fuera de rango fisicoquímico.',
      errores: validacion.errores,
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const rec = recalibrarTrayectoriaDinamica({
      configuracion: validacion.configuracionSaneada,
      lecturas: validacion.lecturasSaneadas,
      intervaloMinutos: 15,
    });

    const adelantoORetraso = rec.deltaMinutos < -3 ? 'adelanto' : (rec.deltaMinutos > 3 ? 'retraso' : 'nominal');
    let confianza = 'Baja (± 30 min)';
    if (rec.margenIncertidumbreMinutos <= 5) confianza = 'Muy Alta (± 4 min)';
    else if (rec.margenIncertidumbreMinutos <= 10) confianza = 'Alta (± 8 min)';
    else if (rec.margenIncertidumbreMinutos <= 20) confianza = 'Media (± 15 min)';

    return res.status(200).json({
      success: true,
      data: {
        ...rec,
        prediccionCorte: {
          tiempoCorteInicialMinutos: rec.tiempoCorteInicialMinutos,
          tiempoCorteInicialHoras: rec.tiempoCorteInicialHoras,
          tiempoCorteRecalibradoMinutos: rec.tiempoCorteRecalibradoMinutos,
          tiempoCorteRecalibradoHoras: rec.tiempoCorteRecalibradoHoras,
          diferenciaMinutos: rec.deltaMinutos,
          adelantoORetraso,
          razonVelocidad: rec.factorVelocidadKinetic,
          margenIncertidumbreMinutos: rec.margenIncertidumbreMinutos,
          confianzaEstimacion: confianza,
          diagnostico: rec.diagnostico,
        },
        curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
        curvaProyeccion: rec.curvaProyeccion,
        curvaTeoricaInicial: rec.curvaTeoricaOriginal,
      },
      message: 'Recalibración dinámica en tiempo real completada con éxito.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al recalibrar la trayectoria.',
      error: error.message,
    });
  }
};


/**
 * Extrae el usuario autenticado desde req.user o desde el token Bearer en headers
 */
function extraerUsuarioDePeticion(req) {
  if (req.user && req.user.email) return req.user;
  const authHeader = req.headers['authorization'] || req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'prediyogur_super_secret_key_2026';
    return jwt.verify(token, secret);
  } catch (_) {
    return null;
  }
}

/**
 * Lista todos los ensayos experimentales ordenados cronológicamente (soporta filtro por usuario)
 */
const listTrials = (req, res) => {
  try {
    const usuarioAuth = extraerUsuarioDePeticion(req);
    const { usuario_email, mis_ensayos } = req.query || {};

    let filtroEmail = null;
    if (usuario_email && String(usuario_email).trim()) {
      filtroEmail = String(usuario_email).trim().toLowerCase();
    } else if (mis_ensayos === 'true' || mis_ensayos === '1') {
      if (usuarioAuth && usuarioAuth.email) {
        filtroEmail = usuarioAuth.email.toLowerCase();
      }
    }

    const trials = listarEnsayosLaboratorio(100, filtroEmail);
    return res.status(200).json({
      success: true,
      data: {
        total: trials.length,
        filtro_usuario: filtroEmail || 'todos',
        trials,
      },
      message: filtroEmail
        ? `Listado de ensayos propios filtrados para '${filtroEmail}'.`
        : 'Listado de ensayos de laboratorio recuperado de SQLite.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al listar los ensayos de laboratorio.',
      error: error.message,
    });
  }
};

/**
 * Obtiene un ensayo específico con su proyección cinética recalculada
 */
const getTrial = (req, res) => {
  try {
    const { loteId } = req.params;
    const trial = obtenerEnsayoLaboratorio(loteId);
    if (!trial) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `El ensayo con lote '${loteId}' no existe en SQLite.`,
        error: 'TRIAL_NOT_FOUND',
      });
    }

    // Recalibrar o proyectar dinámicamente con sus lecturas registradas
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

    return res.status(200).json({
      success: true,
      data: {
        trial,
        recalibracion: rec,
        curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
        curvaProyeccion: rec.curvaProyeccion,
      },
      message: `Ensayo '${loteId}' recuperado con proyección cinética actualizada.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al recuperar el ensayo de laboratorio.',
      error: error.message,
    });
  }
};

/**
 * Crea un nuevo ensayo experimental y lo persiste en SQLite
 */
const createTrial = (req, res) => {
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

  try {
    const params = validacion.parametrosSaneados;
    const loteId = String(req.body.lote_id || req.body.loteId || 'LOTE-EXP-' + Date.now()).trim();
    const investigador = String(req.body.investigador || 'Lab. Química de Alimentos — ULEAM').trim();

    // Determinar usuario propietario del ensayo (vía token, body o inferencia)
    const usuarioAuth = extraerUsuarioDePeticion(req);
    let usuarioEmail = (req.body.usuario_email || (usuarioAuth && usuarioAuth.email) || '').trim().toLowerCase();
    let usuarioId = req.body.usuario_id || (usuarioAuth && usuarioAuth.id) || null;

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

    // Guardar también en auditoría de predicciones
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

    return res.status(201).json({
      success: true,
      data: {
        trial,
        corte,
        viscosidad: visco,
        curva: trayectoria.curva,
        advertencias: validacion.advertencias,
      },
      message: `¡Ensayo '${loteId}' creado y registrado con éxito en SQLite!`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al registrar el ensayo en SQLite.',
      error: error.message,
    });
  }
};

/**
 * Agrega una lectura periódica a un ensayo existente y recalibra dinámicamente
 */
const addTrialReading = (req, res) => {
  const { loteId } = req.params;
  const trial = obtenerEnsayoLaboratorio(loteId);
  if (!trial) {
    return res.status(404).json({
      success: false,
      data: null,
      message: `El ensayo con lote '${loteId}' no existe en SQLite.`,
      error: 'TRIAL_NOT_FOUND',
    });
  }

  const min = Number(req.body.tiempo_minutos !== undefined ? req.body.tiempo_minutos : req.body.minutos);
  const ph = Number(req.body.ph);
  const temp = Number(req.body.temperatura !== undefined ? req.body.temperatura : (req.body.temperatura_c || trial.temperatura_c));
  const brix = req.body.indice_refraccion !== undefined && req.body.indice_refraccion !== null
    ? Number(req.body.indice_refraccion)
    : (req.body.brix !== undefined && req.body.brix !== null ? Number(req.body.brix) : null);

  if (isNaN(min) || min < 0) {
    return res.status(400).json({
      success: false,
      message: 'El tiempo transcurrido en minutos debe ser mayor o igual a 0.',
      error: 'VALIDATION_ERROR',
    });
  }
  if (isNaN(ph) || ph < 3.8 || ph > 7.2) {
    return res.status(400).json({
      success: false,
      message: 'El pH medido debe encontrarse dentro del rango biológico [3.80 - 7.20].',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
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

    // Recalibrar dinámica
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

    return res.status(200).json({
      success: true,
      data: {
        trial: updatedTrial,
        recalibracion: rec,
        curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
        curvaProyeccion: rec.curvaProyeccion,
      },
      message: `Lectura en minuto ${min} guardada con éxito en SQLite y proyección recalibrada.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al registrar la lectura en SQLite.',
      error: error.message,
    });
  }
};

/**
 * Elimina un ensayo experimental de SQLite
 */
const deleteTrial = (req, res) => {
  try {
    const { loteId } = req.params;
    const ok = eliminarEnsayoLaboratorio(loteId);
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: `El ensayo con lote '${loteId}' no existe o ya fue eliminado.`,
        error: 'TRIAL_NOT_FOUND',
      });
    }
    return res.status(200).json({
      success: true,
      message: `Ensayo '${loteId}' eliminado exitosamente de SQLite.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el ensayo de SQLite.',
      error: error.message,
    });
  }
};

/**
 * Elimina una lectura específica de un ensayo y recalcula la trayectoria
 */
const deleteTrialReading = (req, res) => {
  try {
    const { loteId, min } = req.params;
    const minNum = Number(min);
    if (minNum === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la lectura de inicio (T0).',
        error: 'VALIDATION_ERROR',
      });
    }

    const updatedTrial = eliminarLecturaDeEnsayo(loteId, minNum);
    if (!updatedTrial) {
      return res.status(404).json({
        success: false,
        message: `El ensayo '${loteId}' no existe.`,
        error: 'TRIAL_NOT_FOUND',
      });
    }

    // Recalibrar dinámicamente con las lecturas restantes
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

    return res.status(200).json({
      success: true,
      data: {
        trial: updatedTrial,
        recalibracion: rec,
        curvaRecalibrada: rec.curvaCompleta || rec.curvaProyeccion,
      },
      message: `Lectura en minuto ${min} eliminada con éxito.`,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la lectura de SQLite.',
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
  recalibrateDynamicTrajectory,
  listTrials,
  getTrial,
  createTrial,
  addTrialReading,
  deleteTrial,
  deleteTrialReading,
};
