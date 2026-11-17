-- =============================================================================
-- PROYECTO: PrediYogur — Sistema de Monitoreo, Predicción y Simulación de pH
-- INSTITUCIÓN: Universidad Laica Eloy Alfaro de Manabí (ULEAM)
-- ARCHIVO: database/neon_views.sql
-- DESCRIPCIÓN: Vistas analíticas, científicas y de auditoría para consultas
--              de investigación, reportes de la Cátedra de Química de Alimentos
--              y monitoreo de sincronización híbrida SQLite <-> Neon PostgreSQL.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. VISTA: Resumen de ensayos agrupados por investigador / usuario
-- =============================================================================
CREATE OR REPLACE VIEW vw_resumen_ensayos_usuario AS
SELECT
    u.id AS usuario_id,
    TRIM(u.nombre || ' ' || COALESCE(u.apellidos, '')) AS investigador_nombre,
    u.email AS investigador_email,
    u.rol AS usuario_rol,
    COUNT(e.id) FILTER (WHERE e.deleted_at IS NULL) AS total_lotes_registrados,
    COUNT(e.id) FILTER (WHERE e.es_referencia_cientifica = TRUE AND e.deleted_at IS NULL) AS lotes_referencia_cientifica,
    ROUND(AVG(e.temperatura_incubacion) FILTER (WHERE e.deleted_at IS NULL), 2) AS promedio_temperatura_c,
    ROUND(AVG(e.viscosidad_final_mpas) FILTER (WHERE e.deleted_at IS NULL), 2) AS promedio_viscosidad_mpas,
    ROUND(AVG(e.tiempo_corte_estimado_horas) FILTER (WHERE e.deleted_at IS NULL), 2) AS promedio_tiempo_corte_horas
FROM usuarios u
LEFT JOIN ensayos e
    ON (u.id = e.usuario_id OR LOWER(u.email) = LOWER(e.usuario_email))
GROUP BY u.id, u.nombre, u.apellidos, u.email, u.rol;

COMMENT ON VIEW vw_resumen_ensayos_usuario IS 'Consolida indicadores estadísticos de lotes, temperatura, tiempo de corte y viscosidad por cada investigador.';

-- =============================================================================
-- 2. VISTA: Auditoría de curvas cinéticas y parámetros Hill de fermentación
-- =============================================================================
CREATE OR REPLACE VIEW vw_cinetica_fermentacion_auditoria AS
SELECT
    e.id AS ensayo_id,
    e.codigo AS lote_codigo,
    e.nombre_lote,
    e.investigador,
    e.usuario_email,
    e.tipo_sustrato,
    s.nombre AS sustrato_nombre,
    s.efecto_buffer,
    e.tipo_azucar,
    e.masa_solucion_g,
    e.porcentaje_inoculo,
    e.masa_inoculo_g,
    e.temperatura_incubacion,
    e.ph_inicial,
    e.ph_objetivo,
    e.parametro_t50_min,
    e.parametro_gamma,
    e.tiempo_corte_inicial_horas,
    e.tiempo_corte_estimado_horas,
    e.tiempo_corte_estimado_minutos,
    e.diferencia_minutos,
    e.viscosidad_final_mpas AS viscosidad_final,
    e.indice_refraccion_final_brix AS brix_final,
    e.estado,
    e.es_referencia_cientifica,
    COUNT(l.id) AS total_lecturas_registradas,
    MIN(l.ph) AS ph_minimo_medido,
    MAX(l.tiempo_minutos) AS ultimo_minuto_medido,
    e.created_at AS fecha_ensayo,
    e.updated_at AS ultima_actualizacion
FROM ensayos e
LEFT JOIN catalogo_sustratos s ON s.codigo = e.tipo_sustrato
LEFT JOIN lecturas_ensayo l ON l.ensayo_id = e.id
WHERE e.deleted_at IS NULL
GROUP BY
    e.id, s.nombre, s.efecto_buffer;

COMMENT ON VIEW vw_cinetica_fermentacion_auditoria IS 'Vista integral para auditoría de lotes, parámetros del modelo sigmoidal de Hill y resumen de lecturas reales.';

