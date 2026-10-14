const authRoutes = require('./auth.routes');
const ensayosRoutes = require('./ensayos.routes');
const aiRoutes = require('./ai.routes');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/ensayos', ensayosRoutes);
  app.use('/api/ai', aiRoutes);
};

module.exports = {
  registerRoutes,
};
