-- =============================================================================
-- PROYECTO: PrediYogur — Sistema de Monitoreo, Predicción y Simulación de pH
-- INSTITUCIÓN: Universidad Laica Eloy Alfaro de Manabí (ULEAM)
-- PATROCINADOR CIENTÍFICO: Dr. Stalin Gustavo Santacruz Terán
-- ARCHIVO: database/neon_seeds.sql
-- DESCRIPCIÓN: Carga idempotente de catálogos bioquímicos, cuentas base con
--              contraseñas cifradas (bcrypt), los 6 lotes experimentales de
--              referencia científica (matriz factorial 2x3 de leche de vaca con
--              cultivo comercial Chivería) y sus 37 lecturas experimentales
--              reales de laboratorio (sin lecturas ficticias interpoladas).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CATÁLOGO DE SUSTRATOS / MATRICES ALIMENTARIAS (IDEMPOTENTE)
-- =============================================================================
INSERT INTO catalogo_sustratos (
    codigo, nombre, origen, marca_referencia, ph_inicial_tipico, ph_corte_esperado,
    brix_inicial_tipico, brix_final_tipico, efecto_buffer, aditivos_amortiguadores,
    alcanza_corte_450, rango_viscosidad_min_mpas, rango_viscosidad_max_mpas, descripcion_bioquimica
)
VALUES
    ('vaca', 'Leche entera de vaca', 'animal_bovino', 'Leche entera bovina + Cultivo Chivería', 6.25, 4.50, 10.50, 5.60, FALSE, NULL, TRUE, 780.00, 2700.00, 'Matriz láctea bovina con micelas de caseína que coagulan en su punto isoeléctrico (pH 4.50).'),
    ('avena', 'Bebida vegetal de avena', 'vegetal', 'Bebida de avena', 6.40, 4.50, 9.80, 5.40, FALSE, NULL, TRUE, 100.00, 300.00, 'Matriz vegetal estructurada por beta-glucanos solubles; forma gel débil o fluido viscoso.'),
    ('almendra', 'Bebida vegetal de almendra', 'vegetal', 'Nature''s Heart', 6.55, 5.15, 5.20, 4.60, TRUE, 'Carbonato de Calcio (CaCO3) y Fosfato Tricálcico (Ca3(PO4)2)', FALSE, 50.00, 220.00, 'Presenta efecto buffer químico por sales cálcicas que estabiliza el pH en meseta 5.00-5.30 tras 6-7 h sin alcanzar pH 4.50.'),
    ('chocho', 'Bebida vegetal de chocho (Lupinus mutabilis)', 'vegetal', 'Extracto acuoso de chocho andino', 6.45, 4.50, 9.20, 5.80, FALSE, NULL, TRUE, 200.00, 350.00, 'Matriz proteica vegetal de leguminosa andina libre de lactosa.'),
    ('coco', 'Leche / bebida vegetal de coco', 'vegetal', 'Bebida de coco', 6.35, 4.50, 8.80, 5.50, FALSE, NULL, TRUE, 200.00, 350.00, 'Emulsión vegetal rica en ácidos grasos de cadena media; requiere adición de carbohidrato fermentable.'),
    ('soya', 'Bebida vegetal de soya', 'vegetal', 'Bebida de soya', 6.50, 4.50, 9.00, 5.60, FALSE, NULL, TRUE, 180.00, 400.00, 'Matriz vegetal rica en globulinas (glicinina y beta-conglicinina).'),
    ('otra', 'Sustrato experimental personalizado', 'otro', 'Formulación experimental ULEAM', 6.30, 4.50, 10.00, 5.60, FALSE, NULL, TRUE, 50.00, 3000.00, 'Sustrato configurable para pruebas de investigación bromatológica.')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    marca_referencia = EXCLUDED.marca_referencia,
    ph_inicial_tipico = EXCLUDED.ph_inicial_tipico,
    ph_corte_esperado = EXCLUDED.ph_corte_esperado,
    brix_inicial_tipico = EXCLUDED.brix_inicial_tipico,
    brix_final_tipico = EXCLUDED.brix_final_tipico,
    efecto_buffer = EXCLUDED.efecto_buffer,
    aditivos_amortiguadores = EXCLUDED.aditivos_amortiguadores,
    alcanza_corte_450 = EXCLUDED.alcanza_corte_450,
    rango_viscosidad_min_mpas = EXCLUDED.rango_viscosidad_min_mpas,
    rango_viscosidad_max_mpas = EXCLUDED.rango_viscosidad_max_mpas,
    descripcion_bioquimica = EXCLUDED.descripcion_bioquimica;

