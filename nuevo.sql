CREATE DATABASE IF NOT EXISTS hce_reto;
USE hce_reto;

-- ========================================================
-- 1. Tabla: USUARIOS
-- ========================================================
CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('Admision', 'Enfermeria', 'Medico') NOT NULL,
    nombres_completos VARCHAR(150) NOT NULL,
    estado TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id_usuario)
) ENGINE=InnoDB;

-- ========================================================
-- 2. Tabla: PACIENTES (Maestro Principal)
-- ========================================================
CREATE TABLE PACIENTES (
    id_paciente INT AUTO_INCREMENT,
    numero_historia_clinica VARCHAR(50) NOT NULL UNIQUE,
    cedula_identidad VARCHAR(20) NOT NULL UNIQUE,
    nombres_completos VARCHAR(100) NOT NULL,
    apellidos_completos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
    seguro_salud VARCHAR(100),
    PRIMARY KEY (id_paciente)
) ENGINE=InnoDB;

-- ========================================================
-- 3. Tabla: HISTORIA_CLINICA (Expediente - 1 a 1 con Paciente)
-- ========================================================
CREATE TABLE HISTORIA_CLINICA (
    id_history_clinica INT AUTO_INCREMENT,
    id_paciente INT NOT NULL UNIQUE, 
    fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_expediente VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_history_clinica),
    CONSTRAINT fk_historia_paciente FOREIGN KEY (id_paciente) 
        REFERENCES PACIENTES(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 4. Tabla: ANTECEDENTES (Estructura Plana / Texto Libre)
-- ========================================================
CREATE TABLE ANTECEDENTES (
    id_antecedente INT AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    tipo_antecedente ENUM('Patologico Personal', 'No Patologico Personal', 'Familiar') NOT NULL,
    enfermedad_asociada VARCHAR(150) NOT NULL,
    parentesco_familiar VARCHAR(50) DEFAULT NULL, 
    alergias_principales TEXT,
    descripcion_adicional TEXT, 
    PRIMARY KEY (id_antecedente),
    CONSTRAINT fk_antecedentes_paciente FOREIGN KEY (id_paciente) 
        REFERENCES PACIENTES(id_paciente) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 5. Tabla: CONSULTA_MEDICA (Maestro Operativo) CORREGIDA
-- ========================================================
CREATE TABLE CONSULTA_MEDICA (
    id_consulta INT AUTO_INCREMENT,
    id_historia_clinica INT NOT NULL,
    id_medico INT NOT NULL,
    fecha_hora_atencion DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_consulta TEXT NOT NULL,
    enfermedad_actual TEXT,
    evolucion TEXT,
    recomendaciones TEXT,
    proximo_control DATE,
    estado_consulta VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_consulta),
    CONSTRAINT fk_consulta_historia FOREIGN KEY (id_historia_clinica) 
        REFERENCES HISTORIA_CLINICA(id_history_clinica) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico) 
        REFERENCES USUARIOS(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 6. Tabla: SIGNOS_VITALES (Detalle Consulta - CORREGIDA)
-- ========================================================
CREATE TABLE SIGNOS_VITALES (
    id_signos INT AUTO_INCREMENT,
    id_consulta INT NOT NULL,
    id_enfermero INT NOT NULL,
    temperatura DECIMAL(4,2),
    presion_arterial VARCHAR(20),
    pulso INT,
    frecuencia_respiratoria INT,
    peso_kg DECIMAL(5,2),
    talla_cm DECIMAL(5,2),
    grupo_sanguineo VARCHAR(10),
    PRIMARY KEY (id_signos),
    CONSTRAINT fk_signos_consulta FOREIGN KEY (id_consulta) 
        REFERENCES CONSULTA_MEDICA(id_consulta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_signos_enfermero FOREIGN KEY (id_enfermero) 
        REFERENCES USUARIOS(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 7. Tabla: EXAMEN_FISICO (Detalle Consulta)
-- ========================================================
CREATE TABLE EXAMEN_FISICO (
    id_examen INT AUTO_INCREMENT,
    id_consulta INT NOT NULL,
    region_anatomica VARCHAR(100) NOT NULL,
    hallazgos TEXT NOT NULL,
    PRIMARY KEY (id_examen),
    CONSTRAINT fk_examen_consulta FOREIGN KEY (id_consulta) 
        REFERENCES CONSULTA_MEDICA(id_consulta) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 8. Tabla: CATALOGO_CIE10
-- ========================================================
CREATE TABLE CATALOGO_CIE10 (
    id_cie10 INT AUTO_INCREMENT,
    codigo_cie VARCHAR(20) NOT NULL UNIQUE,
    nombre_enfermedad VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_cie10)
) ENGINE=InnoDB;

-- ========================================================
-- 9. Tabla: DIAGNOSTICOS (Tabla Puente)
-- ========================================================
CREATE TABLE DIAGNOSTICOS (
    id_diagnostic INT AUTO_INCREMENT,
    id_consulta INT NOT NULL,
    id_cie10 INT NOT NULL,
    tipo_diagnostico ENUM('Presuntivo', 'Definitivo') NOT NULL,
    condicion_diagnostico ENUM('Principal', 'Secundario') NOT NULL DEFAULT 'Principal',
    descripcion_clinica TEXT,
    PRIMARY KEY (id_diagnostic),
    CONSTRAINT fk_diagnosticos_consulta FOREIGN KEY (id_consulta) 
        REFERENCES CONSULTA_MEDICA(id_consulta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_diagnosticos_cie10 FOREIGN KEY (id_cie10) 
        REFERENCES CATALOGO_CIE10(id_cie10) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 10. Tabla: CATALOGO_MEDICAMENTOS
-- ========================================================
CREATE TABLE CATALOGO_MEDICAMENTOS (
    id_medicamento INT AUTO_INCREMENT,
    codigo_medicamento VARCHAR(50) NOT NULL UNIQUE,
    nombre_generico VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_medicamento)
) ENGINE=InnoDB;

-- ========================================================
-- 11. Tabla: TRATAMIENTOS (Tabla Puente)
-- ========================================================
CREATE TABLE TRATAMIENTOS (
    id_tratamiento INT AUTO_INCREMENT,
    id_consulta INT NOT NULL,
    id_medicamento INT DEFAULT NULL,
    nombre_medicamento VARCHAR(255) DEFAULT NULL,
    indicaciones_dosis TEXT NOT NULL,
    fecha_hora_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tratamiento),
    CONSTRAINT fk_tratamientos_consulta FOREIGN KEY (id_consulta) 
        REFERENCES CONSULTA_MEDICA(id_consulta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tratamientos_medicamento FOREIGN KEY (id_medicamento) 
        REFERENCES CATALOGO_MEDICAMENTOS(id_medicamento) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;