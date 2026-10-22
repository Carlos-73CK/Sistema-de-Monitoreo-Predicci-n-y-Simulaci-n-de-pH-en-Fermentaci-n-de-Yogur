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