-- =============================================================================
-- 2. CATÁLOGO DE CARBOHIDRATOS / AZÚCARES (IDEMPOTENTE)
-- =============================================================================
INSERT INTO catalogo_azucares (
    codigo, nombre, tipo_carbohidrato, factor_t50, factor_vmax, factor_tiempo_corte, mecanismo_bioquimico
)
VALUES
    ('lactosa', 'Lactosa nativa láctea', 'disacarido', 1.0000, 1.0000, 1.0000, 'Disacárido nativo de la leche bovina hidrolizado por beta-galactosidasa en glucosa y galactosa.'),
    ('sacarosa', 'Sacarosa comercial', 'disacarido', 1.0200, 0.9800, 1.0200, 'Disacárido que requiere hidrólisis enzimática previa por invertasa (beta-fructofuranosidasa).'),
    ('glucosa', 'D-Glucosa (Dextrosa libre)', 'monosacarido', 0.9500, 1.0800, 0.9500, 'Hexosa libremente disponible para glucólisis homoláctica directa (vía Embden-Meyerhof-Parnas) sin demora hidrolítica.'),
    ('mezcla_sacarosa_glucosa', 'Mezcla bimodal Sacarosa + Glucosa', 'mezcla', 0.9850, 1.0400, 0.9850, 'Ponderación cinética entre hexosas libres (arranque inmediato y mayor Vmax) y disacáridos (fase exponencial sostenida).')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    factor_t50 = EXCLUDED.factor_t50,
    factor_vmax = EXCLUDED.factor_vmax,
    factor_tiempo_corte = EXCLUDED.factor_tiempo_corte,
    mecanismo_bioquimico = EXCLUDED.mecanismo_bioquimico;

-- =============================================================================
-- 3. USUARIOS INSTITUCIONALES Y DE REFERENCIA (CONTRASEÑAS CIFRADAS CON BCRYPT)
-- =============================================================================
-- Nota de seguridad: Ninguna contraseña se almacena en texto plano. Se utiliza
-- crypt(..., gen_salt('bf', 10)) de pgcrypto compatible con bcryptjs ($2a$/$2b$).
INSERT INTO usuarios (
    id, sqlite_id, nombre, apellidos, username, email, password_hash, rol, estado_cuenta, activo
)
VALUES
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        1,
        'Dr. Stalin',
        'Santacruz Terán',
        'stalin.santacruz',
        'dr.santacruz@uleam.edu.ec',
        crypt('santacruz2026', gen_salt('bf', 10)),
        'investigador',
        'activo',
        TRUE
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        2,
        'Carlos',
        'Delgado',
        'carlos.delgado',
        'carlos.delgado@uleam.edu.ec',
        crypt('carlos2026', gen_salt('bf', 10)),
        'investigador',
        'activo',
        TRUE
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        3,
        'Estudiante',
        'ULEAM',
        'estudiante.uleam',
        'estudiante@uleam.edu.ec',
        crypt('estudiante2026', gen_salt('bf', 10)),
        'estudiante',
        'activo',
        TRUE
    )
ON CONFLICT (email) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    username = EXCLUDED.username,
    rol = EXCLUDED.rol,
    estado_cuenta = EXCLUDED.estado_cuenta,
    activo = EXCLUDED.activo;

