-- =============================================================================
-- PROYECTO: PrediYogur
-- DESCRIPCIÓN: Datos iniciales de prueba (Usuario y ensayos con leche de vaca y chocho).
-- =============================================================================

-- 1. Insertar usuario inicial de prueba (Docente / Investigador)
INSERT INTO usuarios (id, nombre, email, password_hash, rol) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Stalin Santacruz',
    'admin@uleam.edu.ec',
    '$2b$10$w8T0sXj8WdD3zK3W5jQO.O3vKjQ2eR3h8T8y9U0V1W2X3Y4Z5A6B',
    'docente'
);

-- 2. Ensayo 1: Leche de vaca (FINALIZADO, cortado en pH 4.5 con viscosidad registrada)
INSERT INTO ensayos (
    id, 
    codigo, 
    usuario_id, 
    tipo_sustrato, 
    masa_inoculo_g, 
    temperatura_objetivo, 
    volumen_ml, 
    estado, 
    viscosidad_final, 
    observaciones,
    finished_at
) 
VALUES (
    'b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22',
    'LOTE-YOG-001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'vaca',
    30.00, -- 30g de inóculo de Chivería
    42.0,  -- Temperatura objetivo baño maría
    1000.0,
    'finalizado',
    1850.50, -- Viscosidad final obligatoria al cortar en pH 4.5
    'Ensayo completado exitosamente con leche tradicional de vaca.',
    CURRENT_TIMESTAMP
);

-- Serie temporal de lecturas cinéticas del Ensayo 1 (Vaca)
INSERT INTO lecturas (ensayo_id, minutos, ph, temperatura) VALUES
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 0,   6.70, 41.9),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 30,  6.45, 42.1),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 60,  6.10, 42.0),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 90,  5.65, 41.8),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 120, 5.15, 42.0),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 150, 4.80, 42.2),
('b1fec999-9c0b-4ef8-bb6d-6bb9bd380a22', 180, 4.50, 42.0); -- pH de corte estricto 4.5


-- 3. Ensayo 2: Leche vegetal de chocho (EN PROCESO, acidificación progresiva)
INSERT INTO ensayos (
    id, 
    codigo, 
    usuario_id, 
    tipo_sustrato, 
    masa_inoculo_g, 
    temperatura_objetivo, 
    volumen_ml, 
    estado, 
    viscosidad_final, 
    observaciones
) 
VALUES (
    'c2fed888-8b0a-3de7-aa5c-5aa8ac270b33',
    'LOTE-CHOCHO-002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'chocho',
    35.00, -- 35g de inóculo
    42.0,  
    1000.0,
    'en_proceso',
    NULL, -- Pendiente hasta llegar al corte en pH 4.5
    'Ensayo experimental con matriz vegetal de chocho en curso.'
);

-- Serie temporal de lecturas cinéticas del Ensayo 2 (Chocho - En proceso)
INSERT INTO lecturas (ensayo_id, minutos, ph, temperatura) VALUES
('c2fed888-8b0a-3de7-aa5c-5aa8ac270b33', 0,   6.80, 42.0),
('c2fed888-8b0a-3de7-aa5c-5aa8ac270b33', 30,  6.60, 41.9),
('c2fed888-8b0a-3de7-aa5c-5aa8ac270b33', 60,  6.30, 42.1),
('c2fed888-8b0a-3de7-aa5c-5aa8ac270b33', 90,  5.95, 42.0); -- Acidificación progresiva hacia 4.5