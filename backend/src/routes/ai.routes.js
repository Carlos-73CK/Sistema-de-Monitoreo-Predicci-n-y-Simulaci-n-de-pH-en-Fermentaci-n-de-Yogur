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

// Historial de simulaciones en SQLite local
router.get('/simulations', getSavedSimulations);

// Feedback Loop: Enriquecimiento dinámico del dataset (requiere usuario autenticado)
router.post('/feedback', authenticateToken, submitFeedbackBatch);

module.exports = router;

