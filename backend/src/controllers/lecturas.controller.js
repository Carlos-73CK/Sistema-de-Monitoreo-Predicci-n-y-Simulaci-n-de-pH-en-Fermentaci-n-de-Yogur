const createLecturaManual = (req, res) => {
  return res.status(201).json({
    success: true,
    data: {
      ensayo_id: req.params.id,
      lectura: req.body,
    },
    message: 'Lectura registrada correctamente (simulado).',
  });
};

const importarLecturas = (req, res) => {
  return res.status(202).json({
    success: true,
    data: {
      ensayo_id: req.params.id,
      estado_importacion: 'pendiente_procesamiento',
    },
    message: 'Importación de lecturas encolada (simulado).',
  });
};

module.exports = {
  createLecturaManual,
  importarLecturas,
};
