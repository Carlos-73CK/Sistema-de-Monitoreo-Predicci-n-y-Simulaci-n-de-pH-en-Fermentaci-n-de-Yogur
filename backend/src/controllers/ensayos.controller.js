const pool = require('../config/db');

const normalizeTipoSustrato = (tipoSustrato = '') => {
  const normalizado = String(tipoSustrato).trim().toLowerCase();

  if (normalizado === 'chocho' || normalizado === 'vegetal_chocho') return 'vegetal_chocho';
  if (normalizado === 'coco' || normalizado === 'vegetal_coco') return 'vegetal_coco';
  if (normalizado === 'vaca') return 'vaca';
  return 'otra';
};

const mapEnsayo = (ensayo) => ({
  id: ensayo.id,
  codigo: ensayo.nombre_lote,
  nombre_lote: ensayo.nombre_lote,
  tipo_sustrato: ensayo.tipo_leche,
  tipo_leche: ensayo.tipo_leche,
  tipo_azucar: ensayo.tipo_azucar,
  masa_inoculo_g: Number(ensayo.masa_inoculo),
  masa_inoculo: Number(ensayo.masa_inoculo),
  temperatura_objetivo: Number(ensayo.temperatura_objetivo),
  volumen_ml: Number(ensayo.masa_leche),
  masa_leche: Number(ensayo.masa_leche),
  estado: ensayo.estado,
  viscosidad_final: ensayo.viscosidad_final !== null ? Number(ensayo.viscosidad_final) : null,
  created_at: ensayo.created_at,
  usuario_id: ensayo.usuario_id,
});

const mapLectura = (lectura) => ({
  id: lectura.id,
  ensayo_id: lectura.ensayo_id,
  minutos: Number(lectura.tiempo_minutos),
  tiempo_minutos: Number(lectura.tiempo_minutos),
  ph: Number(lectura.ph),
  temperatura: Number(lectura.temperatura),
  indice_refraccion:
    lectura.indice_refraccion !== null && lectura.indice_refraccion !== undefined
      ? Number(lectura.indice_refraccion)
      : null,
  created_at: lectura.created_at,
});

/**
 * Consulta y lista todos los ensayos ordenados por fecha de creación descendente
 */
const listarEnsayos = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, usuario_id, nombre_lote, tipo_leche, tipo_azucar, masa_leche, masa_inoculo,
              temperatura_objetivo, estado, viscosidad_final, created_at
       FROM ensayos
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows.map(mapEnsayo),
      message: 'Listado de ensayos obtenido correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'No fue posible listar los ensayos.',
      error: error.message,
    });
  }
};

/**
 * Obtiene el detalle de un ensayo junto con su serie temporal ordenada de lecturas
 */
const obtenerEnsayoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const ensayoResult = await pool.query(
      `SELECT id, usuario_id, nombre_lote, tipo_leche, tipo_azucar, masa_leche, masa_inoculo,
              temperatura_objetivo, estado, viscosidad_final, created_at
       FROM ensayos
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (ensayoResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ensayo no encontrado.',
        error: 'ENSAYO_NOT_FOUND',
      });
    }

    const lecturasResult = await pool.query(
      `SELECT id, ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion, created_at
       FROM lecturas_ensayo
       WHERE ensayo_id = $1
       ORDER BY tiempo_minutos ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...mapEnsayo(ensayoResult.rows[0]),
        lecturas: lecturasResult.rows.map(mapLectura),
      },
      message: 'Detalle de ensayo obtenido correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: 'No fue posible obtener el ensayo.',
      error: error.message,
    });
  }
};

/**
 * Registra un nuevo ensayo en la base de datos
 */
