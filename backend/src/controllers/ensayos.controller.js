const pool = require('../config/db');
const { validarLecturaFisicoquimica } = require('../validators/fermentationValidator');
const { ensayoRepository } = require('../repositories');
const { ensayosService } = require('../services');

const normalizeTipoSustrato = (tipoSustrato = '') => {
  const normalizado = String(tipoSustrato).trim().toLowerCase();
  if (normalizado.includes('almendra')) return 'almendra';
  if (normalizado.includes('avena')) return 'avena';
  if (normalizado.includes('chocho')) return 'chocho';
  if (normalizado.includes('coco')) return 'coco';
  if (normalizado.includes('soya')) return 'soya';
  if (normalizado === 'vaca') return 'vaca';
  return 'otra';
};

const mapEnsayo = (ensayo) => ({
  id: ensayo.id,
  codigo: ensayo.codigo || ensayo.nombre_lote || ensayo.lote_id,
  lote_id: ensayo.lote_id || ensayo.codigo || ensayo.nombre_lote,
  nombre_lote: ensayo.nombre_lote || ensayo.lote_id || ensayo.codigo,
  investigador: ensayo.investigador || 'Lab. Química de Alimentos — ULEAM',
  tipo_sustrato: ensayo.tipo_sustrato || ensayo.tipo_leche,
  tipo_leche: ensayo.tipo_leche || ensayo.tipo_sustrato,
  tipo_azucar: ensayo.tipo_azucar,
  masa_inoculo_g: Number(ensayo.masa_inoculo_g ?? ensayo.masa_inoculo),
  masa_inoculo: Number(ensayo.masa_inoculo ?? ensayo.masa_inoculo_g),
  porcentaje_inoculo: Number(ensayo.porcentaje_inoculo ?? 7.5),
  temperatura_objetivo: Number(ensayo.temperatura_incubacion ?? ensayo.temperatura_objetivo ?? ensayo.temperatura_c),
  temperatura_c: Number(ensayo.temperatura_c ?? ensayo.temperatura_incubacion ?? ensayo.temperatura_objetivo),
  volumen_ml: Number(ensayo.volumen_ml ?? ensayo.masa_solucion_g ?? ensayo.masa_leche),
  masa_leche: Number(ensayo.masa_leche ?? ensayo.masa_solucion_g ?? ensayo.volumen_ml),
  estado: ensayo.estado,
  viscosidad_final:
    ensayo.viscosidad_final_mpas !== null && ensayo.viscosidad_final_mpas !== undefined
      ? Number(ensayo.viscosidad_final_mpas)
      : (ensayo.viscosidad_final !== null && ensayo.viscosidad_final !== undefined
          ? Number(ensayo.viscosidad_final)
          : null),
  es_referencia_cientifica: Boolean(ensayo.es_referencia_cientifica),
  created_at: ensayo.created_at || ensayo.creado_en,
  usuario_id: ensayo.usuario_id,
  usuario_email: ensayo.usuario_email,
});

const mapLectura = (lectura) => ({
  id: lectura.id,
  ensayo_id: lectura.ensayo_id,
  minutos: Number(lectura.tiempo_minutos !== undefined ? lectura.tiempo_minutos : lectura.minutos),
  tiempo_minutos: Number(lectura.tiempo_minutos !== undefined ? lectura.tiempo_minutos : lectura.minutos),
  ph: Number(lectura.ph),
  temperatura: Number(lectura.temperatura),
  indice_refraccion:
    lectura.indice_refraccion_brix !== null && lectura.indice_refraccion_brix !== undefined
      ? Number(lectura.indice_refraccion_brix)
      : (lectura.indice_refraccion !== null && lectura.indice_refraccion !== undefined
          ? Number(lectura.indice_refraccion)
          : (lectura.brix !== undefined ? Number(lectura.brix) : null)),
  created_at: lectura.created_at || lectura.registrado_en,
});

/**
 * Consulta y lista todos los ensayos ordenados por fecha de creación descendente
 */
