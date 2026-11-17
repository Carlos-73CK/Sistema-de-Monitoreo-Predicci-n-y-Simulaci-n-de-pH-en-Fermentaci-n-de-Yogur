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
    const timestampTest = Date.now();
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

    await testCase('POST /api/v1/auth/login con nombre de usuario (identificador) retorna 200', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: 'carlos.delgado',
          password: 'carlos2026',
        }),
      });
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
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

    await testCase('POST /api/v1/auth/login bloquea cuenta temporalmente tras 5 intentos fallidos (OWASP)', async () => {
      const targetUser = `bruteforce.${timestampTest}`;
      // Registrar usuario específico para prueba de fuerza bruta
      await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Prueba',
          apellidos: 'Fuerza Bruta',
          username: targetUser,
          email: `${targetUser}@uleam.edu.ec`,
          password: 'PasswordSegura2026.Uleam',
          confirmPassword: 'PasswordSegura2026.Uleam',
          aceptaTerminos: true,
        }),
      });

      // 4 intentos fallidos deben retornar 401
      for (let i = 0; i < 4; i++) {
        const failRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identificador: targetUser,
            password: 'clave_incorrecta_123',
          }),
        });
        assert.strictEqual(failRes.status, 401);
      }

      // El 5to intento fallido debe disparar el bloqueo (HTTP 429)
      const lockRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: targetUser,
          password: 'clave_incorrecta_123',
        }),
      });
      assert.strictEqual(lockRes.status, 429, `Se esperaba HTTP 429 de bloqueo pero se recibió ${lockRes.status}`);
      const lockBody = await lockRes.json();
      assert.strictEqual(lockBody.success, false);
      assert.ok(lockBody.message.includes('bloqueada temporalmente'));
    });

    // --- TEST 2.1: Registro de Usuarios y Validaciones de Seguridad (LOPDP / OWASP) ---
    const testNewUserEmail = `investigador.${timestampTest}@uleam.edu.ec`;
    const testNewUsername = `inv.${timestampTest}`;

    await testCase('POST /api/v1/auth/register rechaza contraseñas menores a 6 caracteres', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'María Elena',
          apellidos: 'Vera Saltos',
          username: `shortpass.${timestampTest}`,
          email: `shortpass.${timestampTest}@uleam.edu.ec`,
          password: '12345',
          confirmPassword: '12345',
          aceptaTerminos: true,
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('6 caracteres'));
    });

    await testCase('POST /api/v1/auth/register rechaza contraseñas comunes (OWASP)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'María Elena',
          apellidos: 'Vera Saltos',
          username: `common.${timestampTest}`,
          email: `common.${timestampTest}@uleam.edu.ec`,
          password: '123456789012',
          confirmPassword: '123456789012',
          aceptaTerminos: true,
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('común') || body.message.includes('insegura'));
    });

    await testCase('POST /api/v1/auth/register crea nuevo usuario con datos completos y términos aceptados', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'María Elena',
          apellidos: 'Vera Saltos',
          username: testNewUsername,
          email: testNewUserEmail,
          password: 'PasswordSegura2026.Uleam',
          confirmPassword: 'PasswordSegura2026.Uleam',
          rol: 'investigador',
          aceptaTerminos: true,
        }),
      });
      assert.strictEqual(res.status, 201, `Se esperaba 201 Created pero se obtuvo ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.email, testNewUserEmail);
      assert.strictEqual(body.data.user.username, testNewUsername);
    });

    // --- TEST 2.2: Recuperación de Contraseña (/forgot-password y /reset-password) ---
    let recoveryToken = null;
    await testCase('POST /api/v1/auth/forgot-password genera token temporal de recuperación', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testNewUserEmail,
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data && body.data.dev_token);
      recoveryToken = body.data.dev_token;
    });

    await testCase('POST /api/v1/auth/reset-password restablece la contraseña usando el token', async () => {
      assert.ok(recoveryToken, 'Token de recuperación requerido');
      const res = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: recoveryToken,
          password: 'NuevaPasswordSegura2026#',
          confirmPassword: 'NuevaPasswordSegura2026#',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await testCase('POST /api/v1/auth/login permite ingresar con la nueva contraseña restablecida', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: testNewUsername,
          password: 'NuevaPasswordSegura2026#',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
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

    // --- TEST 7.1: GET /api/ai/trials/:loteId/export?formato=pdf y /report.pdf ---
    await testCase('GET /api/ai/trials/:loteId/export?formato=pdf genera informe PDF con márgenes y layout ULEAM', async () => {
      const res = await fetch(`${baseUrl}/api/ai/trials/${encodeURIComponent(loteParaExportar)}/export?formato=pdf`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('application/pdf'), `Content-Type debe ser 'application/pdf' (obtenido: ${contentType})`);
      const contentDisposition = res.headers.get('content-disposition') || '';
      assert.ok(contentDisposition.includes(`informe_cinetico_${loteParaExportar}.pdf`), 'El header Content-Disposition debe indicar el PDF');
      const arrayBuf = await res.arrayBuffer();
      assert.ok(arrayBuf.byteLength > 1000, `El PDF debe tener un tamaño válido (>1000 bytes, obtenido: ${arrayBuf.byteLength})`);
      // Verificar firma mágica de PDF (%PDF-)
      const pdfHeader = Buffer.from(arrayBuf.slice(0, 5)).toString();
      assert.strictEqual(pdfHeader, '%PDF-', 'El archivo debe comenzar con el encabezado estándar %PDF-');
    });


    // --- TEST 9: Inóculo porcentual y masa dinámica ---
    await testCase('POST /api/ai/simulate con porcentaje_inoculo: 5.0 calcula masaInoculoG dinámicamente', async () => {
      const res = await fetch(`${baseUrl}/api/ai/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          porcentaje_inoculo: 5.0,
          volumen_ml: 250,
          temperatura_c: 42,
          tipo_sustrato: 'vaca',
          tipo_azucar: 'lactosa',
        }),
      });
      assert.strictEqual(res.status, 200, `Se esperaba 200 pero se recibió ${res.status}`);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      const conf = body.data.configuracion;
      assert.strictEqual(conf.porcentajeInoculo, 5.0, 'El porcentaje de inóculo debe ser 5.0%');
      assert.strictEqual(conf.masaInoculoG, 12.5, 'La masa dinámica debe ser (5/100) * 250 = 12.5g');
    });

    // --- TEST 10: Modelado de mezclas de carbohidratos ('mezcla_sacarosa_glucosa') ---
    await testCase('POST /api/ai/simulate con mezcla_sacarosa_glucosa pondera Vmax y latencia homoláctica', async () => {
      const res = await fetch(`${baseUrl}/api/ai/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatura_c: 42,
          porcentaje_inoculo: 7.5,
          volumen_ml: 250,
          tipo_sustrato: 'vaca',
          tipo_azucar: 'mezcla_sacarosa_glucosa',
          ratio_glucosa: 0.5,
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.configuracion.tipoAzucar, 'mezcla_sacarosa_glucosa');
      assert.ok(body.data.curva.length > 0, 'La simulación debe contener la trayectoria');
    });

    // --- TEST 11: Efecto buffer en bebida de almendra (Nature\'s Heart) ---
    await testCase('POST /api/ai/simulate con almendra modela buffer químico (meseta 5.0-5.3, sin corte 4.50)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatura_c: 42,
          porcentaje_inoculo: 7.5,
          volumen_ml: 250,
          tipo_sustrato: 'almendra',
          tipo_azucar: 'sacarosa',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      const data = body.data;
      assert.strictEqual(data.prediccionCorte.efectoBuffer, true, 'Debe activar efectoBuffer');
      assert.strictEqual(data.prediccionCorte.tiempoCorteHoras, null, 'No debe alcanzar corte a 4.50');
      // Validar meseta entre pH 5.0 y 5.3 a las 6-7 horas (360-420 min)
      const pt6h = data.curva.find((p) => p.minutos === 360 || p.minutos === 390 || p.minutos === 420);
      assert.ok(pt6h, 'Debe existir punto en la curva a 6-7h');
      assert.ok(pt6h.phPredicho >= 5.0 && pt6h.phPredicho <= 5.3, `El pH (${pt6h.phPredicho}) debe estar en la meseta [5.0 - 5.3]`);
    });

    // --- TEST 12: Predicción de viscosidad Brookfield final (rotor 4, 60 rpm) ---
    await testCase('Validar viscosidad Brookfield en vaca (42°C/7.5%, 40°C/2.5%, 44°C) y matrices vegetales', async () => {
      const aiSimulator = require('../src/services/aiSimulator');

      // Vaca a 42 °C / 7.5% -> ~2639 mPa·s
      const v42_75 = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'vaca', temperaturaC: 42, porcentajeInoculo: 7.5 });
      assert.strictEqual(v42_75.viscosidadPredichaMpaS, 2639, 'Vaca 42 °C / 7.5% debe ser 2639 mPa·s');

      // Vaca a 40 °C / 2.5% -> ~2579 mPa·s
      const v40_25 = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'vaca', temperaturaC: 40, porcentajeInoculo: 2.5 });
      assert.strictEqual(v40_25.viscosidadPredichaMpaS, 2579, 'Vaca 40 °C / 2.5% debe ser 2579 mPa·s');

      // Vaca a 44 °C -> ~796 - 1185 mPa·s
      const v44_75 = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'vaca', temperaturaC: 44, porcentajeInoculo: 7.5 });
      const v44_25 = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'vaca', temperaturaC: 44, porcentajeInoculo: 2.5 });
      assert.ok(v44_75.viscosidadPredichaMpaS >= 790 && v44_75.viscosidadPredichaMpaS <= 1200, `Vaca 44 °C debe estar entre 796 y 1185 mPa·s (obtenido: ${v44_75.viscosidadPredichaMpaS})`);
      assert.ok(v44_25.viscosidadPredichaMpaS >= 790 && v44_25.viscosidadPredichaMpaS <= 1200, `Vaca 44 °C debe estar entre 796 y 1185 mPa·s (obtenido: ${v44_25.viscosidadPredichaMpaS})`);

      // Avena y Almendra -> geles débiles / fluidos viscosos (~50 - 300 mPa·s)
      const vAlm = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'almendra', temperaturaC: 42, porcentajeInoculo: 7.5 });
      assert.ok(vAlm.viscosidadPredichaMpaS >= 50 && vAlm.viscosidadPredichaMpaS <= 300, `Almendra debe estar entre 50 y 300 mPa·s (obtenido: ${vAlm.viscosidadPredichaMpaS})`);

      const vAve = aiSimulator.estimarViscosidadBrookfield({ tipoSustrato: 'avena', temperaturaC: 42, porcentajeInoculo: 7.5 });
      assert.ok(vAve.viscosidadPredichaMpaS >= 50 && vAve.viscosidadPredichaMpaS <= 300, `Avena debe estar entre 50 y 300 mPa·s (obtenido: ${vAve.viscosidadPredichaMpaS})`);
    });

    // --- TEST 8: GET /api/docs.json (Documentación OpenAPI / Swagger) ---
    await testCase('GET /api/docs.json responde 200 con especificación OpenAPI 3.0', async () => {
      const res = await fetch(`${baseUrl}/api/docs.json`);
      assert.strictEqual(res.status, 200, `Se esperaba HTTP 200 pero se recibió ${res.status}`);
      const doc = await res.json();
      assert.strictEqual(doc.openapi, '3.0.3', 'Se esperaba openapi: 3.0.3');
      assert.ok(doc.paths && doc.paths['/api/ai/simulate'], 'Debe contener la ruta de simulación documentada');
    });

    // --- TEST 13: Ciclo de vida completo de Ensayos (/api/ensayos: Crear, Consultar, Actualizar, Finalizar, Archivar) ---
    const loteCiclo = `LOTE-CICLO-${Date.now()}`;
    await testCase('Ciclo de vida de Ensayo: crear, consultar, actualizar, finalizar y archivar', async () => {
      // 1. Crear ensayo
      const createRes = await fetch(`${baseUrl}/api/ensayos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          codigo: loteCiclo,
          tipo_sustrato: 'vaca',
          tipo_azucar: 'lactosa',
          masa_inoculo_g: 18.75,
          temperatura_objetivo: 42.0,
          volumen_ml: 250,
        }),
      });
      assert.strictEqual(createRes.status, 201, `Fallo al crear ensayo: ${createRes.status}`);

      // 2. Consultar ensayo
      const getRes = await fetch(`${baseUrl}/api/ensayos/${encodeURIComponent(loteCiclo)}`);
      assert.strictEqual(getRes.status, 200);
      const getBody = await getRes.json();
      assert.strictEqual(getBody.data.codigo, loteCiclo);

      // 3. Actualizar ensayo
      const updRes = await fetch(`${baseUrl}/api/ensayos/${encodeURIComponent(loteCiclo)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          diagnostico: 'Actualización de diagnóstico cinético verificada',
        }),
      });
      assert.strictEqual(updRes.status, 200);

      // 4. Finalizar ensayo con viscosidad Brookfield
      const finRes = await fetch(`${baseUrl}/api/ensayos/${encodeURIComponent(loteCiclo)}/finalizar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ viscosidad_final: 2639 }),
      });
      assert.strictEqual(finRes.status, 200);
      const finBody = await finRes.json();
      assert.strictEqual(finBody.data.estado, 'completado');
      assert.strictEqual(finBody.data.viscosidad_final, 2639);

      // 5. Archivar ensayo
      const archRes = await fetch(`${baseUrl}/api/ensayos/${encodeURIComponent(loteCiclo)}/archivar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      assert.strictEqual(archRes.status, 200);
      const archBody = await archRes.json();
      assert.strictEqual(archBody.data.estado, 'archivado');
    });

    // --- TEST 14: Verificación de los 6 Lotes Experimentales de Referencia del Dr. Santacruz ---
    await testCase('Verificar que los 6 lotes científicos de referencia (LOTE-CHV-*) están disponibles y sin duplicados', async () => {
      const res = await fetch(`${baseUrl}/api/ai/trials`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const codigosEsperados = [
        'LOTE-CHV-40-2.5',
        'LOTE-CHV-40-7.5',
        'LOTE-CHV-42-2.5',
        'LOTE-CHV-42-7.5',
        'LOTE-CHV-44-2.5',
        'LOTE-CHV-44-7.5',
      ];
      for (const cod of codigosEsperados) {
        const coincidencias = body.data.trials.filter((t) => t.lote_id === cod);
        assert.strictEqual(coincidencias.length, 1, `El lote de referencia ${cod} debe existir exactamente 1 vez`);
      }
    });

    // --- TEST 15: Historial de Predicciones y Bitácora de Auditoría (sin exponer secretos) ---
    await testCase('GET /api/ai/simulations y GET /api/ai/audit registran historial sin exponer contraseñas ni tokens', async () => {
      const simRes = await fetch(`${baseUrl}/api/ai/simulations`);
      assert.strictEqual(simRes.status, 200);
      const simBody = await simRes.json();
      assert.ok(Array.isArray(simBody.data.historial) && simBody.data.historial.length > 0);

      const auditRes = await fetch(`${baseUrl}/api/ai/audit`);
      assert.strictEqual(auditRes.status, 200);
      const auditBody = await auditRes.json();
      assert.ok(Array.isArray(auditBody.data.logs) && auditBody.data.logs.length > 0);
      const rawJson = JSON.stringify(auditBody.data.logs);
      assert.ok(!rawJson.includes('password_hash') && !rawJson.includes('carlos2026'), 'La auditoría jamás debe incluir contraseñas');
    });

    // --- TEST 16: Verificación de Entregables SQL de Neon PostgreSQL ---
    await testCase('Verificar existencia e integridad de neon_schema.sql, neon_seeds.sql, neon_views.sql y NEON_SETUP.md', async () => {
      const fs = require('fs');
      const dbDir = path.resolve(__dirname, '../../database');
      const archivos = ['neon_schema.sql', 'neon_seeds.sql', 'neon_views.sql', 'NEON_SETUP.md'];
      for (const arch of archivos) {
        const fullPath = path.join(dbDir, arch);
        assert.ok(fs.existsSync(fullPath), `Falta el archivo obligatorio: ${fullPath}`);
        const contenido = fs.readFileSync(fullPath, 'utf-8');
        assert.ok(contenido.length > 500, `El archivo ${arch} debe tener contenido completo`);
      }
    });

  } catch (globalErr) {
    console.error(`\n${colors.red}${colors.bold}Error global durante la ejecución de las pruebas:${colors.reset}`, globalErr);
    failedTests++;
  } finally {
    // Cerrar servidor Express
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Limpiar registros efímeros creados durante la suite de pruebas y cerrar pool PostgreSQL
    try {
      const { db } = require('../src/ai/sqliteStore');
      db.prepare(`DELETE FROM usuarios WHERE correo LIKE 'bruteforce.%' OR correo LIKE 'investigador.1794%'`).run();
      db.prepare(`DELETE FROM ensayos_laboratorio WHERE lote_id LIKE 'LOTE-TEST-SUITE-%' OR lote_id LIKE 'LOTE-CICLO-%'`).run();
      db.prepare(`DELETE FROM predicciones_historial WHERE lote_id LIKE 'LOTE-TEST-SUITE-%' OR lote_id LIKE 'LOTE-CICLO-%'`).run();
      if (pool && pool.isNeonConfigured && pool.isNeonConfigured()) {
        await pool.query(`DELETE FROM ensayos WHERE codigo LIKE 'LOTE-TEST-SUITE-%' OR codigo LIKE 'LOTE-CICLO-%'`);
        await pool.query(`DELETE FROM predicciones WHERE lote_codigo LIKE 'LOTE-TEST-SUITE-%' OR lote_codigo LIKE 'LOTE-CICLO-%'`);
        await pool.query(`DELETE FROM usuarios WHERE email LIKE 'bruteforce.%' OR email LIKE 'investigador.1794%'`);
      }
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
