-- Rol de administrador y registro de auditoría.

-- Nuevo rol Admin (gestiona usuarios y ve la auditoría).
ALTER TABLE usuarios MODIFY rol ENUM('Admin', 'Admision', 'Enfermeria', 'Medico') NOT NULL;

-- Los usuarios de demostración con clave "1234" quedan desactivados: su clave era pública.
-- No se borran porque sus consultas los referencian. El administrador puede reactivarlos
-- con una contraseña nueva desde Usuarios.
UPDATE usuarios SET estado = 0 WHERE password_hash = '1234';

-- Quién hizo qué y cuándo. No guarda datos clínicos: "detalle" lleva identificadores.
CREATE TABLE auditoria (
  id_auditoria BIGINT NOT NULL AUTO_INCREMENT,
  fecha DATETIME NOT NULL,
  usuario VARCHAR(50) NULL,
  accion VARCHAR(40) NOT NULL,
  detalle VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  PRIMARY KEY (id_auditoria),
  KEY idx_auditoria_fecha (fecha),
  KEY idx_auditoria_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- La aplicación usa cinco tipos de antecedente (Personal, Familiar, Patológico, Quirúrgico,
-- Alergia) pero la columna solo admitía tres, así que MySQL rechazaba la mayoría.
ALTER TABLE antecedentes MODIFY tipo_antecedente VARCHAR(30) NOT NULL;
UPDATE antecedentes SET tipo_antecedente = 'Patológico' WHERE tipo_antecedente = 'Patologico Personal';
UPDATE antecedentes SET tipo_antecedente = 'Personal' WHERE tipo_antecedente = 'No Patologico Personal';

-- El formulario pedía la saturación de oxígeno pero no había dónde guardarla.
ALTER TABLE signos_vitales ADD COLUMN saturacion_oxigeno INT NULL;

-- Búsquedas frecuentes del listado de pacientes y del historial.
CREATE INDEX idx_pacientes_apellidos ON pacientes (apellidos_completos);
CREATE INDEX idx_consulta_fecha ON consulta_medica (fecha_hora_atencion);
