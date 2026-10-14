/**
 * Script de Inicialización y Carga de Semillas en PostgreSQL
 * PrediYogur - Cátedra de Química de Alimentos (ULEAM)
 * 
 * Lee y ejecuta automáticamente schema.sql y seeds.sql contra la base de datos configurada.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Cargar variables de entorno desde backend/.env o valores por defecto
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env.example') });
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'prediyogur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  console.log('------------------------------------------------------------');
  console.log('🚀 [PrediYogur] Inicializando Aprovisionamiento de Base de Datos');
  console.log(`🔌 Conectando a: ${process.env.DB_USER || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'prediyogur_db'}`);
  console.log('------------------------------------------------------------');

  try {
    // 1. Probar conectividad inicial
    await pool.query('SELECT 1');
    console.log('✅ Conexión con PostgreSQL establecida con éxito.');

    // 2. Ruta a los archivos SQL
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const seedsPath = path.resolve(__dirname, '../../database/seeds.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo de esquema en: ${schemaPath}`);
    }

    if (!fs.existsSync(seedsPath)) {
      throw new Error(`No se encontró el archivo de semillas en: ${seedsPath}`);
    }

    // 3. Ejecutar schema.sql
    console.log('📄 Aplicando esquema DDL (schema.sql)...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Tablas, extensiones, índices y restricciones biológicas creadas con éxito.');

    // 4. Ejecutar seeds.sql
    console.log('🌱 Cargando datos semilla y lotes experimentales del Dr. Stalin Santacruz (seeds.sql)...');
    const seedsSql = fs.readFileSync(seedsPath, 'utf-8');
    await pool.query(seedsSql);
    console.log('✅ 6 lotes experimentales reales (40 °C, 42 °C y 44 °C) y sus series cinéticas cargados con éxito.');

    console.log('------------------------------------------------------------');
    console.log('🎉 ¡Base de datos de PrediYogur aprovisionada y lista para operar!');
    console.log('------------------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico al aprovisionar la base de datos:', error.message);
    if (error.code === '3D000') {
      console.error('💡 Pista: La base de datos especificada no existe. Créala primero ejecutando: CREATE DATABASE prediyogur_db;');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
