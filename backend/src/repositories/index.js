/**
 * Índice de la Capa de Repositorios (Acceso a Datos) — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 */

const usuarioRepository = require('./usuario.repository');
const ensayoRepository = require('./ensayo.repository');

module.exports = {
  usuarioRepository,
  ensayoRepository,
};
