const authRoutes = require('./auth.routes');
const ensayosRoutes = require('./ensayos.routes');
const lecturasRoutes = require('./lecturas.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/ensayos', ensayosRoutes);
  app.use('/api/ensayos', lecturasRoutes);
};

module.exports = {
  registerRoutes,
};
