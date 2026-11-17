-- =============================================================================
-- PROYECTO: PrediYogur — Sistema de Monitoreo, Predicción y Simulación de pH
-- INSTITUCIÓN: Universidad Laica Eloy Alfaro de Manabí (ULEAM)
-- CÁTEDRA: Química de Alimentos y Maestría en Alimentos
-- PATROCINADOR CIENTÍFICO: Dr. Stalin Gustavo Santacruz Terán
-- ARCHIVO: database/neon_schema.sql
-- MOTOR OBJETIVO: Neon Serverless PostgreSQL 15 / 16 / 17 (SSL requerido)
-- DESCRIPCIÓN: Esquema relacional normalizado completo con soporte de catálogos
--              bioquímicos, usuarios (RBAC + OWASP), ensayos, lecturas cinéticas,
--              historial de predicciones (modelo sigmoidal de Hill), dataset de
--              retroalimentación, auditoría de operaciones y trazabilidad de
--              sincronización híbrida SQLite <-> Neon PostgreSQL.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. EXTENSIONES NECESARIAS EN NEON POSTGRESQL
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. LIMPIEZA IDEMPOTENTE EN ORDEN INVERSO DE DEPENDENCIA
-- =============================================================================
DROP VIEW IF EXISTS vw_estado_sincronizacion_hibrida CASCADE;
DROP VIEW IF EXISTS vw_auditoria_operaciones_recientes CASCADE;
DROP VIEW IF EXISTS vw_dataset_feedback_validado CASCADE;
DROP VIEW IF EXISTS vw_historial_predicciones_hill CASCADE;
DROP VIEW IF EXISTS vw_lotes_referencia_santacruz CASCADE;
DROP VIEW IF EXISTS vw_cinetica_fermentacion_auditoria CASCADE;
DROP VIEW IF EXISTS vw_resumen_ensayos_usuario CASCADE;

DROP TABLE IF EXISTS sincronizacion_historial CASCADE;
DROP TABLE IF EXISTS auditoria_operaciones CASCADE;
DROP TABLE IF EXISTS dataset_retroalimentacion CASCADE;
DROP TABLE IF EXISTS predicciones CASCADE;
DROP TABLE IF EXISTS lecturas_ensayo CASCADE;
DROP TABLE IF EXISTS ensayos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS catalogo_azucares CASCADE;
DROP TABLE IF EXISTS catalogo_sustratos CASCADE;

-- =============================================================================
-- 3. FUNCIONES UTILITARIAS Y TRIGGERS DE MANTENIMIENTO
-- =============================================================================

-- 3.1. Función para actualizar automáticamente la columna updated_at (TIMESTAMPTZ)
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. CATÁLOGOS BIOQUÍMICOS JUSTIFICADOS (5.7)
-- =============================================================================

-- 4.1. Catálogo de Sustratos / Matrices Alimentarias
CREATE TABLE catalogo_sustratos (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    origen VARCHAR(30) NOT NULL DEFAULT 'vegetal',
    marca_referencia VARCHAR(120) NULL,
    ph_inicial_tipico NUMERIC(4, 2) NOT NULL DEFAULT 6.25,
    ph_corte_esperado NUMERIC(4, 2) NOT NULL DEFAULT 4.50,
    brix_inicial_tipico NUMERIC(5, 2) NOT NULL DEFAULT 10.50,
    brix_final_tipico NUMERIC(5, 2) NOT NULL DEFAULT 5.60,
    efecto_buffer BOOLEAN NOT NULL DEFAULT FALSE,
    aditivos_amortiguadores VARCHAR(200) NULL,
    alcanza_corte_450 BOOLEAN NOT NULL DEFAULT TRUE,
    rango_viscosidad_min_mpas NUMERIC(8, 2) NOT NULL DEFAULT 50.00,
    rango_viscosidad_max_mpas NUMERIC(8, 2) NOT NULL DEFAULT 3000.00,
    descripcion_bioquimica TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_catalogo_sustrato_origen
        CHECK (origen IN ('animal_bovino', 'vegetal', 'mixto', 'otro')),
    CONSTRAINT chk_catalogo_sustrato_ph
        CHECK (ph_inicial_tipico BETWEEN 3.80 AND 7.20 AND ph_corte_esperado BETWEEN 3.80 AND 7.20)
);

COMMENT ON TABLE catalogo_sustratos IS 'Catálogo fisicoquímico de matrices lácteas y vegetales soportadas por PrediYogur (Vaca, Avena, Almendra, Chocho, Coco, Soya, Otra).';

