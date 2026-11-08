<<<<<<< HEAD
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
=======
-- =========================================================================
-- Esquema Relacional PostgreSQL - Proyecto PrediYogur (ULEAM)
-- Autor: Alex Agustín Patiño Angulo
-- Descripción: Estructura de tablas para autenticación y cinética de yogur
-- =========================================================================

-- Tabla de Usuarios con soporte multirol y autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) CHECK (rol IN ('docente', 'estudiante', 'investigador')) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Almacena los usuarios del sistema PrediYogur (Docentes, Estudiantes e Investigadores)';
COMMENT ON COLUMN usuarios.email IS 'Correo institucional único del usuario';
COMMENT ON COLUMN usuarios.rol IS 'Rol asignado para control de acceso al sistema';

-- Tabla de Ensayos / Lotes Experimentales
CREATE TABLE IF NOT EXISTS ensayos (
    id SERIAL PRIMARY KEY,
    lote_codigo VARCHAR(50) UNIQUE NOT NULL,
    temperatura_incubacion NUMERIC(5, 2) NOT NULL,
    tipo_azucar VARCHAR(30) DEFAULT 'lactosa',
    porcentaje_inoculo NUMERIC(5, 2) DEFAULT 7.50,
    tiempo_corte_inicial_horas NUMERIC(4, 2) DEFAULT 4.25,
    tiempo_corte_estimado_horas NUMERIC(4, 2) DEFAULT 4.25,
    tiempo_corte_estimado_minutos INTEGER DEFAULT 255,
    diferencia_minutos NUMERIC(6, 2) DEFAULT 0,
    usuario_email VARCHAR(150) NULL,
    viscosidad_final NUMERIC(8, 2),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_email FOREIGN KEY (usuario_email) REFERENCES usuarios(email) ON DELETE SET NULL
);

COMMENT ON TABLE ensayos IS 'Registra los lotes experimentales y parámetros cinéticos de fermentación';
COMMENT ON COLUMN ensayos.tipo_azucar IS 'Tipo de sustrato o azúcar añadido en la formulación';
COMMENT ON COLUMN ensayos.porcentaje_inoculo IS 'Porcentaje de inóculo utilizado en la siembra';
COMMENT ON COLUMN ensayos.tiempo_corte_estimado_minutos IS 'Tiempo estimado de corte del cuajo al alcanzar pH 4.50 en minutos';
COMMENT ON COLUMN ensayos.diferencia_minutos IS 'Desviación en minutos respecto al tiempo cinético ideal';
COMMENT ON COLUMN ensayos.usuario_email IS 'Vínculo con el correo del investigador responsable del ensayo';

-- Tabla de Lecturas Periódicas de Monitoreo
CREATE TABLE IF NOT EXISTS lecturas_ensayo (
    id SERIAL PRIMARY KEY,
    ensayo_id INTEGER NOT NULL REFERENCES ensayos(id) ON DELETE CASCADE,
    minutos INTEGER NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    temperatura NUMERIC(4, 1),
    indice_refraccion NUMERIC(4, 2),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ensayo_minutos UNIQUE (ensayo_id, minutos)
);

COMMENT ON TABLE lecturas_ensayo IS 'Serie temporal de mediciones cinéticas registradas durante cada ensayo';
COMMENT ON COLUMN lecturas_ensayo.indice_refraccion IS 'Medición de °Brix mediante refractómetro';

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_ensayos_usuario_email ON ensayos(usuario_email);
CREATE INDEX IF NOT EXISTS idx_lecturas_ensayo_minutos ON lecturas_ensayo(ensayo_id, minutos ASC);
>>>>>>> 841709ed51cb13ea124ea14005675e36a7e1ee7c
