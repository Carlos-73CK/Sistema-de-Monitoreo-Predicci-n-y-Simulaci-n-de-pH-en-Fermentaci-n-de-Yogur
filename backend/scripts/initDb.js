/**
 * Script de Inicialización y Aprovisionamiento en Neon PostgreSQL — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 *
 * Ejecuta en orden estricto:
 * 1. database/neon_schema.sql
 * 2. database/neon_seeds.sql
 * 3. database/neon_views.sql
 */

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function run() {
  console.log('------------------------------------------------------------');
  console.log('🚀 [PrediYogur] Inicializando Aprovisionamiento en Neon PostgreSQL');
  console.log('------------------------------------------------------------');

  try {
    const prueba = await pool.probarConexionNeon();
    if (!prueba.conectado) {
      console.error(`❌ No fue posible conectar a Neon PostgreSQL: ${prueba.mensaje}`);
      console.error('💡 Configure DATABASE_URL en backend/.env antes de ejecutar npm run db:init.');
      process.exit(1);
    }

    console.log(`✅ Conectado a: ${prueba.detalle.base_datos} como ${prueba.detalle.usuario_actual}`);

    const schemaPath = path.resolve(__dirname, '../../database/neon_schema.sql');
    const seedsPath = path.resolve(__dirname, '../../database/neon_seeds.sql');
    const viewsPath = path.resolve(__dirname, '../../database/neon_views.sql');

    for (const [nombre, ruta] of [
      ['1. Esquema relacional (neon_schema.sql)', schemaPath],
      ['2. Semillas científicas de referencia (neon_seeds.sql)', seedsPath],
      ['3. Vistas analíticas y de auditoría (neon_views.sql)', viewsPath],
    ]) {
      if (!fs.existsSync(ruta)) {
        throw new Error(`No se encontró el archivo requerido: ${ruta}`);
      }
      console.log(`📄 Ejecutando ${nombre}...`);
      const sql = fs.readFileSync(ruta, 'utf-8');
      await pool.query(sql);
      console.log(`✅ ${nombre} aplicado con éxito.`);
    }

    console.log('------------------------------------------------------------');
    console.log('🎉 ¡Base de datos Neon PostgreSQL aprovisionada y verificada!');
    console.log('------------------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al aprovisionar Neon PostgreSQL:', error.message);
    process.exit(1);
  } finally {
    await pool.cerrarPool();
  }
}

run();