-- 4.2. Catálogo de Fuentes de Carbohidratos / Azúcares
CREATE TABLE catalogo_azucares (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_carbohidrato VARCHAR(40) NOT NULL,
    factor_t50 NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
    factor_vmax NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
    factor_tiempo_corte NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
    mecanismo_bioquimico TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_catalogo_azucar_factores
        CHECK (factor_t50 > 0 AND factor_vmax > 0 AND factor_tiempo_corte > 0)
);

COMMENT ON TABLE catalogo_azucares IS 'Catálogo de carbohidratos y moduladores cinéticos de Vmax y fase de latencia (lactosa, sacarosa, glucosa, mezcla_sacarosa_glucosa).';

-- =============================================================================
-- 5. TABLA: usuarios (5.1)
-- =============================================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sqlite_id INTEGER UNIQUE NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL DEFAULT '',
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'estudiante',
    estado_cuenta VARCHAR(20) NOT NULL DEFAULT 'activo',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expira TIMESTAMPTZ NULL,
    ultimo_acceso TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT chk_usuario_rol
        CHECK (rol IN ('administrador', 'admin', 'investigador', 'docente', 'estudiante', 'usuario')),
    CONSTRAINT chk_usuario_estado_cuenta
        CHECK (estado_cuenta IN ('activo', 'inactivo', 'bloqueado', 'suspendido')),
    CONSTRAINT chk_usuario_intentos_no_negativos
        CHECK (intentos_fallidos >= 0),
    CONSTRAINT chk_usuario_email_valido
        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

COMMENT ON TABLE usuarios IS 'Registro de usuarios del sistema PrediYogur con soporte de roles RBAC, protección contra fuerza bruta (OWASP) y trazabilidad con SQLite.';

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_timestamp();

