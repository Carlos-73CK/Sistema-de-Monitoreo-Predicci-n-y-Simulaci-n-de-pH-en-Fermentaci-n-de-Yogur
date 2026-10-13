-- =============================================================================
-- PROYECTO: PrediYogur - Sistema de Monitoreo, Predicción y Simulación de pH
-- AUTOR: Alex Patiño (Administración de Base de Datos)
-- DESCRIPCIÓN: Script de creación de esquema relacional, tablas, restricciones e índices.
-- =============================================================================

-- Habilitar extensión para generación de UUID v4 si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza previa en orden de dependencia inversa
DROP TABLE IF EXISTS lecturas CASCADE;
DROP TABLE IF EXISTS ensayos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================================================
-- 1. TABLA: usuarios
-- =============================================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacena hash cifrado con bcrypt
    rol VARCHAR(30) NOT NULL DEFAULT 'estudiante',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de integridad
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('docente', 'estudiante', 'investigador')),
    CONSTRAINT chk_usuario_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE usuarios IS 'Tabla para el registro, autenticación y roles del personal del proyecto';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash de contraseña generado en backend mediante bcrypt';

-- =============================================================================
-- 2. TABLA: ensayos
-- =============================================================================
CREATE TABLE ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    tipo_sustrato VARCHAR(50) NOT NULL,
    masa_inoculo_g NUMERIC(6, 2) NOT NULL, -- Expresado en gramos (yogur Chivería)
    temperatura_objetivo NUMERIC(4, 1) NOT NULL DEFAULT 42.0, -- Control térmico óptimo en baño maría
    volumen_ml NUMERIC(6, 2) NOT NULL DEFAULT 1000.0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_proceso',
    viscosidad_final NUMERIC(8, 2) NULL, -- Obligatorio al alcanzar pH 4.5 (en mPa·s)
    observaciones TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE NULL,

    -- Claves Foráneas
    CONSTRAINT fk_ensayo_usuario 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,

    -- Restricciones de Integridad y Dominio
    CONSTRAINT chk_estado_ensayo CHECK (estado IN ('en_proceso', 'finalizado', 'cancelado')),
    CONSTRAINT chk_masa_inoculo_positiva CHECK (masa_inoculo_g > 0),
    CONSTRAINT chk_volumen_positivo CHECK (volumen_ml > 0),
    CONSTRAINT chk_temp_objetivo_rango CHECK (temperatura_objetivo BETWEEN 0.0 AND 100.0),
    CONSTRAINT chk_viscosidad_final CHECK (viscosidad_final IS NULL OR viscosidad_final >= 0)
);

COMMENT ON TABLE ensayos IS 'Registra cada lote experimental de acidificación y fermentación de yogur';

-- =============================================================================
-- 3. TABLA: lecturas
-- =============================================================================
CREATE TABLE lecturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ensayo_id UUID NOT NULL,
    minutos INTEGER NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Claves Foráneas con eliminación en cascada
    CONSTRAINT fk_lectura_ensayo 
        FOREIGN KEY (ensayo_id) 
        REFERENCES ensayos(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    -- Restricciones de Integridad Físico-Química
    CONSTRAINT chk_minutos_no_negativos CHECK (minutos >= 0),
    CONSTRAINT chk_ph_rango CHECK (ph BETWEEN 2.00 AND 9.00), -- Rango operativo seguro para fermentación
    CONSTRAINT chk_temperatura_positiva CHECK (temperatura > 0.0),
    CONSTRAINT uq_ensayo_minutos UNIQUE (ensayo_id, minutos) -- Unicidad de tiempo por ensayo
);

COMMENT ON TABLE lecturas IS 'Serie temporal de mediciones cinéticas (minutos, pH, temperatura) durante cada ensayo';

-- =============================================================================
-- 4. ÍNDICES DE RENDIMIENTO (Búsquedas frecuentes)
-- =============================================================================
CREATE INDEX idx_ensayos_usuario_id ON ensayos(usuario_id);
CREATE INDEX idx_lecturas_ensayo_minutos ON lecturas(ensayo_id, minutos ASC);