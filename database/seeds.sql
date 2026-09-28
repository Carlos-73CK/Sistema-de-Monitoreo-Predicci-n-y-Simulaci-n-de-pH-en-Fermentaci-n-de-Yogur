-- =============================================================================
-- PROYECTO: PrediYogur
-- DESCRIPCIÓN: Datos iniciales de prueba para verificación del esquema DDL.
-- =============================================================================

-- 1. Insertar usuario docente / investigador administrador de prueba
INSERT INTO usuarios (id, nombre, correo, contrasena, rol) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Stalin Santacruz',
    'stalin.santacruz@uleam.edu.ec',
    '$2b$10$w8T0sXj8WdD3zK3W5jQO.O3vKjQ2eR3h8T8y9U0V1W2X3Y4Z5A6B', -- Contraseña hash simulada (bcrypt)
    'docente'
);

-- 2. Insertar ensayo experimental de prueba (Leche de Vaca + Lactosa)
INSERT INTO ensayos (
    id, 
    usuario_id, 
    nombre_lote, 
    tipo_leche, 
    tipo_azucar, 
    masa_leche, 
    masa_inoculo, 
    temperatura_objetivo, 
    estado, 
    viscosidad_final
) 
VALUES (
    'b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Lote Piloto Vaca-Lactosa #001',
    'vaca',
    'lactosa',
    1000.00, -- 1000g de leche
    30.00,   -- 30g de inóculo de Chivería
    42.00,   -- Temperatura del baño: 42°C
    'completado',
    1850.50  -- Viscosidad al alcanzar pH 4.5
);

-- 3. Insertar serie temporal de lecturas cinéticas de pH
INSERT INTO lecturas_ensayo (ensayo_id, tiempo_minutos, ph, temperatura) VALUES
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 0,   6.70, 41.90),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 30,  6.45, 42.10),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 60,  6.10, 42.00),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 90,  5.65, 41.85),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 120, 5.15, 42.05),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 150, 4.80, 42.00),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 180, 4.50, 42.10); -- pH de corte alcanzado