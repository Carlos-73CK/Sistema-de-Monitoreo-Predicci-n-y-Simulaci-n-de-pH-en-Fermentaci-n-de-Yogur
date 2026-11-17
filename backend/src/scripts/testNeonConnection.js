/**
 * Punto de entrada solicitado en `backend/src/scripts/testNeonConnection.js`
 * Delega la ejecución al script central `backend/scripts/testNeonConnection.js`.
 */

const { ejecutarPruebaNeon } = require('../../scripts/testNeonConnection');

if (require.main === module) {
  ejecutarPruebaNeon();
}

module.exports = { ejecutarPruebaNeon };
