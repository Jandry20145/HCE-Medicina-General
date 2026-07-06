USE hce_reto;

-- 1. Ver los usuarios (médicos, enfermeros, admisión) creados
SELECT * FROM usuarios;

-- 2. Ver los pacientes registrados
SELECT * FROM pacientes;

-- 3. Ver las historias clínicas que se abrieron para esos pacientes
SELECT * FROM historia_clinica;

-- 4. Ver los antecedentes médicos asociados a los pacientes
SELECT * FROM antecedentes;

-- 5. Ver las consultas médicas realizadas por los doctores
SELECT * FROM consulta_medica;

-- 6. Ver los signos vitales que tomó enfermería en las consultas
SELECT * FROM signos_vitales;

-- 7. Ver los hallazgos de los exámenes físicos de las consultas
SELECT * FROM examen_fisico;

-- 8. Ver el catálogo de enfermedades CIE10 cargado
SELECT * FROM catalogo_cie10;

-- 9. Ver los diagnósticos asignados a los pacientes en sus consultas
SELECT * FROM diagnosticos;

-- 10. Ver el catálogo de medicamentos cargado
SELECT * FROM catalogo_medicamentos;

-- 11. Ver los tratamientos y dosis recetados en las consultas
SELECT * FROM tratamientos;