-- =============================================================================
-- 6. TABLA: ensayos (5.2)
-- =============================================================================
CREATE TABLE ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sqlite_id INTEGER UNIQUE NULL,
    codigo VARCHAR(80) NOT NULL UNIQUE,
    nombre_lote VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    usuario_id UUID NULL,
    usuario_email VARCHAR(150) NULL,
    investigador VARCHAR(150) NOT NULL DEFAULT 'Lab. Química de Alimentos — ULEAM',
    tipo_sustrato VARCHAR(50) NOT NULL DEFAULT 'vaca',
    tipo_leche VARCHAR(50) GENERATED ALWAYS AS (tipo_sustrato) STORED,
    marca_sustrato VARCHAR(120) NULL,
    tipo_azucar VARCHAR(50) NOT NULL DEFAULT 'lactosa',
    ratio_glucosa NUMERIC(4, 2) NOT NULL DEFAULT 0.50,
    masa_solucion_g NUMERIC(8, 2) NOT NULL DEFAULT 250.00,
    volumen_ml NUMERIC(8, 2) NOT NULL DEFAULT 250.00,
    masa_leche NUMERIC(8, 2) GENERATED ALWAYS AS (masa_solucion_g) STORED,
    porcentaje_inoculo NUMERIC(5, 2) NOT NULL DEFAULT 7.50,
    masa_inoculo_g NUMERIC(8, 2) NOT NULL DEFAULT 18.75,
    masa_inoculo NUMERIC(8, 2) GENERATED ALWAYS AS (masa_inoculo_g) STORED,
    temperatura_incubacion NUMERIC(4, 1) NOT NULL DEFAULT 42.0,
    temperatura_objetivo NUMERIC(4, 1) GENERATED ALWAYS AS (temperatura_incubacion) STORED,
    ph_inicial NUMERIC(4, 2) NOT NULL DEFAULT 6.25,
    ph_objetivo NUMERIC(4, 2) NOT NULL DEFAULT 4.50,
    parametro_t50_min NUMERIC(6, 2) NULL,
    parametro_gamma NUMERIC(5, 2) NULL,
    tiempo_corte_inicial_horas NUMERIC(6, 2) NULL,
    tiempo_corte_inicial_minutos INTEGER NULL,
    tiempo_corte_estimado_horas NUMERIC(6, 2) NULL,
    tiempo_corte_estimado_minutos INTEGER NULL,
    tiempo_corte_real_horas NUMERIC(6, 2) NULL,
    tiempo_corte_real_minutos INTEGER NULL,
    diferencia_minutos INTEGER NOT NULL DEFAULT 0,
    viscosidad_final_mpas NUMERIC(8, 2) NULL,
    viscosidad_final NUMERIC(8, 2) GENERATED ALWAYS AS (viscosidad_final_mpas) STORED,
    viscosimetro_condiciones VARCHAR(100) NULL DEFAULT 'rotor 4, 60 rpm',
    indice_refraccion_final_brix NUMERIC(5, 2) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'en_ejecucion',
    es_referencia_cientifica BOOLEAN NOT NULL DEFAULT FALSE,
    es_excepcional BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT NULL,
    observaciones_bioquimicas TEXT NULL,
    diagnostico TEXT NULL,
    origen_sincronizacion VARCHAR(30) NOT NULL DEFAULT 'neon_directo',
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_ensayo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_ensayo_tipo_sustrato
        CHECK (tipo_sustrato IN ('vaca', 'avena', 'almendra', 'chocho', 'coco', 'soya', 'otra', 'vegetal_chocho', 'vegetal_coco')),

    CONSTRAINT chk_ensayo_tipo_azucar
        CHECK (tipo_azucar IN ('lactosa', 'sacarosa', 'glucosa', 'mezcla_sacarosa_glucosa')),

    CONSTRAINT chk_ensayo_ratio_glucosa
        CHECK (ratio_glucosa BETWEEN 0.00 AND 1.00),

    CONSTRAINT chk_ensayo_masa_solucion
        CHECK (es_excepcional = TRUE OR (masa_solucion_g BETWEEN 50.00 AND 5000.00)),

    CONSTRAINT chk_ensayo_volumen_ml
        CHECK (es_excepcional = TRUE OR (volumen_ml BETWEEN 50.00 AND 5000.00)),

    CONSTRAINT chk_ensayo_porcentaje_inoculo
        CHECK (es_excepcional = TRUE OR (porcentaje_inoculo BETWEEN 0.50 AND 15.00)),

    CONSTRAINT chk_ensayo_masa_inoculo
        CHECK (masa_inoculo_g > 0.00 AND masa_inoculo_g <= 1000.00),

    CONSTRAINT chk_ensayo_temperatura
        CHECK (es_excepcional = TRUE OR (temperatura_incubacion BETWEEN 20.0 AND 52.0)),

    CONSTRAINT chk_ensayo_ph_inicial
        CHECK (es_excepcional = TRUE OR (ph_inicial BETWEEN 3.80 AND 7.20)),

    CONSTRAINT chk_ensayo_ph_objetivo
        CHECK (es_excepcional = TRUE OR (ph_objetivo BETWEEN 3.80 AND 7.20)),

    CONSTRAINT chk_ensayo_viscosidad_final
        CHECK (viscosidad_final_mpas IS NULL OR es_excepcional = TRUE OR (viscosidad_final_mpas BETWEEN 50.00 AND 5500.00)),

    CONSTRAINT chk_ensayo_brix_final
        CHECK (indice_refraccion_final_brix IS NULL OR es_excepcional = TRUE OR (indice_refraccion_final_brix BETWEEN 3.00 AND 18.00)),

    CONSTRAINT chk_ensayo_estado
        CHECK (estado IN ('en_preparacion', 'en_ejecucion', 'en_proceso', 'EN_CURSO', 'finalizado', 'completado', 'archivado', 'cancelado'))
);

COMMENT ON TABLE ensayos IS 'Lotes experimentales de fermentación láctica con parámetros de incubación, modelo Hill (t50, gamma), reología Brookfield y estado del ciclo de vida.';

