USE hce_reto;

-- 1. Desactivamos las verificaciones de seguridad temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Vaciamos las tablas (Esto borra los datos y reinicia los contadores a 1)
TRUNCATE TABLE tratamientos;
TRUNCATE TABLE diagnosticos;
TRUNCATE TABLE examen_fisico;
TRUNCATE TABLE signos_vitales;
TRUNCATE TABLE consulta_medica;
TRUNCATE TABLE antecedentes;
TRUNCATE TABLE historia_clinica;
TRUNCATE TABLE pacientes;

-- 3. Volvemos a activar la seguridad de la base de datos
SET FOREIGN_KEY_CHECKS = 1;