-- =============================================================================
-- 4. LOS 6 LOTES EXPERIMENTALES DE REFERENCIA CIENTÍFICA (SECCIÓN 7)
-- =============================================================================
-- Matriz factorial 2 x 3 del Dr. Stalin Gustavo Santacruz Terán (ULEAM):
-- Sustrato: Leche entera de vaca (250 g) + Cultivo comercial Chivería
-- Identificados explícitamente con es_referencia_cientifica = TRUE
-- =============================================================================
INSERT INTO ensayos (
    id,
    codigo,
    nombre_lote,
    descripcion,
    usuario_id,
    usuario_email,
    investigador,
    tipo_sustrato,
    marca_sustrato,
    tipo_azucar,
    masa_solucion_g,
    volumen_ml,
    porcentaje_inoculo,
    masa_inoculo_g,
    temperatura_incubacion,
    ph_inicial,
    ph_objetivo,
    parametro_t50_min,
    parametro_gamma,
    tiempo_corte_inicial_horas,
    tiempo_corte_inicial_minutos,
    tiempo_corte_estimado_horas,
    tiempo_corte_estimado_minutos,
    tiempo_corte_real_horas,
    tiempo_corte_real_minutos,
    viscosidad_final_mpas,
    viscosimetro_condiciones,
    indice_refraccion_final_brix,
    estado,
    es_referencia_cientifica,
    observaciones,
    diagnostico,
    origen_sincronizacion
)
VALUES
    -- Lote 1: LOTE-CHV-40-2.5
    (
        '22222222-2222-2222-2222-222222222201',
        'LOTE-CHV-40-2.5',
        'LOTE-CHV-40-2.5',
        'Ensayo de referencia ULEAM: Leche de vaca (250 g) a 40 °C con 2.5 % de inóculo Chivería (6.25 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        2.50,
        6.25,
        40.0,
        6.20,
        4.50,
        130.00,
        2.80,
        5.83,
        350,
        5.83,
        350,
        5.83,
        350,
        2579.00,
        'rotor 4, 60 rpm, 17 °C',
        5.90,
        'finalizado',
        TRUE,
        'Lote experimental oficial de calibración (40 °C / 2.5 % inóculo). Acidificación lenta que favorece alta hidratación proteica (2579 mPa·s).',
        'Gel lácteo firme (2579.0 mPa·s) con corte a las 5.83 h y 5.9 °Brix.',
        'seed_referencia'
    ),
    -- Lote 2: LOTE-CHV-40-7.5
    (
        '22222222-2222-2222-2222-222222222202',
        'LOTE-CHV-40-7.5',
        'LOTE-CHV-40-7.5',
        'Ensayo de referencia ULEAM: Leche de vaca (250 g) a 40 °C con 7.5 % de inóculo Chivería (18.75 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        7.50,
        18.75,
        40.0,
        6.40,
        4.50,
        75.00,
        1.90,
        5.50,
        330,
        5.50,
        330,
        5.50,
        330,
        786.60,
        'rotor 4, 60 rpm, 17 °C',
        5.50,
        'finalizado',
        TRUE,
        'Lote experimental oficial de calibración (40 °C / 7.5 % inóculo). Baja viscosidad final por desestabilización coloidal a baja temperatura con alto inóculo.',
        'Viscosidad reducida (786.6 mPa·s) con corte a las 5.50 h y 5.5 °Brix.',
        'seed_referencia'
    ),
    -- Lote 3: LOTE-CHV-42-2.5
    (
        '22222222-2222-2222-2222-222222222203',
        'LOTE-CHV-42-2.5',
        'LOTE-CHV-42-2.5',
        'Ensayo de referencia ULEAM: Leche de vaca (250 g) a 42 °C con 2.5 % de inóculo Chivería (6.25 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        2.50,
        6.25,
        42.0,
        6.20,
        4.50,
        300.00,
        3.90,
        6.75,
        405,
        6.75,
        405,
        6.75,
        405,
        1454.00,
        'rotor 4, 60 rpm, 18 °C',
        5.10,
        'finalizado',
        TRUE,
        'Lote experimental oficial de calibración (42 °C / 2.5 % inóculo). Temperatura óptima con bajo porcentaje de inóculo.',
        'Consistencia intermedia estándar (1454.0 mPa·s) con corte a las 6.75 h y 5.1 °Brix.',
        'seed_referencia'
    ),
    -- Lote 4: LOTE-CHV-42-7.5 (CONDICIÓN ÓPTIMA DE REFERENCIA)
    (
        '22222222-2222-2222-2222-222222222204',
        'LOTE-CHV-42-7.5',
        'LOTE-CHV-42-7.5',
        'Ensayo ÓPTIMO de referencia ULEAM: Leche de vaca (250 g) a 42 °C con 7.5 % de inóculo Chivería (18.75 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        7.50,
        18.75,
        42.0,
        6.20,
        4.50,
        125.00,
        3.00,
        4.25,
        255,
        4.25,
        255,
        4.25,
        255,
        2639.00,
        'rotor 4, 60 rpm, 18 °C',
        5.70,
        'finalizado',
        TRUE,
        'CONDICIÓN ÓPTIMA OFICIAL: Máxima firmeza reológica (2639.0 mPa·s) y menor tiempo de corte (4.25 h / 255 min).',
        'Condición Óptima del Dr. Stalin Santacruz (42 °C / 7.5 %): 2639.0 mPa·s, corte en 4.25 h y 5.7 °Brix.',
        'seed_referencia'
    ),
    -- Lote 5: LOTE-CHV-44-2.5
    (
        '22222222-2222-2222-2222-222222222205',
        'LOTE-CHV-44-2.5',
        'LOTE-CHV-44-2.5',
        'Ensayo de referencia ULEAM: Leche de vaca (250 g) a 44 °C con 2.5 % de inóculo Chivería (6.25 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        2.50,
        6.25,
        44.0,
        6.20,
        4.50,
        230.00,
        3.50,
        6.50,
        390,
        6.50,
        390,
        6.50,
        390,
        1185.00,
        'rotor 4, 60 rpm, 15.5 °C',
        6.10,
        'finalizado',
        TRUE,
        'Lote experimental oficial de calibración (44 °C / 2.5 % inóculo). Estrés térmico moderado (>43 °C).',
        'Pérdida de viscosidad por estrés térmico a 44 °C (1185.0 mPa·s), corte a las 6.50 h y 6.1 °Brix.',
        'seed_referencia'
    ),
    -- Lote 6: LOTE-CHV-44-7.5
    (
        '22222222-2222-2222-2222-222222222206',
        'LOTE-CHV-44-7.5',
        'LOTE-CHV-44-7.5',
        'Ensayo de referencia ULEAM: Leche de vaca (250 g) a 44 °C con 7.5 % de inóculo Chivería (18.75 g).',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'dr.santacruz@uleam.edu.ec',
        'Dr. Stalin Gustavo Santacruz Terán',
        'vaca',
        'Leche entera de vaca + Inóculo comercial Chivería',
        'lactosa',
        250.00,
        250.00,
        7.50,
        18.75,
        44.0,
        6.10,
        4.50,
        170.00,
        2.60,
        6.50,
        390,
        6.50,
        390,
        6.50,
        390,
        796.50,
        'rotor 4, 60 rpm, 15.5 °C',
        7.40,
        'finalizado',
        TRUE,
        'Lote experimental oficial de calibración (44 °C / 7.5 % inóculo). Desnaturalización térmica y contracción brusca de micelas de caseína.',
        'Viscosidad severamente reducida por exceso térmico a 44 °C (796.5 mPa·s), corte a las 6.50 h y 7.4 °Brix.',
        'seed_referencia'
    )