-- Trigger para normalizar código/nombre_lote y sincronizar masa/porcentaje de inóculo antes de insertar o actualizar
CREATE OR REPLACE FUNCTION fn_normalizar_ensayo()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.codigo IS NULL OR BTRIM(NEW.codigo) = '') AND NEW.nombre_lote IS NOT NULL THEN
        NEW.codigo := BTRIM(NEW.nombre_lote);
    END IF;

    IF (NEW.nombre_lote IS NULL OR BTRIM(NEW.nombre_lote) = '') AND NEW.codigo IS NOT NULL THEN
        NEW.nombre_lote := BTRIM(NEW.codigo);
    END IF;

    IF NEW.volumen_ml IS NULL AND NEW.masa_solucion_g IS NOT NULL THEN
        NEW.volumen_ml := NEW.masa_solucion_g;
    ELSIF NEW.masa_solucion_g IS NULL AND NEW.volumen_ml IS NOT NULL THEN
        NEW.masa_solucion_g := NEW.volumen_ml;
    END IF;

    IF NEW.masa_inoculo_g IS NULL AND NEW.porcentaje_inoculo IS NOT NULL AND NEW.masa_solucion_g > 0 THEN
        NEW.masa_inoculo_g := ROUND((NEW.porcentaje_inoculo / 100.0) * NEW.masa_solucion_g, 2);
    ELSIF NEW.porcentaje_inoculo IS NULL AND NEW.masa_inoculo_g IS NOT NULL AND NEW.masa_solucion_g > 0 THEN
        NEW.porcentaje_inoculo := ROUND((NEW.masa_inoculo_g / NEW.masa_solucion_g) * 100.0, 2);
    END IF;

    IF NEW.tiempo_corte_estimado_minutos IS NULL AND NEW.tiempo_corte_estimado_horas IS NOT NULL THEN
        NEW.tiempo_corte_estimado_minutos := ROUND(NEW.tiempo_corte_estimado_horas * 60);
    END IF;

    IF NEW.tiempo_corte_inicial_minutos IS NULL AND NEW.tiempo_corte_inicial_horas IS NOT NULL THEN
        NEW.tiempo_corte_inicial_minutos := ROUND(NEW.tiempo_corte_inicial_horas * 60);
    END IF;

    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensayos_normalizar
BEFORE INSERT OR UPDATE ON ensayos
FOR EACH ROW
EXECUTE FUNCTION fn_normalizar_ensayo();

-- =============================================================================
-- 7. TABLA: lecturas_ensayo (5.3)
-- =============================================================================
CREATE TABLE lecturas_ensayo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ensayo_id UUID NOT NULL,
    tiempo_minutos INTEGER NOT NULL,
    minutos INTEGER GENERATED ALWAYS AS (tiempo_minutos) STORED,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 1) NOT NULL,
    indice_refraccion_brix NUMERIC(5, 2) NULL,
    indice_refraccion NUMERIC(5, 2) GENERATED ALWAYS AS (indice_refraccion_brix) STORED,
    es_excepcional BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT NULL,
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lectura_ensayo
        FOREIGN KEY (ensayo_id)
        REFERENCES ensayos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_ensayo_tiempo_minutos
        UNIQUE (ensayo_id, tiempo_minutos),

    CONSTRAINT chk_lectura_tiempo_rango
        CHECK (es_excepcional = TRUE OR (tiempo_minutos BETWEEN 0 AND 720)),

    CONSTRAINT chk_lectura_ph_rango
        CHECK (es_excepcional = TRUE OR (ph BETWEEN 3.80 AND 7.20)),

    CONSTRAINT chk_lectura_temperatura_rango
        CHECK (es_excepcional = TRUE OR (temperatura BETWEEN 20.0 AND 52.0)),

    CONSTRAINT chk_lectura_brix_rango
        CHECK (indice_refraccion_brix IS NULL OR es_excepcional = TRUE OR (indice_refraccion_brix BETWEEN 3.00 AND 18.00))
);

COMMENT ON TABLE lecturas_ensayo IS 'Serie temporal de mediciones experimentales de laboratorio (pH, temperatura de baño y grados Brix) vinculadas a cada ensayo.';