const listarEnsayos = async (req, res) => {
  try {
    const trials = await ensayoRepository.listar(req.query?.usuario_email || null);
    return res.status(200).json({
      success: true,
      data: trials.map(mapEnsayo),
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
    const trial = await ensayoRepository.buscarPorIdOCodigo(id);
    if (!trial) {
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
        ...mapEnsayo(trial),
        lecturas: (trial.lecturas || []).map(mapLectura),
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
 * Registra un nuevo ensayo en la base de datos (SQLite + sincronización Neon PostgreSQL)
 */
const crearEnsayo = async (req, res) => {
  const {
    codigo,
    nombre_lote,
    lote_id,
    investigador,
    tipo_sustrato,
    tipo_leche,
    tipo_azucar = 'lactosa',
    masa_inoculo_g,
    masa_inoculo,
    porcentaje_inoculo,
    temperatura_objetivo,
    temperatura_incubacion,
    temperatura_c,
    volumen_ml,
    masa_solucion_g,
    masa_leche,
  } = req.body || {};

  const codigoFinal = codigo || nombre_lote || lote_id;
  const sustratoFinal = tipo_sustrato || tipo_leche;
  const volumenFinal = volumen_ml ?? masa_solucion_g ?? masa_leche ?? 250;
  const tempFinal = temperatura_c ?? temperatura_incubacion ?? temperatura_objetivo ?? 42.0;

  let inoculoFinal = masa_inoculo_g !== undefined ? masa_inoculo_g : masa_inoculo;
  if (inoculoFinal === undefined && porcentaje_inoculo !== undefined) {
    inoculoFinal = Number(((Number(porcentaje_inoculo) / 100) * Number(volumenFinal)).toFixed(2));
  }

  if (!codigoFinal || !sustratoFinal || inoculoFinal === undefined || volumenFinal === undefined) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar codigo/nombre_lote, tipo_sustrato, masa_inoculo (o porcentaje_inoculo) y volumen.',
      error: 'VALIDATION_ERROR',
    });
  }

  const masaInoculoNum = Number(inoculoFinal);
  const temperaturaObjetivoNum = Number(tempFinal);
  const volumenMlNum = Number(volumenFinal);
  const pctInoculoNum = Number(((masaInoculoNum / volumenMlNum) * 100).toFixed(2));

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
    // 1. Crear en el servicio local (con predicción cinética inicial y registro en SQLite)
    const resultado = ensayosService.crearNuevoEnsayo({
      lote_id: codigoFinal,
      investigador: investigador || req.user?.nombre || 'Investigador ULEAM',
      tipo_sustrato: normalizeTipoSustrato(sustratoFinal),
      tipo_azucar,
      temperatura_c: temperaturaObjetivoNum,
      masa_inoculo_g: masaInoculoNum,
      porcentaje_inoculo: pctInoculoNum,
      volumen_ml: volumenMlNum,
    }, req.user);

    // 2. Si Neon PostgreSQL está configurado, replicar mediante repositorio transaccional
    if (pool.isNeonConfigured()) {
      await ensayoRepository.guardar(resultado.trial);
    }

    return res.status(201).json({
      success: true,
      data: mapEnsayo(resultado.trial),
      message: pool.isNeonConfigured()
        ? 'Ensayo creado y sincronizado con Neon PostgreSQL y SQLite.'
        : 'Ensayo creado correctamente en SQLite local.',
      error: null,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      data: null,
      message: error.message || 'No fue posible crear el ensayo.',
      errores: error.errores,
      error: error.errorCode || 'VALIDATION_ERROR',
    });
  }
};

/**
 * Actualiza un ensayo existente
 */
const actualizarEnsayo = async (req, res) => {
  const { id } = req.params;
  try {
    const actualizado = ensayosService.actualizarEnsayo(id, req.body || {});
    if (pool.isNeonConfigured()) {
      await ensayoRepository.guardar(actualizado);
    }
    return res.status(200).json({
      success: true,
      data: mapEnsayo(actualizado),
      message: 'Ensayo actualizado correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      data: null,
      message: error.message || 'No fue posible actualizar el ensayo.',
      error: error.errorCode || 'UPDATE_ERROR',
    });
  }
};

/**
 * Agrega una lectura periódica al ensayo
 */
const agregarLectura = async (req, res) => {
  const { id } = req.params;

  const validacion = validarLecturaFisicoquimica(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Valores inválidos para la lectura fisicoquímica.',
      errores: validacion.errores,
      error: 'VALIDATION_ERROR',
    });
  }

  const { minutos: minutosValor, ph: phValor, temperatura: temperaturaValor, indice_refraccion: refraccionValor } = validacion.datosSaneados;

  try {
    const resultado = ensayosService.agregarLectura(id, {
      tiempo_minutos: minutosValor,
      ph: phValor,
      temperatura: temperaturaValor,
      indice_refraccion: refraccionValor,
    });

    if (pool.isNeonConfigured()) {
      await ensayoRepository.registrarLectura(
        resultado.trial.lote_id,
        {
          tiempo_minutos: minutosValor,
          ph: phValor,
          temperatura: temperaturaValor,
          indice_refraccion: refraccionValor,
        },
        resultado.recalibracion
      );
    }

    return res.status(201).json({
      success: true,
      data: mapLectura({
        ensayo_id: id,
        tiempo_minutos: minutosValor,
        ph: phValor,
        temperatura: temperaturaValor,
        indice_refraccion: refraccionValor,
        created_at: new Date().toISOString(),
      }),
      message: 'Lectura registrada correctamente.',
      error: null,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      data: null,
      message: error.message || 'No fue posible registrar la lectura.',
      error: error.errorCode || 'ERROR',
    });
  }
};

