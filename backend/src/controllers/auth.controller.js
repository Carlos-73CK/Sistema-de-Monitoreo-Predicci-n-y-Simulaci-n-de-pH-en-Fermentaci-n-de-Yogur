const register = (req, res) => {
  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: 'mock-user-id',
        nombre: req.body?.nombre || null,
        email: req.body?.email || null,
      },
    },
    message: 'Usuario registrado correctamente (simulado).',
  });
};

const login = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: req.body?.email || null,
      },
    },
    message: 'Inicio de sesión exitoso (simulado).',
  });
};

module.exports = {
  register,
  login,
};