-- =============================================================================
-- 8. TABLA: predicciones (5.4)
-- =============================================================================
CREATE TABLE predicciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sqlite_id INTEGER UNIQUE NULL,
    ensayo_id UUID NULL,
    lote_codigo VARCHAR(80) NOT NULL DEFAULT 'LOTE-SIM',
    usuario_id UUID NULL,
    investigador VARCHAR(150) NOT NULL DEFAULT 'Lab. Química de Alimentos — ULEAM',
    modelo_utilizado VARCHAR(100) NOT NULL DEFAULT 'Hill Sigmoidal + IDW (Calibración ULEAM)',
    tipo_sustrato VARCHAR(50) NOT NULL DEFAULT 'vaca',
    tipo_azucar VARCHAR(50) NOT NULL DEFAULT 'lactosa',
    ph_inicial NUMERIC(4, 2) NOT NULL DEFAULT 6.25,
    ph_final_estimado NUMERIC(4, 2) NOT NULL DEFAULT 4.50,
    temperatura_c NUMERIC(4, 1) NOT NULL,
    porcentaje_inoculo NUMERIC(5, 2) NOT NULL,
    masa_inoculo_g NUMERIC(8, 2) NOT NULL,
    volumen_ml NUMERIC(8, 2) NOT NULL DEFAULT 250.00,
    parametro_t50 NUMERIC(6, 2) NULL,
    parametro_gamma NUMERIC(5, 2) NULL,
    tiempo_corte_horas NUMERIC(6, 2) NULL,
    tiempo_corte_minutos INTEGER NULL,
    viscosidad_predicha_mpas NUMERIC(8, 2) NULL,
    calidad_gel VARCHAR(100) NULL,
    diagnostico TEXT NULL,
    metricas_modelo JSONB NOT NULL DEFAULT '{"r2": 0.9774, "rmse": 0.0961, "mae": 0.0773}'::jsonb,
    datos_entrada JSONB NOT NULL DEFAULT '{}'::jsonb,
    resultado_prediccion JSONB NOT NULL DEFAULT '{}'::jsonb,
    ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediccion_ensayo
        FOREIGN KEY (ensayo_id)
        REFERENCES ensayos(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_prediccion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_prediccion_ph
        CHECK (ph_inicial BETWEEN 3.80 AND 7.20 AND ph_final_estimado BETWEEN 3.80 AND 7.20),

    CONSTRAINT chk_prediccion_temperatura
        CHECK (temperatura_c BETWEEN 20.0 AND 52.0),

    CONSTRAINT chk_prediccion_inoculo
        CHECK (porcentaje_inoculo BETWEEN 0.50 AND 15.00 AND masa_inoculo_g > 0),

    CONSTRAINT chk_prediccion_volumen
        CHECK (volumen_ml BETWEEN 50.00 AND 5000.00),

    CONSTRAINT chk_prediccion_viscosidad
        CHECK (viscosidad_predicha_mpas IS NULL OR (viscosidad_predicha_mpas BETWEEN 50.00 AND 5500.00))
);

COMMENT ON TABLE predicciones IS 'Historial de simulaciones What-If y predicciones ejecutadas por el motor biofísico de Hill.';

-- =============================================================================
-- 9. TABLA: dataset_retroalimentacion (5.5)
-- =============================================================================
CREATE TABLE dataset_retroalimentacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sqlite_id INTEGER UNIQUE NULL,
    ensayo_origen_id UUID NULL,
    lote_codigo VARCHAR(80) NOT NULL,
    usuario_responsable_id UUID NULL,
    temperatura_incubacion_c NUMERIC(4, 1) NOT NULL,
    porcentaje_inoculo NUMERIC(5, 2) NOT NULL,
    masa_inoculo_g NUMERIC(8, 2) NOT NULL,
    volumen_ml NUMERIC(8, 2) NOT NULL DEFAULT 250.00,
    tiempo_minutos INTEGER NOT NULL,
    tiempo_horas NUMERIC(6, 2) NOT NULL,
    ph_real NUMERIC(4, 2) NOT NULL,
    temperatura_real_medida NUMERIC(4, 1) NULL,
    indice_refraccion_real NUMERIC(5, 2) NULL,
    viscosidad_final_real NUMERIC(8, 2) NULL,
    variables_entrada JSONB NOT NULL DEFAULT '{}'::jsonb,
    resultados_reales JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado_validacion VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    incorporado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_ensayo
        FOREIGN KEY (ensayo_origen_id)
        REFERENCES ensayos(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_feedback_usuario
        FOREIGN KEY (usuario_responsable_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT uq_feedback_lote_minuto
        UNIQUE (lote_codigo, tiempo_minutos),

    CONSTRAINT chk_feedback_estado_validacion
        CHECK (estado_validacion IN ('pendiente', 'validado', 'rechazado', 'referencia_oficial')),

    CONSTRAINT chk_feedback_temperatura
        CHECK (temperatura_incubacion_c BETWEEN 20.0 AND 52.0),

    CONSTRAINT chk_feedback_inoculo
        CHECK (porcentaje_inoculo BETWEEN 0.50 AND 15.00 AND masa_inoculo_g > 0),

    CONSTRAINT chk_feedback_tiempo
        CHECK (tiempo_minutos BETWEEN 0 AND 720),

    CONSTRAINT chk_feedback_ph_real
        CHECK (ph_real BETWEEN 3.80 AND 7.20),

    CONSTRAINT chk_feedback_brix_real
        CHECK (indice_refraccion_real IS NULL OR (indice_refraccion_real BETWEEN 3.00 AND 18.00)),

    CONSTRAINT chk_feedback_viscosidad_real
        CHECK (viscosidad_final_real IS NULL OR (viscosidad_final_real BETWEEN 50.00 AND 5500.00))
);

COMMENT ON TABLE dataset_retroalimentacion IS 'Muestras experimentales reales incorporadas mediante Feedback Loop con control de validación científica para evitar mezclar datos no verificados con la referencia oficial.';

-- =============================================================================
-- 10. TABLA: auditoria_operaciones (5.6)
-- =============================================================================
CREATE TABLE auditoria_operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NULL,
    usuario_email VARCHAR(150) NULL,
    accion VARCHAR(60) NOT NULL,
    entidad_afectada VARCHAR(60) NOT NULL,
    registro_afectado_id VARCHAR(100) NULL,
    datos_anteriores JSONB NULL,
    datos_posteriores JSONB NULL,
    informacion_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb,
    fecha_evento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

COMMENT ON TABLE auditoria_operaciones IS 'Registro inmutable de auditoría de seguridad y trazabilidad de operaciones críticas (sin almacenar contraseñas, tokens JWT ni secretos).';

-- =============================================================================
-- 11. TABLA: sincronizacion_historial (5.7 / Sección 10)
-- =============================================================================
CREATE TABLE sincronizacion_historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad VARCHAR(60) NOT NULL,
    clave_unica VARCHAR(120) NOT NULL,
    sqlite_id INTEGER NULL,
    neon_uuid UUID NULL,
    operacion VARCHAR(30) NOT NULL DEFAULT 'UPSERT',
    estado VARCHAR(25) NOT NULL DEFAULT 'SINCRONIZADO',
    detalle_error TEXT NULL,
    sincronizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sincronizacion_operacion
        CHECK (operacion IN ('INSERT', 'UPDATE', 'UPSERT', 'CONFLICT', 'ERROR')),
    CONSTRAINT chk_sincronizacion_estado
        CHECK (estado IN ('SINCRONIZADO', 'PENDIENTE', 'CONFLICTO', 'FALLIDO'))
);

