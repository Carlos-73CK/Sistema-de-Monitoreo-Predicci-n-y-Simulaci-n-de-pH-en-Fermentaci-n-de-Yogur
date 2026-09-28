const REQUIRED_FIELDS = ['tipo_leche', 'tipo_azucar', 'masa_leche', 'masa_inoculo'];

const validateCreateEnsayo = (req, res, next) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Faltan campos obligatorios: ${missingFields.join(', ')}.`,
      message: 'Error de validación sintáctica.',
    });
  }

  return next();
};

module.exports = {
  validateCreateEnsayo,
};
