-- =============================================================================
-- PROYECTO: PrediYogur (ULEAM)
-- DESCRIPCIÓN: Datos experimentales reales del Dr. Stalin Santacruz y usuarios del laboratorio.
-- =============================================================================

-- 1. Usuarios del Laboratorio
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Dr. Stalin Santacruz Terán', 'dr.santacruz@uleam.edu.ec', '$2b$10$Q7y0vG8r06zE5B9K4l2m3.yFzJg9g1T6U8W0vG1r2A3B4C5D6E7F8', 'investigador'),
('Carlos Delgado', 'carlos.delgado@uleam.edu.ec', '$2b$10$Q7y0vG8r06zE5B9K4l2m3.yFzJg9g1T6U8W0vG1r2A3B4C5D6E7F8', 'investigador'),
('Estudiante ULEAM', 'estudiante@uleam.edu.ec', '$2b$10$Q7y0vG8r06zE5B9K4l2m3.yFzJg9g1T6U8W0vG1r2A3B4C5D6E7F8', 'estudiante')
ON CONFLICT (email) DO NOTHING;

-- 2. Lotes Experimentales Calibrados del Dr. Santacruz
INSERT INTO ensayos (lote_codigo, temperatura_incubacion, tipo_azucar, porcentaje_inoculo, tiempo_corte_inicial_horas, tiempo_corte_estimado_horas, tiempo_corte_estimado_minutos, diferencia_minutos, usuario_email, viscosidad_final) VALUES
('LOTE-CHV-42-7.5-OPT', 42.0, 'lactosa', 7.50, 4.25, 4.25, 255, 0, 'carlos.delgado@uleam.edu.ec', 2639.00),
('LOTE-CHV-42-2.5-LEN', 42.0, 'lactosa', 2.50, 6.75, 6.75, 405, 0, 'carlos.delgado@uleam.edu.ec', 1454.00),
('LOTE-CHV-40-7.5-FRIO', 40.0, 'lactosa', 7.50, 4.33, 4.33, 260, 0, 'dr.santacruz@uleam.edu.ec', 786.60),
('LOTE-CHV-44-7.5-CALOR', 44.0, 'lactosa', 7.50, 4.25, 4.25, 255, 0, 'dr.santacruz@uleam.edu.ec', 796.50),
('LOTE-CHOCHO-42-SAC', 42.0, 'sacarosa', 7.50, 4.50, 4.50, 270, 0, 'dr.santacruz@uleam.edu.ec', 2150.00),
('LOTE-COCO-42-GLU', 42.0, 'glucosa', 7.50, 4.10, 4.10, 246, 0, 'carlos.delgado@uleam.edu.ec', 1980.00)
ON CONFLICT (lote_codigo) DO NOTHING;

-- 3. Series Temporales de Lecturas Periódicas en lecturas_ensayo
-- Lote 1: Óptimo 42 °C / 7.5%
INSERT INTO lecturas_ensayo (ensayo_id, minutos, ph, temperatura, indice_refraccion) VALUES
(1, 0,   6.25, 42.0, 10.5),
(1, 60,  5.95, 42.1, 9.8),
(1, 120, 5.15, 42.0, 8.0),
(1, 180, 4.82, 41.9, 7.2),
(1, 240, 4.54, 42.0, 6.5),
(1, 255, 4.50, 42.0, 6.3)
ON CONFLICT (ensayo_id, minutos) DO NOTHING;
