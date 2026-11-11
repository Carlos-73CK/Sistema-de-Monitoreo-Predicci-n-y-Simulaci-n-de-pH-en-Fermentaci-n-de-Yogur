-- =============================================================================
-- PROYECTO: PrediYogur - Sistema de Monitoreo, Predicción y Simulación de pH
-- AUTOR: Alex Patiño (Administración de Base de Datos)
-- DESCRIPCIÓN: Esquema con soporte ampliado para sustratos, reología y refractometría.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza en orden inverso de dependencia
DROP TABLE IF EXISTS lecturas_ensayo CASCADE;
DROP TABLE IF EXISTS ensayos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================================================
-- 1. TABLA: usuarios
-- =============================================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL DEFAULT '',
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'estudiante',
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expira TIMESTAMP WITH TIME ZONE NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('docente', 'estudiante', 'investigador')),
    CONSTRAINT chk_usuario_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE usuarios IS 'Tabla para el registro, autenticación, control de fuerza bruta y roles del personal del proyecto PrediYogur';

-- =============================================================================
-- 2. TABLA: ensayos
-- =============================================================================
CREATE TABLE ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    tipo_sustrato VARCHAR(50) NOT NULL,
    tipo_azucar VARCHAR(50) NOT NULL DEFAULT 'lactosa',
    masa_solucion_g NUMERIC(8, 2) NOT NULL DEFAULT 250.00,
    porcentaje_inoculo NUMERIC(4, 2) NOT NULL,
    temperatura_objetivo NUMERIC(4, 1) NOT NULL DEFAULT 42.0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_proceso',
    viscosidad_final_mpas NUMERIC(10, 2) NULL, -- Medición Brookfield final (rotor 4, 60 rpm)
    observaciones_bioquimicas TEXT NULL,     -- Notas metodológicas (ej. Efecto Buffer)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE NULL,

    CONSTRAINT fk_ensayo_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,

    CONSTRAINT chk_tipo_sustrato CHECK (tipo_sustrato IN ('vaca', 'avena', 'almendra', 'chocho', 'coco', 'otra')),
    CONSTRAINT chk_tipo_azucar CHECK (tipo_azucar IN ('lactosa', 'sacarosa', 'glucosa', 'mezcla_sacarosa_glucosa')),
    CONSTRAINT chk_estado_ensayo CHECK (estado IN ('en_proceso', 'finalizado', 'cancelado', 'completado')),
    CONSTRAINT chk_masa_solucion CHECK (masa_solucion_g > 0),
    CONSTRAINT chk_porcentaje_inoculo CHECK (porcentaje_inoculo > 0),
    CONSTRAINT chk_temp_objetivo_rango CHECK (temperatura_objetivo BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_viscosidad_final CHECK (viscosidad_final_mpas IS NULL OR viscosidad_final_mpas >= 0)
);

COMMENT ON TABLE ensayos IS 'Registra cada lote experimental de fermentación con parámetros reológicos y de sustrato';

-- =============================================================================
-- 3. TABLA: lecturas_ensayo
-- =============================================================================
CREATE TABLE lecturas_ensayo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ensayo_id UUID NOT NULL,
    minutos INTEGER NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 1) NOT NULL,
    indice_refraccion_brix NUMERIC(5, 2) NULL, -- Lectura refractométrica (°Brix)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lectura_ensayo 
        FOREIGN KEY (ensayo_id) 
        REFERENCES ensayos(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT chk_minutos_no_negativos CHECK (minutos >= 0),
    CONSTRAINT chk_ph_rango CHECK (ph BETWEEN 0.00 AND 14.00),
    CONSTRAINT chk_temperatura_positiva CHECK (temperatura > 0.0),
    CONSTRAINT chk_brix_no_negativo CHECK (indice_refraccion_brix IS NULL OR indice_refraccion_brix >= 0.0),
    CONSTRAINT uq_ensayo_minutos UNIQUE (ensayo_id, minutos)
);

COMMENT ON TABLE lecturas_ensayo IS 'Serie temporal de mediciones cinéticas (pH, temperatura, °Brix)';

-- =============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- =============================================================================
CREATE INDEX idx_ensayos_usuario_id ON ensayos(usuario_id);
CREATE INDEX idx_lecturas_ensayo_minutos ON lecturas_ensayo(ensayo_id, minutos ASC);
