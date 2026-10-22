-- =========================================================================
-- Vistas Analíticas para Auditoría - PrediYogur (ULEAM)
-- Autor: Alex Agustín Patiño Angulo
-- =========================================================================

-- Vista 1: Resumen de ensayos agrupados por usuario/investigador
CREATE OR REPLACE VIEW vw_resumen_ensayos_usuario AS
SELECT 
    u.nombre AS investigador_nombre,
    u.email AS investigador_email,
    u.rol AS usuario_rol,
    COUNT(e.id) AS total_lotes_registrados,
    ROUND(AVG(e.temperatura_incubacion), 2) AS promedio_temperatura,
    ROUND(AVG(e.viscosidad_final), 2) AS promedio_viscosidad_alcanzada
FROM usuarios u
LEFT JOIN ensayos e ON u.email = e.usuario_email
GROUP BY u.id, u.nombre, u.email, u.rol;

COMMENT ON VIEW vw_resumen_ensayos_usuario IS 'Vista analítica que consolida métricas de ensayos por cada usuario registrado';

-- Vista 2: Auditoría de curvas cinéticas de fermentación
CREATE OR REPLACE VIEW vw_cinetica_fermentacion_auditoria AS
SELECT 
    e.id AS ensayo_id,
    e.lote_codigo,
    e.tipo_azucar,
    e.porcentaje_inoculo,
    e.tiempo_corte_estimado_minutos,
    e.diferencia_minutos,
    e.usuario_email,
    e.viscosidad_final,
    e.creado_en AS fecha_ensayo
FROM ensayos e;

COMMENT ON VIEW vw_cinetica_fermentacion_auditoria IS 'Vista orientada a la auditoría temporal y de parámetros del modelo cinético en los lotes';
