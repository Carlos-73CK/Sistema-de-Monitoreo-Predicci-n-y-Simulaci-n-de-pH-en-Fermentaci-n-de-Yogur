-- =============================================================================
-- PROYECTO: PrediYogur - Sistema de Monitoreo, Predicción y Simulación de pH
-- AUTOR: Alex Patiño (Administración de Base de Datos)
-- DESCRIPCIÓN: Script inicial de creación de esquema, tablas, restricciones e índices.
-- =============================================================================

-- Habilitar extensión para generación de UUID v4 si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLA: usuarios
-- =============================================================================
DROP TABLE IF EXISTS lecturas_ensayo CASCADE;
DROP TABLE IF EXISTS ensayos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL, -- Almacena hash cifrado con bcrypt
    rol VARCHAR(30) NOT NULL DEFAULT 'estudiante',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de integridad
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('docente', 'estudiante', 'investigador')),
    CONSTRAINT chk_usuario_correo_valido CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE usuarios IS 'Tabla para el registro, autenticación y roles del personal del proyecto';
COMMENT ON COLUMN usuarios.contrasena IS 'Hash de contraseña generado en backend mediante bcrypt';

-- =============================================================================
-- 2. TABLA: ensayos
-- =============================================================================
CREATE TABLE ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL,
    nombre_lote VARCHAR(100) NOT NULL,
    tipo_leche VARCHAR(50) NOT NULL,
    tipo_azucar VARCHAR(50) NOT NULL,
    masa_leche NUMERIC(8, 2) NOT NULL,      -- Expresado en gramos o mililitros
    masa_inoculo NUMERIC(8, 2) NOT NULL,    -- Expresado en gramos (yogur Chivería)
    temperatura_objetivo NUMERIC(4, 2) NOT NULL DEFAULT 42.00, -- Rango típico de operación: 42.0 °C
    estado VARCHAR(20) NOT NULL DEFAULT 'en_proceso',
    viscosidad_final NUMERIC(10, 2) NULL,   -- Medición al alcanzar pH 4.5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Claves Foráneas
    CONSTRAINT fk_ensayo_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,

    -- Restricciones de Integridad y Dominio
    CONSTRAINT chk_tipo_leche CHECK (tipo_leche IN ('vaca', 'vegetal_chocho', 'vegetal_coco', 'otra')),
    CONSTRAINT chk_tipo_azucar CHECK (tipo_azucar IN ('lactosa', 'sacarosa', 'glucosa')),
    CONSTRAINT chk_estado CHECK (estado IN ('en_proceso', 'completado', 'cancelado')),
    CONSTRAINT chk_masas_positivas CHECK (masa_leche > 0 AND masa_inoculo > 0),
    CONSTRAINT chk_temp_objetivo_rango CHECK (temperatura_objetivo BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_viscosidad_positiva CHECK (viscosidad_final IS NULL OR viscosidad_final >= 0)
);

COMMENT ON TABLE ensayos IS 'Registra cada lote experimental de acidificación y fermentación de yogur';

-- =============================================================================
-- 3. TABLA: lecturas_ensayo
-- =============================================================================
CREATE TABLE lecturas_ensayo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ensayo_id UUID NOT NULL,
    tiempo_minutos INTEGER NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Claves Foráneas con eliminación en cascada para mantener coherencia referencial
    CONSTRAINT fk_lectura_ensayo 
        FOREIGN KEY (ensayo_id) 
        REFERENCES ensayos(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    -- Restricciones de Integridad Físico-Química
    CONSTRAINT chk_tiempo_no_negativo CHECK (tiempo_minutos >= 0),
    CONSTRAINT chk_ph_rango CHECK (ph BETWEEN 0.00 AND 14.00),
    CONSTRAINT chk_temperatura_positiva CHECK (temperatura > 0.00),
    CONSTRAINT uq_ensayo_tiempo UNIQUE (ensayo_id, tiempo_minutos) -- Unicidad de tiempo por ensayo
);

COMMENT ON TABLE lecturas_ensayo IS 'Serie temporal de mediciones de pH y temperatura durante cada ensayo';

-- =============================================================================
-- 4. ÍNDICES DE RENDIMIENTO (Búsquedas frecuentes)
-- =============================================================================

-- Optimización de consultas de lecturas por lote y orden cronológico
CREATE INDEX idx_lecturas_ensayo_id ON lecturas_ensayo(ensayo_id);
CREATE INDEX idx_lecturas_tiempo ON lecturas_ensayo(ensayo_id, tiempo_minutos ASC);

-- Optimización de búsquedas de ensayos por usuario y fecha de creación
CREATE INDEX idx_ensayos_usuario_id ON ensayos(usuario_id);
CREATE INDEX idx_ensayos_created_at ON ensayos(created_at DESC);
CREATE INDEX idx_ensayos_estado ON ensayos(estado);