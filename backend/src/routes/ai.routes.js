const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
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
  updateTrial,
  archiveTrial,
  addTrialReading,
  deleteTrial,
  deleteTrialReading,
  exportTrialData,
  getAuditLogs,
} = require('../controllers/ai.controller');

const router = express.Router();

// Limitador de tasa defensivo para cálculos cinéticos de IA
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes al servicio de predicción. Intente nuevamente en unos minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

router.use(aiLimiter);

// Métricas de calibración y dataset del Dr. Stalin Santacruz (público para visualización)
router.get('/metrics', getModelMetrics);
router.get('/dataset', getExperimentalDataset);

// Endpoints de predicción y simulación cinética ("What-If")
router.post('/predict', predictPoint);
router.post('/simulate', simulateTrajectory);

// Recalibración Dinámica en Tiempo Real con Asimilación de Datos Observados
router.post('/recalibrate', recalibrateDynamicTrajectory);

// Gestión y Persistencia de Ensayos Experimentales de Laboratorio (SQLite + Neon)
router.get('/trials', listTrials);
router.post('/trials', createTrial);
router.get('/trials/:loteId/export', exportTrialData);
router.get('/trials/:loteId/report.pdf', (req, res, next) => {
  req.query.formato = 'pdf';
  return exportTrialData(req, res, next);
});
router.get('/trials/:loteId', getTrial);
router.put('/trials/:loteId', updateTrial);
router.patch('/trials/:loteId/archive', archiveTrial);
router.post('/trials/:loteId/readings', addTrialReading);

// Eliminación y depuración de muestras protegidas por autenticación
router.delete('/trials/:loteId/readings/:min', authenticateToken, deleteTrialReading);
router.delete('/trials/:loteId', authenticateToken, deleteTrial);

// Historial de simulaciones y bitácora de auditoría
router.get('/simulations', getSavedSimulations);
router.get('/audit', getAuditLogs);

// Feedback Loop: Enriquecimiento dinámico del dataset (requiere usuario autenticado)
router.post('/feedback', authenticateToken, submitFeedbackBatch);

module.exports = router;
