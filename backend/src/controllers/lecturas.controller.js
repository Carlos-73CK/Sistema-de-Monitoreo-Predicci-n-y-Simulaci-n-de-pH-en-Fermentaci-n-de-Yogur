const pool = require('../config/db');
const { validarLecturaFisicoquimica } = require('../validators/fermentationValidator');
const { ensayosService } = require('../services');

/**
 * Registra una lectura periódica manual para un ensayo específico
 * Compatible con tiempo_minutos, ph, temperatura e indice_refraccion (°Brix)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createLecturaManual = async (req, res) => {
  const { id: ensayoId } = req.params;

  const validacion = validarLecturaFisicoquimica(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores fisicoquímicos no válidos para la lectura.',
      errores: validacion.errores,
      error: 'VALIDATION_ERROR',
    });
  }

  const { minutos: minutosNum, ph: phNum, temperatura: tempNum, indice_refraccion: refraccionNum } = validacion.datosSaneados;

  try {
    // 1. Intentar en PostgreSQL si está disponible
    if (pool && typeof pool.query === 'function') {
      try {
        const ensayoCheck = await pool.query(
          `SELECT id, estado FROM ensayos WHERE id = $1 LIMIT 1`,
          [ensayoId]
        );

        if (ensayoCheck.rowCount > 0) {
          if (['finalizado', 'completado', 'cancelado'].includes(ensayoCheck.rows[0].estado)) {
            return res.status(409).json({
              success: false,
              data: null,
              message: 'El ensayo se encuentra finalizado y no admite nuevas lecturas.',
              error: 'ENSAYO_CLOSED',
            });
          }

          const result = await pool.query(
            `INSERT INTO lecturas_ensayo (
               ensayo_id,
               tiempo_minutos,
               ph,
               temperatura,
               indice_refraccion
             )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion, created_at`,
            [ensayoId, minutosNum, phNum, tempNum, refraccionNum]
          );

          const lectura = result.rows[0];
          return res.status(201).json({
            success: true,
            data: {
              id: lectura.id,
              ensayo_id: lectura.ensayo_id,
              minutos: Number(lectura.tiempo_minutos),
              tiempo_minutos: Number(lectura.tiempo_minutos),
              ph: Number(lectura.ph),
              temperatura: Number(lectura.temperatura),
              indice_refraccion: lectura.indice_refraccion !== null ? Number(lectura.indice_refraccion) : null,
              created_at: lectura.created_at,
            },
            message: 'Lectura registrada correctamente.',
            error: null,
          });
        }
      } catch (pgErr) {
        if (pgErr.code === '23505') {
          return res.status(409).json({
            success: false,
            data: null,
            message: 'Ya existe una lectura registrada para ese tiempo en este ensayo.',
            error: 'DUPLICATE_READING',
          });
        }
      }
    }

    // 2. Fallback a SQLite autónomo
    ensayosService.agregarLectura(ensayoId, {
      tiempo_minutos: minutosNum,
      ph: phNum,
      temperatura: tempNum,
      indice_refraccion: refraccionNum,
    });

    return res.status(201).json({
      success: true,
      data: {
        ensayo_id: ensayoId,
        minutos: minutosNum,
        tiempo_minutos: minutosNum,
        ph: phNum,
        temperatura: tempNum,
        indice_refraccion: refraccionNum,
        created_at: new Date().toISOString(),
      },
      message: 'Lectura registrada correctamente en SQLite.',
      error: null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error.message || 'No fue posible registrar la lectura.',
      error: error.errorCode || 'ERROR',
    });
  }
};

/**
 * Importa múltiples lecturas en bloque para un ensayo
 */
const importarLecturas = async (req, res) => {
  const { id: ensayoId } = req.params;
  const { lecturas } = req.body || {};

  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar un arreglo no vacío de lecturas.',
      error: 'VALIDATION_ERROR',
    });
  }

  let agregadas = 0;
  for (const item of lecturas) {
    try {
      ensayosService.agregarLectura(ensayoId, item);
      agregadas++;
    } catch (_) {}
  }

  return res.status(201).json({
    success: true,
    data: { total: agregadas },
    message: `${agregadas} lecturas importadas correctamente.`,
    error: null,
  });
};

module.exports = {
  createLecturaManual,
  importarLecturas,
};