const crearEnsayo = async (req, res) => {
  const {
    codigo,
    nombre_lote,
    tipo_sustrato,
    tipo_leche,
    tipo_azucar = 'lactosa',
    masa_inoculo_g,
    masa_inoculo,
    temperatura_objetivo = 42.0,
    volumen_ml,
    masa_leche,
  } = req.body || {};

  const codigoFinal = codigo || nombre_lote;
  const sustratoFinal = tipo_sustrato || tipo_leche;
  const inoculoFinal = masa_inoculo_g !== undefined ? masa_inoculo_g : masa_inoculo;
  const volumenFinal = volumen_ml !== undefined ? volumen_ml : masa_leche;

  // Fallback si no hay req.user (ej. modo prueba): consultar primer usuario disponible
  let usuarioId = req.user?.id;
  if (!usuarioId) {
    const primerUser = await pool.query('SELECT id FROM usuarios LIMIT 1');
    if (primerUser.rowCount > 0) {
      usuarioId = primerUser.rows[0].id;
    } else {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Usuario no autenticado.',
        error: 'AUTH_UNAUTHORIZED',
      });
    }
  }

  if (!codigoFinal || !sustratoFinal || inoculoFinal === undefined || volumenFinal === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar codigo/nombre_lote, tipo_sustrato, masa_inoculo y volumen.',
      error: 'VALIDATION_ERROR',
    });
  }

  const masaInoculoNum = Number(inoculoFinal);
  const temperaturaObjetivoNum = Number(temperatura_objetivo);
  const volumenMlNum = Number(volumenFinal);

  if (
    Number.isNaN(masaInoculoNum) ||
    masaInoculoNum <= 0 ||
    Number.isNaN(temperaturaObjetivoNum) ||
    Number.isNaN(volumenMlNum) ||
    volumenMlNum <= 0
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores numéricos inválidos en masa de inóculo, temperatura o volumen.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ensayos (
         usuario_id,
         nombre_lote,
         tipo_leche,
         tipo_azucar,
         masa_leche,
         masa_inoculo,
         temperatura_objetivo,
         estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_proceso')
       RETURNING id, usuario_id, nombre_lote, tipo_leche, tipo_azucar, masa_leche, masa_inoculo,
                 temperatura_objetivo, estado, viscosidad_final, created_at`,
      [
        usuarioId,
        codigoFinal,
        normalizeTipoSustrato(sustratoFinal),
        tipo_azucar,
        volumenMlNum,
        masaInoculoNum,
        temperaturaObjetivoNum,
      ]
    );

    return res.status(201).json({
      success: true,
      data: mapEnsayo(result.rows[0]),
      message: 'Ensayo creado correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'No fue posible crear el ensayo.',
      error: error.message,
    });
  }
};

/**
 * Agrega una lectura periódica al ensayo, compatible con indice_refraccion
 */
const agregarLectura = async (req, res) => {
  const { id } = req.params;
  const {
    minutos,
    tiempo_minutos,
    ph,
    temperatura,
    indice_refraccion,
  } = req.body || {};

  const tiempoMin = minutos !== undefined ? minutos : tiempo_minutos;

  if (tiempoMin === undefined || ph === undefined || temperatura === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar minutos/tiempo_minutos, ph y temperatura.',
      error: 'VALIDATION_ERROR',
    });
  }

  const minutosValor = Number(tiempoMin);
  const phValor = Number(ph);
  const temperaturaValor = Number(temperatura);
  const refraccionValor =
    indice_refraccion !== undefined && indice_refraccion !== null && indice_refraccion !== ''
      ? Number(indice_refraccion)
      : null;

  if (
    Number.isNaN(minutosValor) ||
    minutosValor < 0 ||
    Number.isNaN(phValor) ||
    phValor < 0 ||
    phValor > 14 ||
    Number.isNaN(temperaturaValor) ||
    temperaturaValor <= 0 ||
    (refraccionValor !== null && (Number.isNaN(refraccionValor) || refraccionValor < 0))
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores inválidos para minutos, ph, temperatura o índice de refracción.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const ensayoResult = await pool.query(
      'SELECT id, estado FROM ensayos WHERE id = $1 LIMIT 1',
      [id]
    );

    if (ensayoResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ensayo no encontrado.',
        error: 'ENSAYO_NOT_FOUND',
      });
    }

    if (['finalizado', 'completado', 'cancelado'].includes(ensayoResult.rows[0].estado)) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'El ensayo no acepta nuevas lecturas por su estado actual.',
        error: 'ENSAYO_CLOSED',
      });
    }

    const lecturaResult = await pool.query(
      `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion, created_at`,
      [id, minutosValor, phValor, temperaturaValor, refraccionValor]
    );

    return res.status(201).json({
      success: true,
      data: mapLectura(lecturaResult.rows[0]),
      message: 'Lectura registrada correctamente.',
      error: null,
    });
  } catch (error) {
    const duplicateReading = error.code === '23505';

    return res.status(duplicateReading ? 409 : 400).json({
      success: false,
      data: null,
      message: duplicateReading
        ? 'Ya existe una lectura para ese minuto en este ensayo.'
        : 'No fue posible registrar la lectura.',
      error: error.message,
    });
  }
};

/**
 * Finaliza el ensayo exigiendo la medición de viscosidad final (regla del Dr. Stalin Santacruz)
 */
const finalizarEnsayo = async (req, res) => {
  const { id } = req.params;
  const { viscosidad_final } = req.body || {};

  const viscosidadFinal = Number(viscosidad_final);
  if (viscosidad_final === undefined || Number.isNaN(viscosidadFinal) || viscosidadFinal <= 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar viscosidad_final como número mayor a 0.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE ensayos
       SET estado = 'completado',
           viscosidad_final = $2
       WHERE id = $1
       RETURNING id, usuario_id, nombre_lote, tipo_leche, tipo_azucar, masa_leche, masa_inoculo,
                 temperatura_objetivo, estado, viscosidad_final, created_at`,
      [id, viscosidadFinal]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Ensayo no encontrado.',
        error: 'ENSAYO_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...mapEnsayo(result.rows[0]),
        fecha_fin: new Date().toISOString(),
      },
      message: 'Ensayo finalizado correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'No fue posible finalizar el ensayo.',
      error: error.message,
    });
  }
};

module.exports = {
  listarEnsayos,
  obtenerEnsayoPorId,
  crearEnsayo,
  agregarLectura,
  finalizarEnsayo,
  // Alias de compatibilidad
  listEnsayos: listarEnsayos,
  getEnsayoById: obtenerEnsayoPorId,
  createEnsayo: crearEnsayo,
  addLectura: agregarLectura,
};
