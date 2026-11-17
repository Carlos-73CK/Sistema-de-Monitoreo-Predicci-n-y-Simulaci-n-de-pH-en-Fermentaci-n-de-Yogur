/**
 * Punto de acceso canónico al Pool centralizado de Neon PostgreSQL — PrediYogur
 * Reexporta la instancia única de `backend/src/config/db.js` para evitar crear
 * múltiples pools independientes y mantener compatibilidad total en el proyecto.
 */

const db = require('./db');

module.exports = db;
