const authRoutes = require('./auth.routes');
const ensayosRoutes = require('./ensayos.routes');
const aiRoutes = require('./ai.routes');

const registerRoutes = (app) => {
  // Soporte simultáneo para prefijos /api/ y /api/v1/
  app.use('/api/auth', authRoutes);
  app.use('/api/v1/auth', authRoutes);

  app.use('/api/ensayos', ensayosRoutes);
  app.use('/api/v1/ensayos', ensayosRoutes);

  app.use('/api/ai', aiRoutes);
  app.use('/api/v1/ai', aiRoutes);
};

module.exports = {
  registerRoutes,
};
