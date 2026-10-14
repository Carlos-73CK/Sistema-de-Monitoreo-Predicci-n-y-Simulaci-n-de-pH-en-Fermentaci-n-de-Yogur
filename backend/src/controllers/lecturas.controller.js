const pool = require('../config/db');

/**
 * Registra una lectura periódica manual para un ensayo específico
 * Compatible con tiempo_minutos, ph, temperatura e indice_refraccion (°Brix)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createLecturaManual = async (req, res) => {
  const { id: ensayoId } = req.params;
  const {
    tiempo_minutos,
    minutos,
    ph,
    temperatura,
    indice_refraccion,
  } = req.body || {};

  const tiempoMin = tiempo_minutos !== undefined ? tiempo_minutos : minutos;

  if (tiempoMin === undefined || ph === undefined || temperatura === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar tiempo_minutos (o minutos), ph y temperatura.',
      error: 'VALIDATION_ERROR',
    });
  }

  const minutosNum = Number(tiempoMin);
  const phNum = Number(ph);
  const tempNum = Number(temperatura);
  const refraccionNum =
    indice_refraccion !== undefined && indice_refraccion !== null && indice_refraccion !== ''
      ? Number(indice_refraccion)
      : null;

  if (
    Number.isNaN(minutosNum) ||
    minutosNum < 0 ||
    Number.isNaN(phNum) ||
    phNum < 0 ||
    phNum > 14 ||
    Number.isNaN(tempNum) ||
    tempNum <= 0 ||
    (refraccionNum !== null && (Number.isNaN(refraccionNum) || refraccionNum < 0))
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores fisicoquímicos no válidos para la lectura.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    // 1. Validar que el ensayo exista y esté activo
    const ensayoCheck = await pool.query(
      `SELECT id, estado FROM ensayos WHERE id = $1 LIMIT 1`,
      [ensayoId]
    );

    if (ensayoCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ensayo no encontrado.',
        error: 'ENSAYO_NOT_FOUND',
      });
    }

    if (['finalizado', 'completado', 'cancelado'].includes(ensayoCheck.rows[0].estado)) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'El ensayo se encuentra finalizado y no admite nuevas lecturas.',
        error: 'ENSAYO_CLOSED',
      });
    }

    // 2. Insertar en lecturas_ensayo incluyendo indice_refraccion
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
  } catch (error) {
    const isDuplicate = error.code === '23505';
    return res.status(isDuplicate ? 409 : 500).json({
      success: false,
      data: null,
      message: isDuplicate
        ? 'Ya existe una lectura registrada para ese tiempo en este ensayo.'
        : 'No fue posible registrar la lectura.',
      error: error.message,
    });
  }
};

/**
 * Importa múltiples lecturas en bloque para un ensayo
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const importarLecturas = async (req, res) => {
  const { id: ensayoId } = req.params;
  const { lecturas } = req.body || {};

  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar un arreglo de lecturas para procesar.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lecturasInsertadas = [];
      for (const lec of lecturas) {
        const t = lec.tiempo_minutos !== undefined ? lec.tiempo_minutos : lec.minutos;
        const refr = lec.indice_refraccion !== undefined ? lec.indice_refraccion : null;

        const resLec = await client.query(
          `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE
             SET ph = EXCLUDED.ph,
                 temperatura = EXCLUDED.temperatura,
                 indice_refraccion = EXCLUDED.indice_refraccion
           RETURNING id, ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion, created_at`,
          [ensayoId, Number(t), Number(lec.ph), Number(lec.temperatura), refr !== null ? Number(refr) : null]
        );
        lecturasInsertadas.push(resLec.rows[0]);
      }

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        data: {
          ensayo_id: ensayoId,
          total_procesadas: lecturasInsertadas.length,
          lecturas: lecturasInsertadas,
        },
        message: 'Importación de lecturas completada correctamente.',
        error: null,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error al importar lecturas.',
      error: error.message,
    });
  }
};

module.exports = {
  createLecturaManual,
  addLectura: createLecturaManual,
  importarLecturas,
};