ON CONFLICT (codigo) DO UPDATE SET
    temperatura_incubacion = EXCLUDED.temperatura_incubacion,
    porcentaje_inoculo = EXCLUDED.porcentaje_inoculo,
    masa_inoculo_g = EXCLUDED.masa_inoculo_g,
    masa_solucion_g = EXCLUDED.masa_solucion_g,
    volumen_ml = EXCLUDED.volumen_ml,
    parametro_t50_min = EXCLUDED.parametro_t50_min,
    parametro_gamma = EXCLUDED.parametro_gamma,
    tiempo_corte_inicial_horas = EXCLUDED.tiempo_corte_inicial_horas,
    tiempo_corte_estimado_horas = EXCLUDED.tiempo_corte_estimado_horas,
    tiempo_corte_real_horas = EXCLUDED.tiempo_corte_real_horas,
    viscosidad_final_mpas = EXCLUDED.viscosidad_final_mpas,
    indice_refraccion_final_brix = EXCLUDED.indice_refraccion_final_brix,
    es_referencia_cientifica = TRUE,
    estado = EXCLUDED.estado,
    observaciones = EXCLUDED.observaciones,
    diagnostico = EXCLUDED.diagnostico;

-- =============================================================================
-- 5. SERIES TEMPORALES DE LECTURAS EXPERIMENTALES REALES (37 MEDICIONES REALES)
-- =============================================================================
-- Se insertan exclusivamente las mediciones reales de laboratorio documentadas
-- en backend/src/ai/dataset.js y ml/data/fermentacion_uleam.csv (sin inventar
-- puntos intermedios ficticios).
-- =============================================================================

