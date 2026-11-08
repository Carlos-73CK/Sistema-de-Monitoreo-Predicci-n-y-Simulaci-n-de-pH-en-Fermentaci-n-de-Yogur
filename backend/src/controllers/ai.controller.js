/**
 * Controlador de Inteligencia Artificial y Cinética de Hill — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Controlador HTTP desacoplado: gestiona únicamente el ciclo de petición y respuesta (req, res, status codes)
 * y delega la lógica de cálculo biofísico y gestión de ensayos a kinetic.service.js y ensayos.service.js.
 */

const jwt = require('jsonwebtoken');
const { kineticService, ensayosService } = require('../services');

/**
 * Helper para extraer el usuario autenticado desde req.user o el token Bearer
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
 * Retorna las métricas científicas de validación del modelo (R², RMSE, MAE)
 */
const getModelMetrics = (_req, res, next) => {
  try {
    const metricas = kineticService.obtenerMetricasModelo();
    return res.status(200).json({
      success: true,
      data: metricas,
      message: 'Métricas de validación del modelo predictivo calculadas con éxito.',
      error: null,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retorna el dataset experimental del Dr. Stalin Santacruz
 */
const getExperimentalDataset = (_req, res, next) => {
  try {
    const data = kineticService.obtenerDatasetExperimental();
    return res.status(200).json({
      success: true,
      data,
      message: 'Dataset experimental de laboratorio recuperado con éxito.',
      error: null,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Predice un punto cinético específico (pH y Brix a tiempo t) y tiempo de corte
 */
const predictPoint = (req, res, next) => {
  try {
    const resultado = kineticService.predecirPuntoCinético(req.body);
    return res.status(200).json({
      success: true,
      data: resultado,
      message: 'Predicción puntual calculada correctamente.',
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Simula la fermentación completa y calcula la trayectoria del modelo Hill
 */
const simulateTrajectory = (req, res, next) => {
  try {
    const resultado = kineticService.simularTrayectoriaCompleta(req.body);
    return res.status(200).json({
      success: true,
      data: resultado,
      message: 'Simulación de fermentación generada exitosamente con el modelo de Hill.',
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Consulta el historial de simulaciones realizadas
 */
const getSavedSimulations = (req, res, next) => {
  try {
    const limite = Number(req.query.limit || 50);
    const historial = kineticService.listarHistorialPredicciones(limite);
    return res.status(200).json({
      success: true,
      data: {
        total: historial.length,
        historial,
      },
      message: 'Historial de simulaciones recuperado con éxito.',
      error: null,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Feedback Loop: Recibe un nuevo lote real finalizado para incorporarlo al dataset
 */
const submitFeedbackBatch = (req, res, next) => {
  try {
    const resultado = kineticService.registrarLoteFeedback(req.body);
    return res.status(201).json({
      success: true,
      data: resultado,
      message: resultado.mensaje,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Recalibra dinámicamente la trayectoria de fermentación a partir de lecturas observadas
 */
const recalibrateDynamicTrajectory = (req, res, next) => {
  try {
    const rec = kineticService.recalibrarDinamica(req.body);
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
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Lista todos los ensayos experimentales ordenados cronológicamente
 */
const listTrials = (req, res, next) => {
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

    const trials = ensayosService.listarEnsayos(filtroEmail);
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
    return next(error);
  }
};

/**
 * Obtiene un ensayo específico con su proyección cinética recalculada
 */
const getTrial = (req, res, next) => {
  try {
    const { loteId } = req.params;
    const resultado = ensayosService.obtenerEnsayoDetalle(loteId);
    return res.status(200).json({
      success: true,
      data: resultado,
      message: `Ensayo '${loteId}' recuperado con proyección cinética actualizada.`,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Crea un nuevo ensayo experimental y lo persiste en SQLite
 */
const createTrial = (req, res, next) => {
  try {
    const usuarioAuth = extraerUsuarioDePeticion(req);
    const resultado = ensayosService.crearNuevoEnsayo(req.body, usuarioAuth);
    const loteId = resultado.trial.lote_id;
    return res.status(201).json({
      success: true,
      data: resultado,
      message: `¡Ensayo '${loteId}' creado y registrado con éxito en SQLite!`,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        errores: error.errores || undefined,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Agrega una lectura periódica a un ensayo existente y recalibra dinámicamente
 */
const addTrialReading = (req, res, next) => {
  try {
    const { loteId } = req.params;
    const resultado = ensayosService.agregarLectura(loteId, req.body);
    const min = Number(req.body.tiempo_minutos !== undefined ? req.body.tiempo_minutos : req.body.minutos);
    return res.status(200).json({
      success: true,
      data: resultado,
      message: `Lectura en minuto ${min} guardada con éxito en SQLite y proyección recalibrada.`,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Elimina un ensayo experimental de SQLite
 */
const deleteTrial = (req, res, next) => {
  try {
    const { loteId } = req.params;
    ensayosService.eliminarEnsayo(loteId);
    return res.status(200).json({
      success: true,
      message: `Ensayo '${loteId}' eliminado exitosamente de SQLite.`,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Elimina una lectura específica de un ensayo y recalcula la trayectoria
 */
const deleteTrialReading = (req, res, next) => {
  try {
    const { loteId, min } = req.params;
    const resultado = ensayosService.eliminarLectura(loteId, min);
    return res.status(200).json({
      success: true,
      data: resultado,
      message: `Lectura en minuto ${min} eliminada con éxito.`,
      error: null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
  }
};

/**
 * Exporta las lecturas y datos de un ensayo en formato CSV o JSON
 */
const exportTrialData = (req, res, next) => {
  try {
    const { loteId } = req.params;
    const formato = String(req.query.formato || 'csv').trim().toLowerCase();
    const resultado = ensayosService.exportarDatosEnsayo(loteId, formato);

    if (resultado.tipo === 'json') {
      return res.status(200).json({
        success: true,
        data: resultado.data,
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
    return res.status(200).send(resultado.content);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        message: error.message,
        error: error.errorCode || 'ERROR',
      });
    }
    return next(error);
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
  exportTrialData,
};
