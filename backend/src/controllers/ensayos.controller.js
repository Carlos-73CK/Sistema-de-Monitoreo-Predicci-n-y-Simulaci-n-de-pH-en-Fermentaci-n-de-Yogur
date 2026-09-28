const listEnsayos = (_req, res) => {
  return res.status(200).json({
    success: true,
    data: [],
    message: 'Listado de ensayos obtenido correctamente (simulado).',
  });
};

const createEnsayo = (req, res) => {
  return res.status(201).json({
    success: true,
    data: {
      id: 'mock-ensayo-id',
      ...req.body,
      estado: 'en_proceso',
    },
    message: 'Ensayo creado correctamente (simulado).',
  });
};

const getEnsayoById = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.params.id,
      tipo_leche: 'vaca',
      tipo_azucar: 'lactosa',
      masa_leche: 1000,
      masa_inoculo: 50,
      estado: 'en_proceso',
    },
    message: 'Detalle de ensayo obtenido correctamente (simulado).',
  });
};

const finalizarEnsayo = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.params.id,
      estado: 'finalizado',
      ph_final: req.body?.ph_final || 4.5,
    },
    message: 'Ensayo finalizado correctamente (simulado).',
  });
};

module.exports = {
  listEnsayos,
  createEnsayo,
  getEnsayoById,
  finalizarEnsayo,
};
