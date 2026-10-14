const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  listarEnsayos,
  obtenerEnsayoPorId,
  crearEnsayo,
  agregarLectura,
  finalizarEnsayo,
} = require('../controllers/ensayos.controller');

const router = express.Router();

const ensayosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

router.use(ensayosLimiter);

// Rutas de consulta (lectura pública o autenticada)
router.get('/', listarEnsayos);
router.get('/:id', obtenerEnsayoPorId);

// Rutas protegidas que modifican estado (requieren JWT válido)
router.post('/', authenticateToken, crearEnsayo);
router.post('/:id/lecturas', authenticateToken, agregarLectura);
router.patch('/:id/finalizar', authenticateToken, finalizarEnsayo);

module.exports = router;