/**
 * Finaliza el ensayo exigiendo la medición de viscosidad final (50 - 5500 mPa·s)
 */
const finalizarEnsayo = async (req, res) => {
  const { id } = req.params;
  const { viscosidad_final, viscosidad_final_mpas } = req.body || {};
  const rawVisco = viscosidad_final !== undefined ? viscosidad_final : viscosidad_final_mpas;

  const viscosidadFinal = Number(rawVisco);
  if (rawVisco === undefined || Number.isNaN(viscosidadFinal) || viscosidadFinal < 50 || viscosidadFinal > 5500) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Debe enviar viscosidad_final como número válido dentro del rango científico [50 - 5500 mPa·s].',
      error: 'VALIDATION_ERROR',
    });
  }

  try {
    const updated = await ensayoRepository.finalizar(id, viscosidadFinal);

    return res.status(200).json({
      success: true,
      data: {
        id,
        estado: 'completado',
        viscosidad_final: viscosidadFinal,
        fecha_fin: new Date().toISOString(),
        ...(updated ? mapEnsayo(updated) : {}),
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

/**
 * Archiva un ensayo experimental cambiando su estado a 'archivado'
 */
const archivarEnsayo = async (req, res) => {
  const { id } = req.params;
  try {
    const archivado = await ensayoRepository.archivar(id);
    if (!archivado) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `El ensayo '${id}' no fue encontrado.`,
        error: 'ENSAYO_NOT_FOUND',
      });
    }
    return res.status(200).json({
      success: true,
      data: mapEnsayo(archivado),
      message: `Ensayo '${archivado.codigo}' archivado correctamente.`,
      error: null,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      data: null,
      message: error.message || 'No fue posible archivar el ensayo.',
      error: error.errorCode || 'ARCHIVE_ERROR',
    });
  }
};

module.exports = {
  listarEnsayos,
  obtenerEnsayoPorId,
  crearEnsayo,
  actualizarEnsayo,
  agregarLectura,
  finalizarEnsayo,
  archivarEnsayo,
  listEnsayos: listarEnsayos,
  getEnsayoById: obtenerEnsayoPorId,
  createEnsayo: crearEnsayo,
  addLectura: agregarLectura,
};
