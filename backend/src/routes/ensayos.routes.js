const express = require('express');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middlewares/authMiddleware');
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
  max: 200,
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
router.use(authMiddleware);

router.get('/', listarEnsayos);
router.get('/:id', obtenerEnsayoPorId);
router.post('/', crearEnsayo);
router.post('/:id/lecturas', agregarLectura);
router.patch('/:id/finalizar', finalizarEnsayo);

module.exports = router;
