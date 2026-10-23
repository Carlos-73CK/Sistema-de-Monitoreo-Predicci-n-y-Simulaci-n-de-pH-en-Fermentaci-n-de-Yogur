/**
 * Índice Central de la Capa de Servicios — PrediYogur Backend
 * Cátedra de Química de Alimentos (ULEAM)
 */

const authService = require('./auth.service');
const kineticService = require('./kinetic.service');
const ensayosService = require('./ensayos.service');

module.exports = {
  authService,
  kineticService,
  ensayosService,
};
