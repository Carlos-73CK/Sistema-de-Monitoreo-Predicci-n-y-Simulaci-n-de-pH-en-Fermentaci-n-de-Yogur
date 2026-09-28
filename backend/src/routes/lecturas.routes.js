const express = require('express');
const {
  createLecturaManual,
  importarLecturas,
} = require('../controllers/lecturas.controller');

const router = express.Router();

router.post('/:id/lecturas', createLecturaManual);
router.post('/:id/importar', importarLecturas);

module.exports = router;