-- 5.1. Lecturas reales de LOTE-CHV-40-2.5 (7 mediciones)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222201', 0,   6.20, 26.1, 10.20, 'Medición experimental real (t = 0.00 h)'),
    ('22222222-2222-2222-2222-222222222201', 30,  6.30, 29.1, 13.10, 'Medición experimental real (t = 0.50 h)'),
    ('22222222-2222-2222-2222-222222222201', 90,  5.80, 32.5, 12.20, 'Medición experimental real (t = 1.50 h)'),
    ('22222222-2222-2222-2222-222222222201', 150, 5.10, 33.6, 11.80, 'Medición experimental real (t = 2.50 h)'),
    ('22222222-2222-2222-2222-222222222201', 210, 4.90, 32.5, 6.40,  'Medición experimental real (t = 3.50 h)'),
    ('22222222-2222-2222-2222-222222222201', 330, 4.70, 31.2, 6.50,  'Medición experimental real (t = 5.50 h)'),
    ('22222222-2222-2222-2222-222222222201', 350, 4.60, 32.4, 5.90,  'Medición experimental real final (t = 5.83 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- 5.2. Lecturas reales de LOTE-CHV-40-7.5 (6 mediciones)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222202', 0,   6.40, 25.0, 12.00, 'Medición experimental real (t = 0.00 h)'),
    ('22222222-2222-2222-2222-222222222202', 30,  6.10, 34.8, 11.50, 'Medición experimental real (t = 0.50 h)'),
    ('22222222-2222-2222-2222-222222222202', 90,  5.30, 32.4, 12.00, 'Medición experimental real (t = 1.50 h)'),
    ('22222222-2222-2222-2222-222222222202', 150, 4.90, 33.0, 8.50,  'Medición experimental real (t = 2.50 h)'),
    ('22222222-2222-2222-2222-222222222202', 210, 4.70, 31.4, 7.60,  'Medición experimental real (t = 3.50 h)'),
    ('22222222-2222-2222-2222-222222222202', 330, 4.60, 33.8, 5.50,  'Medición experimental real final (t = 5.50 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- 5.3. Lecturas reales de LOTE-CHV-42-2.5 (6 mediciones)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222203', 0,   6.20, 26.1, 10.20, 'Medición experimental real (t = 0.00 h)'),
    ('22222222-2222-2222-2222-222222222203', 60,  6.30, 32.8, 11.20, 'Medición experimental real (t = 1.00 h)'),
    ('22222222-2222-2222-2222-222222222203', 135, 6.00, 34.6, 11.80, 'Medición experimental real (t = 2.25 h)'),
    ('22222222-2222-2222-2222-222222222203', 195, 5.90, 34.2, 11.80, 'Medición experimental real (t = 3.25 h)'),
    ('22222222-2222-2222-2222-222222222203', 255, 5.80, 34.2, 5.70,  'Medición experimental real (t = 4.25 h)'),
    ('22222222-2222-2222-2222-222222222203', 405, 4.70, 34.2, 5.10,  'Medición experimental real final (t = 6.75 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- 5.4. Lecturas reales de LOTE-CHV-42-7.5 — ÓPTIMO (5 mediciones)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222204', 0,   6.20, 26.1, 10.20, 'Medición experimental real (t = 0.00 h)'),
    ('22222222-2222-2222-2222-222222222204', 60,  6.00, 36.0, 11.80, 'Medición experimental real (t = 1.00 h)'),
    ('22222222-2222-2222-2222-222222222204', 135, 5.30, 36.2, 12.60, 'Medición experimental real (t = 2.25 h)'),
    ('22222222-2222-2222-2222-222222222204', 195, 4.90, 35.1, 7.50,  'Medición experimental real (t = 3.25 h)'),
    ('22222222-2222-2222-2222-222222222204', 255, 4.60, 35.1, 5.70,  'Medición experimental real final óptima (t = 4.25 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- 5.5. Lecturas reales de LOTE-CHV-44-2.5 (7 mediciones)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222205', 0,   6.20, 34.5, 10.20, 'Medición experimental real (t = 0.00 h)'),
    ('22222222-2222-2222-2222-222222222205', 60,  6.40, 37.5, 13.30, 'Medición experimental real (t = 1.00 h)'),
    ('22222222-2222-2222-2222-222222222205', 120, 6.00, 38.0, 13.10, 'Medición experimental real (t = 2.00 h)'),
    ('22222222-2222-2222-2222-222222222205', 180, 5.60, 37.9, 12.90, 'Medición experimental real (t = 3.00 h)'),
    ('22222222-2222-2222-2222-222222222205', 240, 5.40, 35.7, 13.90, 'Medición experimental real (t = 4.00 h)'),
    ('22222222-2222-2222-2222-222222222205', 330, 4.90, 35.7, 7.90,  'Medición experimental real (t = 5.50 h)'),
    ('22222222-2222-2222-2222-222222222205', 390, 4.60, 36.9, 6.10,  'Medición experimental real final (t = 6.50 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- 5.6. Lecturas reales de LOTE-CHV-44-7.5 (6 mediciones documentadas en dataset.js)
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura, indice_refraccion_brix, observaciones)
VALUES
    ('22222222-2222-2222-2222-222222222206', 60,  6.10, 36.7, 12.80, 'Medición experimental real (t = 1.00 h)'),
    ('22222222-2222-2222-2222-222222222206', 120, 5.60, 39.5, 13.10, 'Medición experimental real (t = 2.00 h)'),
    ('22222222-2222-2222-2222-222222222206', 180, 5.20, 38.0, 13.00, 'Medición experimental real (t = 3.00 h)'),
    ('22222222-2222-2222-2222-222222222206', 240, 5.00, 38.4, 13.60, 'Medición experimental real (t = 4.00 h)'),
    ('22222222-2222-2222-2222-222222222206', 330, 4.80, 35.7, 7.90,  'Medición experimental real (t = 5.50 h)'),
    ('22222222-2222-2222-2222-222222222206', 390, 4.60, 36.9, 7.40,  'Medición experimental real final (t = 6.50 h)')
