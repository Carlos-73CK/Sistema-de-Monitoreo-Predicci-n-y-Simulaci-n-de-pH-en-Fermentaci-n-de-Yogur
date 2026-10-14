-- =============================================================================
-- PROYECTO: PrediYogur
-- DESCRIPCIÓN: Datos experimentales reales del Dr. Stalin Santacruz (6 lotes).
-- =============================================================================

-- 1. Usuario administrador de prueba
INSERT INTO usuarios (id, nombre, email, password_hash, rol) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Stalin Santacruz',
    'admin@uleam.edu.ec',
    '$2b$10$w8T0sXj8WdD3zK3W5jQO.O3vKjQ2eR3h8T8y9U0V1W2X3Y4Z5A6B',
    'docente'
);

-- =============================================================================
-- 2. INSERCIÓN DE LOS 6 LOTES EXPERIMENTALES REALES
-- =============================================================================

-- Lote 1: 40 °C / 2.5% inóculo (6.25g sobre 250g leche)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111101', 'LOTE-CHV-40-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 6.25, 40.0, 250.0, 'completado', 2579.00, 'Lote experimental 40°C - 2.5% inóculo');

-- Lote 2: 40 °C / 7.5% inóculo (18.75g sobre 250g leche)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111102', 'LOTE-CHV-40-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 18.75, 40.0, 250.0, 'completado', 786.60, 'Lote experimental 40°C - 7.5% inóculo');

-- Lote 3: 42 °C / 2.5% inóculo (6.25g sobre 250g leche)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111103', 'LOTE-CHV-42-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 6.25, 42.0, 250.0, 'completado', 1454.00, 'Lote experimental 42°C - 2.5% inóculo');

-- Lote 4: 42 °C / 7.5% inóculo (Óptimo)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111104', 'LOTE-CHV-42-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 18.75, 42.0, 250.0, 'completado', 2639.00, 'Lote óptimo experimental 42°C - 7.5% inóculo');

-- Lote 5: 44 °C / 2.5% inóculo (6.25g sobre 250g leche)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111105', 'LOTE-CHV-44-2.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 6.25, 44.0, 250.0, 'completado', 1185.00, 'Lote experimental 44°C - 2.5% inóculo');

-- Lote 6: 44 °C / 7.5% inóculo (18.75g sobre 250g leche)
INSERT INTO ensayos (id, codigo, usuario_id, tipo_sustrato, masa_inoculo_g, temperatura_objetivo, volumen_ml, estado, viscosidad_final, observaciones)
VALUES ('11111111-1111-1111-1111-111111111106', 'LOTE-CHV-44-7.5', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vaca', 18.75, 44.0, 250.0, 'completado', 796.50, 'Lote experimental 44°C - 7.5% inóculo');


-- =============================================================================
-- 3. SERIES TEMPORALES DE LECTURAS EN lecturas_ensayo
-- =============================================================================

-- Lote 1 (40 °C / 2.5%)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111101', 0,   6.2, 26.1, 10.2),
('11111111-1111-1111-1111-111111111101', 30,  6.3, 29.1, 13.1),
('11111111-1111-1111-1111-111111111101', 90,  5.8, 32.5, 12.2),
('11111111-1111-1111-1111-111111111101', 150, 5.1, 33.6, 11.8),
('11111111-1111-1111-1111-111111111101', 210, 4.9, 32.5, 6.4),
('11111111-1111-1111-1111-111111111101', 330, 4.7, 31.2, 6.5),
('11111111-1111-1111-1111-111111111101', 350, 4.6, 32.4, 5.9);

-- Lote 2 (40 °C / 7.5%)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111102', 0,   6.4, 25.0, 12.0),
('11111111-1111-1111-1111-111111111102', 30,  6.1, 34.8, 11.5),
('11111111-1111-1111-1111-111111111102', 90,  5.3, 32.4, 12.0),
('11111111-1111-1111-1111-111111111102', 150, 4.9, 33.0, 8.5),
('11111111-1111-1111-1111-111111111102', 210, 4.7, 31.4, 7.6),
('11111111-1111-1111-1111-111111111102', 330, 4.6, 33.8, 5.5);

-- Lote 3 (42 °C / 2.5%)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111103', 0,   6.2, 26.1, 10.2),
('11111111-1111-1111-1111-111111111103', 60,  6.3, 32.8, 11.2),
('11111111-1111-1111-1111-111111111103', 135, 6.0, 34.6, 11.8),
('11111111-1111-1111-1111-111111111103', 195, 5.9, 34.2, 11.8),
('11111111-1111-1111-1111-111111111103', 255, 5.8, 34.2, 5.7),
('11111111-1111-1111-1111-111111111103', 405, 4.7, 34.2, 5.1);

-- Lote 4 (42 °C / 7.5% - Óptimo)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111104', 0,   6.2, 26.1, 10.2),
('11111111-1111-1111-1111-111111111104', 60,  6.0, 36.0, 11.8),
('11111111-1111-1111-1111-111111111104', 135, 5.3, 36.2, 12.6),
('11111111-1111-1111-1111-111111111104', 195, 4.9, 35.1, 7.5),
('11111111-1111-1111-1111-111111111104', 255, 4.6, 35.1, 5.7);

-- Lote 5 (44 °C / 2.5%)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111105', 0,   6.2, 34.5, 10.2),
('11111111-1111-1111-1111-111111111105', 60,  6.4, 37.5, 13.3),
('11111111-1111-1111-1111-111111111105', 120, 6.0, 38.0, 13.1),
('11111111-1111-1111-1111-111111111105', 180, 5.6, 37.9, 12.9),
('11111111-1111-1111-1111-111111111105', 240, 5.4, 35.7, 13.9),
('11111111-1111-1111-1111-111111111105', 330, 4.9, 35.7, 7.9),
('11111111-1111-1111-1111-111111111105', 390, 4.6, 36.9, 6.1);

-- Lote 6 (44 °C / 7.5%)
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
('11111111-1111-1111-1111-111111111106', 60,  6.1, 36.7, 12.8),
('11111111-1111-1111-1111-111111111106', 120, 5.6, 39.5, 13.1),
('11111111-1111-1111-1111-111111111106', 180, 5.2, 38.0, 13.0),
('11111111-1111-1111-1111-111111111106', 240, 5.0, 38.4, 13.6),
('11111111-1111-1111-1111-111111111106', 330, 4.8, 35.7, 7.9),
('11111111-1111-1111-1111-111111111106', 390, 4.6, 36.9, 7.4);