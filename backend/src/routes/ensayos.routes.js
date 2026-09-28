const express = require('express');
const {
  listEnsayos,
  createEnsayo,
  getEnsayoById,
  finalizarEnsayo,
} = require('../controllers/ensayos.controller');
const { validateCreateEnsayo } = require('../middlewares/validateEnsayo.middleware');

const router = express.Router();

router.get('/', listEnsayos);
router.post('/', validateCreateEnsayo, createEnsayo);
router.get('/:id', getEnsayoById);
router.patch('/:id/finalizar', finalizarEnsayo);

module.exports = router;