COMMENT ON TABLE sincronizacion_historial IS 'Trazabilidad de sincronización controlada entre el motor local SQLite (offline-first) y la base de datos central Neon PostgreSQL.';

-- =============================================================================
-- 12. ÍNDICES DE RENDIMIENTO PARA CONSULTAS FRECUENTES
-- =============================================================================
CREATE INDEX idx_usuarios_email_lower ON usuarios (LOWER(email));
CREATE INDEX idx_usuarios_username_lower ON usuarios (LOWER(username));
CREATE INDEX idx_usuarios_rol ON usuarios (rol);

CREATE INDEX idx_ensayos_usuario_id ON ensayos (usuario_id);
CREATE INDEX idx_ensayos_usuario_email_lower ON ensayos (LOWER(usuario_email));
CREATE INDEX idx_ensayos_estado ON ensayos (estado);
CREATE INDEX idx_ensayos_sustrato_temp ON ensayos (tipo_sustrato, temperatura_incubacion, porcentaje_inoculo);
CREATE INDEX idx_ensayos_created_at_desc ON ensayos (created_at DESC);
CREATE INDEX idx_ensayos_referencia ON ensayos (es_referencia_cientifica) WHERE es_referencia_cientifica = TRUE;

CREATE INDEX idx_lecturas_ensayo_tiempo ON lecturas_ensayo (ensayo_id, tiempo_minutos ASC);

CREATE INDEX idx_predicciones_lote_codigo ON predicciones (lote_codigo);
CREATE INDEX idx_predicciones_ejecutado_en_desc ON predicciones (ejecutado_en DESC);
CREATE INDEX idx_predicciones_usuario_id ON predicciones (usuario_id);

CREATE INDEX idx_feedback_lote_codigo ON dataset_retroalimentacion (lote_codigo);
CREATE INDEX idx_feedback_estado_validacion ON dataset_retroalimentacion (estado_validacion);

CREATE INDEX idx_auditoria_fecha_desc ON auditoria_operaciones (fecha_evento DESC);
CREATE INDEX idx_auditoria_entidad_accion ON auditoria_operaciones (entidad_afectada, accion);
CREATE INDEX idx_auditoria_usuario_id ON auditoria_operaciones (usuario_id);

CREATE INDEX idx_sincronizacion_entidad_clave ON sincronizacion_historial (entidad, clave_unica);

COMMIT;
