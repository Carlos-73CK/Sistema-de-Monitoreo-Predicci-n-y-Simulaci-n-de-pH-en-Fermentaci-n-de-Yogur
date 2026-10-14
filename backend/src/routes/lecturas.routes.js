const express = require('express');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  createLecturaManual,
  importarLecturas,
} = require('../controllers/lecturas.controller');

const router = express.Router();

// Rutas de lecturas protegidas con autenticación JWT
router.post('/:id/lecturas', authenticateToken, createLecturaManual);
router.post('/:id/importar', authenticateToken, importarLecturas);

module.exports = router;
