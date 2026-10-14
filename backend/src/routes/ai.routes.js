const express = require('express');
const {
  getModelMetrics,
  getExperimentalDataset,
  predictPoint,
  simulateTrajectory,
} = require('../controllers/ai.controller');

const router = express.Router();

// Métricas de calibración y dataset del Dr. Stalin Santacruz
router.get('/metrics', getModelMetrics);
router.get('/dataset', getExperimentalDataset);

// Endpoints de predicción y simulación cinética
router.post('/predict', predictPoint);
router.post('/simulate', simulateTrajectory);

module.exports = router;
