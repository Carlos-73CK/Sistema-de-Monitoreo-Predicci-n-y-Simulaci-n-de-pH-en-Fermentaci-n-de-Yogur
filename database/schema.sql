-- =============================================================================
-- PROYECTO: PrediYogur - Sistema de Monitoreo, Predicción y Simulación de pH
-- AUTOR: Alex Patiño (Administración de Base de Datos)
-- DESCRIPCIÓN: Script de esquema relacional con soporte para índice de refracción.
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
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'estudiante',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('docente', 'estudiante', 'investigador')),
    CONSTRAINT chk_usuario_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE usuarios IS 'Tabla para el registro, autenticación y roles del personal del proyecto';

-- =============================================================================
-- 2. TABLA: ensayos
-- =============================================================================
CREATE TABLE ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    tipo_sustrato VARCHAR(50) NOT NULL,
    masa_inoculo_g NUMERIC(6, 2) NOT NULL,
    temperatura_objetivo NUMERIC(4, 1) NOT NULL DEFAULT 42.0,
    volumen_ml NUMERIC(6, 2) NOT NULL DEFAULT 1000.0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_proceso',
    viscosidad_final NUMERIC(8, 2) NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE NULL,

    CONSTRAINT fk_ensayo_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,

    CONSTRAINT chk_estado_ensayo CHECK (estado IN ('en_proceso', 'finalizado', 'cancelado', 'completado')),
    CONSTRAINT chk_masa_inoculo_positiva CHECK (masa_inoculo_g > 0),
    CONSTRAINT chk_volumen_positivo CHECK (volumen_ml > 0),
    CONSTRAINT chk_temp_objetivo_rango CHECK (temperatura_objetivo BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_viscosidad_final CHECK (viscosidad_final IS NULL OR viscosidad_final >= 0)
);

COMMENT ON TABLE ensayos IS 'Registra cada lote experimental de fermentación de yogur';

-- =============================================================================
-- 3. TABLA: lecturas_ensayo (Nombre original preservado para el backend)
-- =============================================================================
CREATE TABLE lecturas_ensayo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ensayo_id UUID NOT NULL,
    minutos INTEGER NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 1) NOT NULL,
    indice_refraccion NUMERIC(4, 2) NULL, -- Incorporado según requerimiento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lectura_ensayo 
        FOREIGN KEY (ensayo_id) 
        REFERENCES ensayos(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT chk_minutos_no_negativos CHECK (minutos >= 0),
    CONSTRAINT chk_ph_rango CHECK (ph BETWEEN 0.00 AND 14.00),
    CONSTRAINT chk_temperatura_positiva CHECK (temperatura > 0.0),
    CONSTRAINT chk_refraccion_no_negativa CHECK (indice_refraccion IS NULL OR indice_refraccion >= 0.0),
    CONSTRAINT uq_ensayo_minutos UNIQUE (ensayo_id, minutos)
);

COMMENT ON TABLE lecturas_ensayo IS 'Serie temporal de mediciones cinéticas durante cada ensayo';

-- =============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- =============================================================================
CREATE INDEX idx_ensayos_usuario_id ON ensayos(usuario_id);
CREATE INDEX idx_lecturas_ensayo_minutos ON lecturas_ensayo(ensayo_id, minutos ASC);