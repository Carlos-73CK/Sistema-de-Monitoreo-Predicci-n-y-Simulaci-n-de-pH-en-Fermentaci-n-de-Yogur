const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getPerfil } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes. Intente nuevamente en unos minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/perfil', authLimiter, authenticateToken, getPerfil);

module.exports = router;
