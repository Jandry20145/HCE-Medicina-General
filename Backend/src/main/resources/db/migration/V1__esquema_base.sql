-- Esquema base de HCE Medicina General.
-- Coincide con el de las instalaciones anteriores a Flyway (ordenado.sql + columnas que
-- añadía Hibernate). En esas bases Flyway marca esta versión como aplicada sin ejecutarla.

CREATE TABLE IF NOT EXISTS pacientes (
  id_paciente INT NOT NULL AUTO_INCREMENT,
  numero_historia_clinica VARCHAR(50) NOT NULL,
  cedula_identidad VARCHAR(20) NOT NULL,
  nombres_completos VARCHAR(100) NOT NULL,
  apellidos_completos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
  estado_civil VARCHAR(50) NULL,
  ocupacion VARCHAR(100) NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(20) NULL,
  correo_electronico VARCHAR(100) NULL,
  seguro_salud VARCHAR(100) NULL,
  PRIMARY KEY (id_paciente),
  UNIQUE KEY numero_historia_clinica (numero_historia_clinica),
  UNIQUE KEY cedula_identidad (cedula_identidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS antecedentes (
  id_antecedente INT NOT NULL AUTO_INCREMENT,
  id_paciente INT NOT NULL,
  tipo_antecedente ENUM('Patologico Personal', 'No Patologico Personal', 'Familiar') NOT NULL,
  enfermedad_asociada VARCHAR(150) NOT NULL,
  parentesco_familiar VARCHAR(50) NULL,
  alergias_principales TEXT NULL,
  descripcion_adicional TEXT NULL,
  PRIMARY KEY (id_antecedente),
  KEY fk_antecedentes_paciente (id_paciente),
  CONSTRAINT fk_antecedentes_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS catalogo_cie10 (
  id_cie10 INT NOT NULL AUTO_INCREMENT,
  codigo_cie VARCHAR(20) NOT NULL,
  nombre_enfermedad VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_cie10),
  UNIQUE KEY codigo_cie (codigo_cie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS catalogo_medicamentos (
  id_medicamento INT NOT NULL AUTO_INCREMENT,
  codigo_medicamento VARCHAR(50) NOT NULL,
  nombre_generico VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_medicamento),
  UNIQUE KEY codigo_medicamento (codigo_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS historia_clinica (
  id_history_clinica INT NOT NULL AUTO_INCREMENT,
  id_paciente INT NOT NULL,
  fecha_apertura DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  estado_expediente VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_history_clinica),
  UNIQUE KEY id_paciente (id_paciente),
  CONSTRAINT fk_historia_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('Admision', 'Enfermeria', 'Medico') NOT NULL,
  nombres_completos VARCHAR(150) NOT NULL,
  estado TINYINT(1) NULL DEFAULT 1,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS consulta_medica (
  id_consulta INT NOT NULL AUTO_INCREMENT,
  id_historia_clinica INT NOT NULL,
  id_medico INT NOT NULL,
  fecha_hora_atencion DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  motivo_consulta TEXT NOT NULL,
  enfermedad_actual TEXT NULL,
  evolucion TEXT NULL,
  recomendaciones TEXT NULL,
  proximo_control DATE NULL,
  estado_consulta VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_consulta),
  KEY fk_consulta_historia (id_historia_clinica),
  KEY fk_consulta_medico (id_medico),
  CONSTRAINT fk_consulta_historia FOREIGN KEY (id_historia_clinica) REFERENCES historia_clinica (id_history_clinica)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS diagnosticos (
  id_diagnostic INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  id_cie10 INT NOT NULL,
  tipo_diagnostico ENUM('Presuntivo', 'Definitivo') NOT NULL,
  condicion_diagnostico ENUM('Principal', 'Secundario') NOT NULL DEFAULT 'Principal',
  descripcion_clinica TEXT NULL,
  PRIMARY KEY (id_diagnostic),
  KEY fk_diagnosticos_consulta (id_consulta),
  KEY fk_diagnosticos_cie10 (id_cie10),
  CONSTRAINT fk_diagnosticos_cie10 FOREIGN KEY (id_cie10) REFERENCES catalogo_cie10 (id_cie10)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_diagnosticos_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS examen_fisico (
  id_examen INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  region_anatomica VARCHAR(100) NOT NULL,
  hallazgos TEXT NOT NULL,
  PRIMARY KEY (id_examen),
  KEY fk_examen_consulta (id_consulta),
  CONSTRAINT fk_examen_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS signos_vitales (
  id_signos INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  id_enfermero INT NOT NULL,
  temperatura DECIMAL(4,2) NULL,
  presion_arterial VARCHAR(20) NULL,
  pulso INT NULL,
  frecuencia_respiratoria INT NULL,
  peso_kg DECIMAL(5,2) NULL,
  talla_cm DECIMAL(5,2) NULL,
  grupo_sanguineo VARCHAR(10) NULL,
  PRIMARY KEY (id_signos),
  KEY fk_signos_consulta (id_consulta),
  KEY fk_signos_enfermero (id_enfermero),
  CONSTRAINT fk_signos_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_signos_enfermero FOREIGN KEY (id_enfermero) REFERENCES usuarios (id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tratamientos (
  id_tratamiento INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  id_medicamento INT NULL,
  nombre_medicamento VARCHAR(255) NULL,
  indicaciones_dosis TEXT NOT NULL,
  fecha_hora_registro DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_tratamiento),
  KEY fk_tratamientos_consulta (id_consulta),
  KEY fk_tratamientos_medicamento (id_medicamento),
  CONSTRAINT fk_tratamientos_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tratamientos_medicamento FOREIGN KEY (id_medicamento) REFERENCES catalogo_medicamentos (id_medicamento)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
