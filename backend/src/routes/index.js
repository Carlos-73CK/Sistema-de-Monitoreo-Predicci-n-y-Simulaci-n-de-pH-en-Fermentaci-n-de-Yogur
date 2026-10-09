const authRoutes = require('./auth.routes');
const ensayosRoutes = require('./ensayos.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/ensayos', ensayosRoutes);
};

module.exports = {
  registerRoutes,
};
