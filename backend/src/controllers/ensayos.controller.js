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
  tipo_sustrato: ensayo.tipo_leche,
  masa_inoculo_g: Number(ensayo.masa_inoculo),
  temperatura_objetivo: Number(ensayo.temperatura_objetivo),
  volumen_ml: Number(ensayo.masa_leche),
  estado: ensayo.estado,
  viscosidad_final: ensayo.viscosidad_final !== null ? Number(ensayo.viscosidad_final) : null,
  created_at: ensayo.created_at,
  usuario_id: ensayo.usuario_id,
});

const mapLectura = (lectura) => ({
  id: lectura.id,
  ensayo_id: lectura.ensayo_id,
  minutos: Number(lectura.tiempo_minutos),
  ph: Number(lectura.ph),
  temperatura: Number(lectura.temperatura),
  created_at: lectura.created_at,
});

const listarEnsayos = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, usuario_id, nombre_lote, tipo_leche, masa_leche, masa_inoculo,
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

const obtenerEnsayoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const ensayoResult = await pool.query(
      `SELECT id, usuario_id, nombre_lote, tipo_leche, masa_leche, masa_inoculo,
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
      `SELECT id, ensayo_id, tiempo_minutos, ph, temperatura, created_at
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

const crearEnsayo = async (req, res) => {
  const {
    codigo,
    tipo_sustrato,
    masa_inoculo_g,
    temperatura_objetivo = 42.0,
    volumen_ml,
  } = req.body || {};

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Usuario no autenticado.',
      error: 'AUTH_UNAUTHORIZED',
    });
  }

  if (!codigo || !tipo_sustrato || masa_inoculo_g === undefined || volumen_ml === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar codigo, tipo_sustrato, masa_inoculo_g y volumen_ml.',
      error: 'VALIDATION_ERROR',
    });
  }

  const masaInoculo = Number(masa_inoculo_g);
  const temperaturaObjetivo = Number(temperatura_objetivo);
  const volumenMl = Number(volumen_ml);

  if (Number.isNaN(masaInoculo) || masaInoculo <= 0 || Number.isNaN(temperaturaObjetivo) || Number.isNaN(volumenMl) || volumenMl <= 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores numéricos inválidos en masa_inoculo_g, temperatura_objetivo o volumen_ml.',
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
       RETURNING id, usuario_id, nombre_lote, tipo_leche, masa_leche, masa_inoculo,
                 temperatura_objetivo, estado, viscosidad_final, created_at`,
      [
        req.user.id,
        codigo,
        normalizeTipoSustrato(tipo_sustrato),
        'lactosa',
        volumenMl,
        masaInoculo,
        temperaturaObjetivo,
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

const agregarLectura = async (req, res) => {
  const { id } = req.params;
  const { minutos, ph, temperatura } = req.body || {};

  if (minutos === undefined || ph === undefined || temperatura === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar minutos, ph y temperatura.',
      error: 'VALIDATION_ERROR',
    });
  }

  const minutosValor = Number(minutos);
  const phValor = Number(ph);
  const temperaturaValor = Number(temperatura);

  if (
    Number.isNaN(minutosValor) ||
    minutosValor < 0 ||
    Number.isNaN(phValor) ||
    phValor < 0 ||
    phValor > 14 ||
    Number.isNaN(temperaturaValor) ||
    temperaturaValor <= 0
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores inválidos para minutos, ph o temperatura.',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const ensayoResult = await pool.query('SELECT id, estado FROM ensayos WHERE id = $1 LIMIT 1', [id]);

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
      `INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura)
       VALUES ($1, $2, $3, $4)
       RETURNING id, ensayo_id, tiempo_minutos, ph, temperatura, created_at`,
      [id, minutosValor, phValor, temperaturaValor]
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
      message: duplicateReading ? 'Ya existe una lectura para ese minuto en este ensayo.' : 'No fue posible registrar la lectura.',
      error: error.message,
    });
  }
};

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
       SET estado = 'finalizado',
           viscosidad_final = $2
       WHERE id = $1
       RETURNING id, usuario_id, nombre_lote, tipo_leche, masa_leche, masa_inoculo,
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
  listEnsayos: listarEnsayos,
  getEnsayoById: obtenerEnsayoPorId,
  createEnsayo: crearEnsayo,
};
