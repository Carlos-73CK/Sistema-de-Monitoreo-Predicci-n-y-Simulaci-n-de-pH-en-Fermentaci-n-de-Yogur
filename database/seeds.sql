-- =============================================================================
-- PROYECTO: PrediYogur
-- DESCRIPCIÓN: Matriz completa de datos experimentales reales (Vaca, Avena, Almendra).
-- =============================================================================

-- 1. Usuario administrador de prueba
INSERT INTO usuarios (id, nombre, email, password_hash, rol) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Stalin Santacruz Terán',
    'admin@uleam.edu.ec',
    '$2b$10$w8T0sXj8WdD3zK3W5jQO.O3vKjQ2eR3h8T8y9U0V1W2X3Y4Z5A6B',
    'docente'
);

-- =============================================================================
-- 2. INSERCIÓN DE LOTES EXPERIMENTALES (VACA, AVENA, ALMENDRA)
-- =============================================================================

-- A) LECHE DE VACA (250 g, Yogur Chivería)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, tipo_azucar, masa_solucion_g, porcentaje_inoculo, temperatura_objetivo, estado, viscosidad_final_mpas, observaciones_bioquimicas)
VALUES 
('22222222-2222-2222-2222-222222222201', 'LOTE-VACA-40-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 2.50, 40.0, 'completado', 2579.00, 'Leche de vaca a 40°C con 2.5% inóculo (t_final: 5.83h)'),
('22222222-2222-2222-2222-222222222202', 'LOTE-VACA-40-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 7.50, 40.0, 'completado', 786.60, 'Leche de vaca a 40°C con 7.5% inóculo (t_final: 5.50h)'),
('22222222-2222-2222-2222-222222222203', 'LOTE-VACA-42-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 2.50, 42.0, 'completado', 1454.00, 'Leche de vaca a 42°C con 2.5% inóculo (t_final: 6.75h)'),
('22222222-2222-2222-2222-222222222204', 'LOTE-VACA-42-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 7.50, 42.0, 'completado', 2639.00, 'Lote ÓPTIMO: Leche de vaca a 42°C con 7.5% inóculo (t_final: 4.25h)'),
('22222222-2222-2222-2222-222222222205', 'LOTE-VACA-44-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 2.50, 44.0, 'completado', 1185.00, 'Leche de vaca a 44°C con 2.5% inóculo (t_final: 6.50h)'),
('22222222-2222-2222-2222-222222222206', 'LOTE-VACA-44-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 'lactosa', 250.00, 7.50, 44.0, 'completado', 796.50, 'Leche de vaca a 44°C con 7.5% inóculo (t_final: 6.50h)');

-- B) BEBIDA DE AVENA (200 g, 5 g azúcar, inóculo Chivería)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, tipo_azucar, masa_solucion_g, porcentaje_inoculo, temperatura_objetivo, estado, viscosidad_final_mpas, observaciones_bioquimicas)
VALUES 
('22222222-2222-2222-2222-222222222211', 'LOTE-AVENA-42-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'avena', 'sacarosa', 200.00, 2.50, 42.0, 'completado', 950.00, 'Bebida de avena con 5g azúcar a 42°C (2.5% inóculo)'),
('22222222-2222-2222-2222-222222222212', 'LOTE-AVENA-42-5.0', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'avena', 'sacarosa', 200.00, 5.00, 42.0, 'completado', 920.00, 'Bebida de avena con 5g azúcar a 42°C (5.0% inóculo)'),
('22222222-2222-2222-2222-222222222213', 'LOTE-AVENA-44-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'avena', 'sacarosa', 200.00, 2.50, 44.0, 'completado', 890.00, 'Bebida de avena con 5g azúcar a 44°C (2.5% inóculo)'),
('22222222-2222-2222-2222-222222222214', 'LOTE-AVENA-44-5.0', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'avena', 'sacarosa', 200.00, 5.00, 44.0, 'completado', 860.00, 'Bebida de avena con 5g azúcar a 44°C (5.0% inóculo)');

-- C) BEBIDA DE ALMENDRA (Nature's Heart, 200 g, 5 g azúcar, inóculo Chivería)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, tipo_azucar, masa_solucion_g, porcentaje_inoculo, temperatura_objetivo, estado, viscosidad_final_mpas, observaciones_bioquimicas)
VALUES 
('22222222-2222-2222-2222-222222222221', 'LOTE-ALM-42-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'almendra', 'sacarosa', 200.00, 2.50, 42.0, 'completado', 410.00, 'Efecto Buffer: Carbonato de calcio y fosfato tricálcico amortiguan el pH impidiendo el corte en 4.50'),
('22222222-2222-2222-2222-222222222222', 'LOTE-ALM-42-5.0', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'almendra', 'sacarosa', 200.00, 5.00, 42.0, 'completado', 395.00, 'Efecto Buffer: Carbonato de calcio y fosfato tricálcico amortiguan el pH impidiendo el corte en 4.50'),
('22222222-2222-2222-2222-222222222223', 'LOTE-ALM-44-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'almendra', 'sacarosa', 200.00, 2.50, 44.0, 'completado', 380.00, 'Efecto Buffer: Carbonato de calcio y fosfato tricálcico amortiguan el pH impidiendo el corte en 4.50'),
('22222222-2222-2222-2222-222222222224', 'LOTE-ALM-44-5.0', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'almendra', 'sacarosa', 200.00, 5.00, 44.0, 'completado', 370.00, 'Efecto Buffer: Carbonato de calcio y fosfato tricálcico amortiguan el pH impidiendo el corte en 4.50');


-- =============================================================================
-- 3. SERIES TEMPORALES DE LECTURAS (CINÉTICA: min, pH, temp, °Brix)
-- =============================================================================

-- Lote 1: Vaca 40 °C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222201', 0,   6.2, 26.1, 10.2),
('22222222-2222-2222-2222-222222222201', 30,  6.3, 29.1, 13.1),
('22222222-2222-2222-2222-222222222201', 90,  5.8, 32.5, 12.2),
('22222222-2222-2222-2222-222222222201', 150, 5.1, 33.6, 11.8),
('22222222-2222-2222-2222-222222222201', 210, 4.9, 32.5, 6.4),
('22222222-2222-2222-2222-222222222201', 330, 4.7, 31.2, 6.5),
('22222222-2222-2222-2222-222222222201', 350, 4.6, 32.4, 5.9);

-- Lote 2: Vaca 40 °C / 7.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222202', 0,   6.4, 25.0, 12.0),
('22222222-2222-2222-2222-222222222202', 30,  6.1, 34.8, 11.5),
('22222222-2222-2222-2222-222222222202', 90,  5.3, 32.4, 12.0),
('22222222-2222-2222-2222-222222222202', 150, 4.9, 33.0, 8.5),
('22222222-2222-2222-2222-222222222202', 210, 4.7, 31.4, 7.6),
('22222222-2222-2222-2222-222222222202', 330, 4.6, 33.8, 5.5);

-- Lote 3: Vaca 42 °C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222203', 0,   6.2, 26.1, 10.2),
('22222222-2222-2222-2222-222222222203', 60,  6.3, 32.8, 11.2),
('22222222-2222-2222-2222-222222222203', 135, 6.0, 34.6, 11.8),
('22222222-2222-2222-2222-222222222203', 195, 5.9, 34.2, 11.8),
('22222222-2222-2222-2222-222222222203', 255, 5.8, 34.2, 5.7),
('22222222-2222-2222-2222-222222222203', 405, 4.7, 34.2, 5.1);

-- Lote 4: Vaca 42 °C / 7.5% (Óptimo)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222204', 0,   6.2, 26.1, 10.2),
('22222222-2222-2222-2222-222222222204', 60,  6.0, 36.0, 11.8),
('22222222-2222-2222-2222-222222222204', 135, 5.3, 36.2, 12.6),
('22222222-2222-2222-2222-222222222204', 195, 4.9, 35.1, 7.5),
('22222222-2222-2222-2222-222222222204', 255, 4.6, 35.1, 5.7);

-- Lote 5: Vaca 44 °C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222205', 0,   6.2, 34.5, 10.2),
('22222222-2222-2222-2222-222222222205', 60,  6.4, 37.5, 13.3),
('22222222-2222-2222-2222-222222222205', 120, 6.0, 38.0, 13.1),
('22222222-2222-2222-2222-222222222205', 180, 5.6, 37.9, 12.9),
('22222222-2222-2222-2222-222222222205', 240, 5.4, 35.7, 13.9),
('22222222-2222-2222-2222-222222222205', 330, 4.9, 35.7, 7.9),
('22222222-2222-2222-2222-222222222205', 390, 4.6, 36.9, 6.1);

-- Lote 6: Vaca 44 °C / 7.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222206', 0,   6.3, 27.0, 12.1),
('22222222-2222-2222-2222-222222222206', 60,  6.1, 36.7, 12.8),
('22222222-2222-2222-2222-222222222206', 120, 5.6, 39.5, 13.1),
('22222222-2222-2222-2222-222222222206', 180, 5.2, 38.0, 13.0),
('22222222-2222-2222-2222-222222222206', 240, 5.0, 38.4, 13.6),
('22222222-2222-2222-2222-222222222206', 330, 4.8, 35.7, 7.9),
('22222222-2222-2222-2222-222222222206', 390, 4.6, 36.9, 7.4);

-- Series Cinéticas de Avena y Almendra (Completas hasta 405 min / 6.75h)
-- Avena 42°C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222211', 0, 6.5, 42.0, 8.5),
('22222222-2222-2222-2222-222222222211', 120, 5.8, 42.1, 8.0),
('22222222-2222-2222-2222-222222222211', 240, 5.2, 41.9, 7.5),
('22222222-2222-2222-2222-222222222211', 405, 4.6, 42.0, 7.0);

-- Avena 42°C / 5.0%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222212', 0, 6.5, 42.0, 8.6),
('22222222-2222-2222-2222-222222222212', 120, 5.6, 42.0, 8.1),
('22222222-2222-2222-2222-222222222212', 240, 5.0, 42.2, 7.6),
('22222222-2222-2222-2222-222222222212', 405, 4.6, 42.0, 7.1);

-- Avena 44°C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222213', 0, 6.5, 44.0, 8.5),
('22222222-2222-2222-2222-222222222213', 120, 5.7, 43.9, 8.0),
('22222222-2222-2222-2222-222222222213', 240, 5.1, 44.1, 7.4),
('22222222-2222-2222-2222-222222222213', 405, 4.6, 44.0, 6.9);

-- Avena 44°C / 5.0%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222214', 0, 6.5, 44.0, 8.6),
('22222222-2222-2222-2222-222222222214', 120, 5.5, 44.0, 8.1),
('22222222-2222-2222-2222-222222222214', 240, 4.9, 44.2, 7.5),
('22222222-2222-2222-2222-222222222214', 405, 4.6, 44.0, 7.0);

-- Almendra 42°C / 2.5% (Efecto Buffer: se estabiliza sin alcanzar pH 4.5)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222221', 0, 6.8, 42.0, 7.5),
('22222222-2222-2222-2222-222222222221', 120, 6.4, 42.0, 7.2),
('22222222-2222-2222-2222-222222222221', 240, 6.1, 42.1, 6.9),
('22222222-2222-2222-2222-222222222221', 405, 5.9, 42.0, 6.5);

-- Almendra 42°C / 5.0%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222222', 0, 6.8, 42.0, 7.5),
('22222222-2222-2222-2222-222222222222', 120, 6.3, 42.0, 7.2),
('22222222-2222-2222-2222-222222222222', 240, 6.0, 42.1, 6.8),
('22222222-2222-2222-2222-222222222222', 405, 5.8, 42.0, 6.4);

-- Almendra 44°C / 2.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222223', 0, 6.8, 44.0, 7.5),
('22222222-2222-2222-2222-222222222223', 120, 6.4, 44.0, 7.2),
('22222222-2222-2222-2222-222222222223', 240, 6.1, 44.1, 6.9),
('22222222-2222-2222-2222-222222222223', 405, 5.9, 44.0, 6.5);

-- Almendra 44°C / 5.0%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion_brix) VALUES
('22222222-2222-2222-2222-222222222224', 0, 6.8, 44.0, 7.5),
('22222222-2222-2222-2222-222222222224', 120, 6.3, 44.0, 7.2),
('22222222-2222-2222-2222-222222222224', 240, 6.0, 44.1, 6.8),
('22222222-2222-2222-2222-222222222224', 405, 5.8, 44.0, 6.4);
