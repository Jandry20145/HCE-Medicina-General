-- Tres roles (Admin, Enfermería, Médico), agenda, triaje de enfermería, firma con bloqueo,
-- adendas, receta estructurada, órdenes, certificados, procedimientos y configuración.
-- Ver docs/ESPECIFICACION_HCE_ECUADOR.md.

-- ---------- Roles ----------
-- Admisión pasa a Enfermería (admisión y atención primaria).
ALTER TABLE usuarios MODIFY rol ENUM('Admin', 'Admision', 'Enfermeria', 'Medico') NOT NULL;
UPDATE usuarios SET rol = 'Enfermeria' WHERE rol = 'Admision';
ALTER TABLE usuarios MODIFY rol ENUM('Admin', 'Enfermeria', 'Medico') NOT NULL;
-- Registro profesional (MSP/Senescyt) que se imprime en recetas y certificados.
ALTER TABLE usuarios ADD COLUMN registro_profesional VARCHAR(50) NULL;

-- ---------- Configuración del establecimiento (una sola fila) ----------
CREATE TABLE configuracion (
  id INT NOT NULL,
  nombre_establecimiento VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(30) NULL,
  hora_apertura TIME NOT NULL,
  hora_cierre TIME NOT NULL,
  duracion_cita_min INT NOT NULL,
  pie_documentos VARCHAR(500) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO configuracion (id, nombre_establecimiento, hora_apertura, hora_cierre, duracion_cita_min)
VALUES (1, 'Consultorio de Medicina General', '08:00:00', '17:00:00', 20);

-- ---------- Agenda ----------
CREATE TABLE citas (
  id_cita INT NOT NULL AUTO_INCREMENT,
  id_paciente INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  duracion_min INT NOT NULL,
  motivo VARCHAR(255) NULL,
  estado VARCHAR(20) NOT NULL,
  llegada_en DATETIME NULL,
  id_consulta INT NULL,
  creada_por VARCHAR(50) NOT NULL,
  creada_en DATETIME NOT NULL,
  PRIMARY KEY (id_cita),
  KEY idx_citas_fecha (fecha_hora),
  KEY fk_citas_paciente (id_paciente),
  CONSTRAINT fk_citas_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente),
  CONSTRAINT fk_citas_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- Consulta: triaje, borrador y firma ----------
-- En triaje todavía no hay médico.
ALTER TABLE consulta_medica MODIFY id_medico INT NULL;
ALTER TABLE consulta_medica
  ADD COLUMN revision_sistemas TEXT NULL,
  ADD COLUMN nota_enfermeria TEXT NULL,
  ADD COLUMN alergias_reportadas VARCHAR(500) NULL,
  ADD COLUMN firmada_en DATETIME NULL;
-- Las consultas anteriores se guardaban de una vez y ya no se editaban: equivalen a firmadas.
UPDATE consulta_medica SET estado_consulta = 'Firmada', firmada_en = fecha_hora_atencion
WHERE estado_consulta = 'Finalizada';

CREATE TABLE adendas (
  id_adenda INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  texto TEXT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  autor VARCHAR(50) NOT NULL,
  fecha DATETIME NOT NULL,
  PRIMARY KEY (id_adenda),
  KEY fk_adendas_consulta (id_consulta),
  CONSTRAINT fk_adendas_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- Receta estructurada (AM 00031-2020, ver especificación §7) ----------
ALTER TABLE tratamientos
  ADD COLUMN forma_farmaceutica VARCHAR(60) NULL,
  ADD COLUMN concentracion VARCHAR(60) NULL,
  ADD COLUMN dosis VARCHAR(60) NULL,
  ADD COLUMN via VARCHAR(40) NULL,
  ADD COLUMN frecuencia VARCHAR(60) NULL,
  ADD COLUMN duracion VARCHAR(60) NULL,
  ADD COLUMN cantidad VARCHAR(40) NULL;

-- ---------- Órdenes ----------
CREATE TABLE ordenes (
  id_orden INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  indicacion VARCHAR(500) NULL,
  prioridad VARCHAR(10) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  resultado TEXT NULL,
  resultado_en DATETIME NULL,
  revisada_por VARCHAR(50) NULL,
  PRIMARY KEY (id_orden),
  KEY fk_ordenes_consulta (id_consulta),
  CONSTRAINT fk_ordenes_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- Certificados ----------
CREATE TABLE certificados (
  id_certificado INT NOT NULL AUTO_INCREMENT,
  id_consulta INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  dias_reposo INT NULL,
  desde DATE NULL,
  hasta DATE NULL,
  observaciones TEXT NULL,
  emitido_por VARCHAR(50) NOT NULL,
  emitido_en DATETIME NOT NULL,
  PRIMARY KEY (id_certificado),
  KEY fk_certificados_consulta (id_consulta),
  CONSTRAINT fk_certificados_consulta FOREIGN KEY (id_consulta) REFERENCES consulta_medica (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- Procedimientos de enfermería ----------
CREATE TABLE procedimientos_enfermeria (
  id_procedimiento INT NOT NULL AUTO_INCREMENT,
  id_paciente INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  realizado_por VARCHAR(50) NOT NULL,
  fecha DATETIME NOT NULL,
  PRIMARY KEY (id_procedimiento),
  KEY fk_procedimientos_paciente (id_paciente),
  CONSTRAINT fk_procedimientos_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
