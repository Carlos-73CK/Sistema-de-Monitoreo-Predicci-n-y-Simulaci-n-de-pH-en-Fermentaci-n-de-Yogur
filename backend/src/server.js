require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log('🚀 Servidor PrediYogur Backend iniciado con éxito');
  console.log(`📡 Escuchando en el puerto: ${PORT}`);
  console.log(`🩺 Health check disponible en: http://localhost:${PORT}/api/health`);
  console.log('====================================================');

  // Verificación no bloqueante de conexión al Pool PostgreSQL
  try {
    const client = await pool.connect();
    console.log('✅ Conexión inicial al pool de PostgreSQL establecida correctamente.');
    client.release();
  } catch (error) {
    console.warn('⚠️ Advertencia: No se pudo conectar inmediatamente a PostgreSQL:', error.message);
    console.warn('💡 Verifica las variables en el archivo .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)');
  }
});

// Cierre controlado de conexiones (Graceful Shutdown)
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor de forma segura...`);
  server.close(async () => {
    console.log('🔒 Servidor HTTP finalizado.');
    try {
      await pool.end();
      console.log('🔒 Pool de PostgreSQL cerrado con éxito.');
    } catch (err) {
      console.error('❌ Error al cerrar el pool de PostgreSQL:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
