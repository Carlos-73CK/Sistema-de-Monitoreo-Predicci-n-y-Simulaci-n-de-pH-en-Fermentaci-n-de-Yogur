const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getPerfil } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

router.post('/login', authLimiter, login);
router.get('/perfil', authLimiter, authMiddleware, getPerfil);

module.exports = router;
