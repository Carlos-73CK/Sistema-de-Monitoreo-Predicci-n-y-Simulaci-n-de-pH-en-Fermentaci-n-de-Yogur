/**
 * Suite de Pruebas Automatizadas de API REST — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Script ligero sin dependencias pesadas externas (usa fetch nativo y node:assert).
 * Levanta Express en puerto dinámico efímero (0) y valida el 100% de los endpoints requeridos:
 * 1. GET /api/health
 * 2. POST /api/v1/auth/login (credenciales válidas y contraseña errónea)
 * 3. POST /api/ai/simulate (parámetros fisicoquímicos estándar)
 * 4. GET /api/ai/metrics (R² > 0.95 de validación experimental)
 * 5. GET /api/ai/trials (listado de ensayos de laboratorio)
 * 6. GET /api/ai/trials/:loteId/export?formato=csv (exportación CSV)
 * 7. GET /api/ai/trials/:loteId/export?formato=json (exportación JSON)
 */

const assert = require('node:assert');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/config/db');

// Colores ANSI para salida en terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

async function runTests() {
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 PrediYogur API REST — Suite de Pruebas Automatizadas${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  let server;
  let port;
  let baseUrl;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // 1. Levantar servidor en puerto efímero dinámico (0)
    server = await new Promise((resolve, reject) => {
      const s = app.listen(0, () => resolve(s));
      s.on('error', reject);
    });

    port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🚀 Servidor de prueba Express iniciado en: ${colors.yellow}${baseUrl}${colors.reset}\n`);

    /**
     * Helper para ejecutar aserciones de prueba
     */
    async function testCase(name, fn) {
      process.stdout.write(`  ▶ ${name}... `);
      try {
        await fn();
        passedTests++;
        console.log(`${colors.green}✔ PASÓ${colors.reset}`);
      } catch (err) {
        failedTests++;
        console.log(`${colors.red}✖ FALLÓ${colors.reset}`);
        console.error(`    ${colors.red}Error: ${err.message}${colors.reset}`);
      }
    }

    // --- TEST 1: GET /api/health ---
    await testCase('GET /api/health responde 200 y status "ok"', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.status, 'ok', `Se esperaba status 'ok' en body`);
      assert.ok(body.service, 'El cuerpo debe incluir el nombre del servicio');
    });

    // --- TEST 2: POST /api/v1/auth/login ---
    let authToken = null;
    await testCase('POST /api/v1/auth/login con credenciales válidas retorna JWT', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.delgado@uleam.edu.ec',
          password: 'carlos2026',
        }),
      });
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Se esperaba success: true');
      assert.ok(body.data && body.data.token, 'Se esperaba que la respuesta contenga un token JWT');
      assert.strictEqual(typeof body.data.token, 'string', 'El token debe ser un string');
      authToken = body.data.token;
    });

    await testCase('POST /api/v1/auth/login con contraseña errónea retorna 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.delgado@uleam.edu.ec',
          password: 'password_totalmente_incorrecta_2026',
        }),
      });
      assert.strictEqual(res.status, 401, `Se esperaba HTTP 401 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, false, 'Se esperaba success: false');
    });

    // --- TEST 3: POST /api/ai/simulate ---
    await testCase('POST /api/ai/simulate con parámetros estándar responde 200 y trayectoria cinética', async () => {
      const res = await fetch(`${baseUrl}/api/ai/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatura_c: 42,
          masa_inoculo_g: 18.75,
          volumen_ml: 250,
          tipo_sustrato: 'vaca',
          tipo_azucar: 'sacarosa',
          intervalo_minutos: 15,
        }),
      });
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Se esperaba success: true');
      assert.ok(body.data, 'Se esperaba objeto data en la respuesta');
      const trayectoria = body.data.curva || body.data.curvaCineticapH;
      assert.ok(Array.isArray(trayectoria), 'Se esperaba trayectoria de curva cinética como array');
      assert.ok(trayectoria.length > 0, 'La curva cinética debe tener puntos simulados');
      assert.ok(body.data.prediccionCorte, 'Se esperaba predicción del tiempo de corte');
    });

    // --- TEST 4: GET /api/ai/metrics ---
    await testCase('GET /api/ai/metrics responde 200 con R² > 0.95', async () => {
      const res = await fetch(`${baseUrl}/api/ai/metrics`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Se esperaba success: true');
      assert.ok(body.data && body.data.metricasValidacion, 'Se esperaban métricas de validación');
      const rCuadrado = body.data.metricasValidacion.rCuadrado;
      assert.ok(typeof rCuadrado === 'number', 'rCuadrado debe ser numérico');
      assert.ok(rCuadrado > 0.95, `Se esperaba R² > 0.95 pero se obtuvo ${rCuadrado}`);
    });

    // Asegurar existencia de al menos un ensayo para los siguientes tests
    const testLoteId = 'LOTE-TEST-SUITE-' + Date.now();
    await fetch(`${baseUrl}/api/ai/trials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        lote_id: testLoteId,
        investigador: 'Carlos Delgado',
        temperatura_c: 42.0,
        masa_inoculo_g: 18.75,
        volumen_ml: 250,
        tipo_sustrato: 'vaca',
        tipo_azucar: 'sacarosa',
      }),
    });

    // Registrar una lectura de prueba adicional
    await fetch(`${baseUrl}/api/ai/trials/${testLoteId}/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tiempo_minutos: 60,
        ph: 5.80,
        temperatura: 42.0,
        indice_refraccion: 9.5,
      }),
    });

    // --- TEST 5: GET /api/ai/trials ---
    let loteParaExportar = testLoteId;
    await testCase('GET /api/ai/trials responde 200 y array de ensayos', async () => {
      const res = await fetch(`${baseUrl}/api/ai/trials`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Se esperaba success: true');
      assert.ok(body.data && Array.isArray(body.data.trials), 'Se esperaba data.trials como un Array');
      assert.ok(body.data.trials.length > 0, 'La lista de ensayos debe contener al menos un ensayo');
      if (body.data.trials[0] && body.data.trials[0].lote_id) {
        loteParaExportar = body.data.trials[0].lote_id;
      }
    });

    // --- TEST 6: GET /api/ai/trials/:loteId/export?formato=csv ---
    await testCase('GET /api/ai/trials/:loteId/export?formato=csv responde 200 con texto CSV', async () => {
      const res = await fetch(`${baseUrl}/api/ai/trials/${encodeURIComponent(loteParaExportar)}/export?formato=csv`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('text/csv'), `Content-Type debe incluir 'text/csv' (obtenido: ${contentType})`);

      const contentDisposition = res.headers.get('content-disposition') || '';
      assert.ok(contentDisposition.includes('attachment'), `Content-Disposition debe ser attachment (obtenido: ${contentDisposition})`);
      assert.ok(contentDisposition.includes(`${loteParaExportar}_cinetica.csv`), 'El nombre del archivo debe coincidir con el loteId');

      const csvText = await res.text();
      assert.ok(csvText.includes('tiempo_minutos,ph,temperatura,indice_refraccion,fecha_registro'), 'El CSV debe incluir cabeceras correctas');
      const lines = csvText.trim().split('\n');
      assert.ok(lines.length >= 2, 'El CSV debe contener al menos la cabecera y una fila de lectura');
    });

    // --- TEST 7: GET /api/ai/trials/:loteId/export?formato=json ---
    await testCase('GET /api/ai/trials/:loteId/export?formato=json responde 200 con JSON del ensayo', async () => {
      const res = await fetch(`${baseUrl}/api/ai/trials/${encodeURIComponent(loteParaExportar)}/export?formato=json`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Se esperaba success: true');
      assert.ok(body.data && body.data.lote_id === loteParaExportar, 'Se esperaba que la data corresponda al ensayo');
      assert.ok(Array.isArray(body.data.lecturas), 'El ensayo en JSON debe contener el array de lecturas');
    });

  } catch (globalErr) {
    console.error(`\n${colors.red}${colors.bold}Error global durante la ejecución de las pruebas:${colors.reset}`, globalErr);
    failedTests++;
  } finally {
    // Cerrar servidor Express
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cerrar pool PostgreSQL si existe para liberar el event loop
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
      }
    } catch (_) {}

    // Resumen final
    console.log(`\n${colors.bold}----------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}Resultado de la Suite de Pruebas:${colors.reset}`);
    console.log(`  Pruebas superadas: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`  Pruebas fallidas:  ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);
    console.log(`${colors.bold}----------------------------------------------------${colors.reset}\n`);

    if (failedTests > 0) {
      console.log(`${colors.red}${colors.bold}❌ La suite de pruebas falló. Revise los errores anteriores.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}${colors.bold}✔ ¡Todas las pruebas automatizadas pasaron exitosamente! (100% de éxito)${colors.reset}\n`);
      process.exit(0);
    }
  }
}

runTests();