-- =============================================================================
-- 3. VISTA: Matriz Oficial de los 6 Lotes de Referencia del Dr. Stalin Santacruz
-- =============================================================================
CREATE OR REPLACE VIEW vw_lotes_referencia_santacruz AS
SELECT
    e.codigo AS lote_id,
    e.temperatura_incubacion AS temperatura_c,
    e.porcentaje_inoculo AS inoculo_pct,
    e.masa_inoculo_g,
    e.masa_solucion_g,
    e.parametro_t50_min AS t50_minutos,
    e.parametro_gamma AS gamma_hill,
    e.tiempo_corte_real_horas AS tiempo_corte_horas,
    e.viscosidad_final_mpas AS viscosidad_mpas,
    e.indice_refraccion_final_brix AS brix_final,
    COUNT(l.id) AS lecturas_experimentales,
    e.diagnostico
FROM ensayos e
LEFT JOIN lecturas_ensayo l ON l.ensayo_id = e.id
WHERE e.es_referencia_cientifica = TRUE
  AND e.deleted_at IS NULL
GROUP BY e.id
ORDER BY e.temperatura_incubacion ASC, e.porcentaje_inoculo ASC;

COMMENT ON VIEW vw_lotes_referencia_santacruz IS 'Expone la tabla de referencia científica 2x3 (40°C, 42°C, 44°C x 2.5%, 7.5% inóculo Chivería) con sus parámetros t50, gamma, corte, viscosidad y Brix.';

-- =============================================================================
-- 4. VISTA: Historial de Predicciones y Simulaciones del Modelo de Hill
-- =============================================================================
CREATE OR REPLACE VIEW vw_historial_predicciones_hill AS
SELECT
    p.id AS prediccion_id,
    p.lote_codigo,
    p.investigador,
    p.modelo_utilizado,
    p.tipo_sustrato,
    p.tipo_azucar,
    p.temperatura_c,
    p.porcentaje_inoculo,
    p.masa_inoculo_g,
    p.volumen_ml,
    p.parametro_t50,
    p.parametro_gamma,
    p.tiempo_corte_horas,
    p.tiempo_corte_minutos,
    p.viscosidad_predicha_mpas,
    p.calidad_gel,
    p.diagnostico,
    p.metricas_modelo,
    p.ejecutado_en
FROM predicciones p
ORDER BY p.ejecutado_en DESC;

COMMENT ON VIEW vw_historial_predicciones_hill IS 'Consulta histórica ordenada de simulaciones What-If y predicciones ejecutadas en PrediYogur.';

-- =============================================================================
-- 5. VISTA: Dataset de Retroalimentación Validado para Reentrenamiento
-- =============================================================================
CREATE OR REPLACE VIEW vw_dataset_feedback_validado AS
SELECT
    f.id,
    f.lote_codigo,
    f.temperatura_incubacion_c,
    f.porcentaje_inoculo,
    f.masa_inoculo_g,
    f.tiempo_minutos,
    f.tiempo_horas,
    f.ph_real,
    f.temperatura_real_medida,
    f.indice_refraccion_real,
    f.viscosidad_final_real,
    f.estado_validacion,
    f.incorporado_en
FROM dataset_retroalimentacion f
WHERE f.estado_validacion IN ('validado', 'referencia_oficial')
ORDER BY f.lote_codigo ASC, f.tiempo_minutos ASC;

COMMENT ON VIEW vw_dataset_feedback_validado IS 'Filtra únicamente las muestras de retroalimentación validadas científicamente para evitar contaminación del modelo con datos no verificados.';

-- =============================================================================
-- 6. VISTA: Auditoría de Operaciones Recientes
-- =============================================================================
CREATE OR REPLACE VIEW vw_auditoria_operaciones_recientes AS
SELECT
    a.id AS auditoria_id,
    a.fecha_evento,
    a.accion,
    a.entidad_afectada,
    a.registro_afectado_id,
    COALESCE(a.usuario_email, u.email, 'sistema@uleam.edu.ec') AS ejecutado_por,
    a.datos_anteriores,
    a.datos_posteriores,
    a.informacion_tecnica
FROM auditoria_operaciones a
LEFT JOIN usuarios u ON u.id = a.usuario_id
ORDER BY a.fecha_evento DESC;

COMMENT ON VIEW vw_auditoria_operaciones_recientes IS 'Bitácora cronológica de auditoría sobre inicios de sesión, ensayos, lecturas, predicciones y exportaciones.';

COMMIT;