ON CONFLICT (ensayo_id, tiempo_minutos) DO UPDATE SET
    ph = EXCLUDED.ph,
    temperatura = EXCLUDED.temperatura,
    indice_refraccion_brix = EXCLUDED.indice_refraccion_brix,
    observaciones = EXCLUDED.observaciones;

-- =============================================================================
-- 6. PREDICCIÓN HISTÓRICA DE CALIBRACIÓN BASE (MODELO HILL — R² = 0.9774)
-- =============================================================================
INSERT INTO predicciones (
    id,
    ensayo_id,
    lote_codigo,
    usuario_id,
    investigador,
    modelo_utilizado,
    tipo_sustrato,
    tipo_azucar,
    ph_inicial,
    ph_final_estimado,
    temperatura_c,
    porcentaje_inoculo,
    masa_inoculo_g,
    volumen_ml,
    parametro_t50,
    parametro_gamma,
    tiempo_corte_horas,
    tiempo_corte_minutos,
    viscosidad_predicha_mpas,
    calidad_gel,
    diagnostico,
    metricas_modelo,
    datos_entrada,
    resultado_prediccion
)
VALUES (
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222204',
    'LOTE-CHV-42-7.5',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Stalin Gustavo Santacruz Terán',
    'Hill Sigmoidal + IDW (Calibración Oficial ULEAM)',
    'vaca',
    'lactosa',
    6.25,
    4.50,
    42.0,
    7.50,
    18.75,
    250.00,
    125.00,
    3.00,
    4.25,
    255,
    2639.00,
    'EXCELENTE (MAXIMA FIRMEZA)',
    'Condición Óptima del Dr. Stalin Santacruz (42 °C / 7.5%): Máxima viscosidad registrada en laboratorio (2639 mPa·s).',
    '{"r2": 0.9774, "rmse": 0.0961, "mae": 0.0773, "muestrasBase": 37}'::jsonb,
    '{"temperaturaC": 42.0, "porcentajeInoculo": 7.5, "masaInoculoG": 18.75, "masaSolucionG": 250.0, "tipoSustrato": "vaca", "tipoAzucar": "lactosa"}'::jsonb,
    '{"tiempoCorteHoras": 4.25, "tiempoCorteMinutos": 255, "viscosidadPredichaMpaS": 2639.0, "brixFinal": 5.7}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. REGISTRO INICIAL DE AUDITORÍA DE APROVISIONAMIENTO CIENTÍFICO
-- =============================================================================
INSERT INTO auditoria_operaciones (
    id,
    usuario_id,
    usuario_email,
    accion,
    entidad_afectada,
    registro_afectado_id,
    datos_posteriores,
    informacion_tecnica
)
VALUES (
    '44444444-4444-4444-4444-444444444401',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'dr.santacruz@uleam.edu.ec',
    'CAMBIO_CONFIGURACION',
    'sistema',
    'SEED-REFERENCIA-ULEAM-2X3',
    '{"lotes_referencia_cargados": 6, "lecturas_experimentales_reales": 37, "modelo_hill_r2": 0.9774}'::jsonb,
    '{"origen": "neon_seeds.sql", "motor": "Neon PostgreSQL", "modo": "idempotente"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
