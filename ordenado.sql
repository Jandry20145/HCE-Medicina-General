-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema hce_reto
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema hce_reto
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `hce_reto` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `hce_reto` ;

-- -----------------------------------------------------
-- Table `hce_reto`.`pacientes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`pacientes` (
  `id_paciente` INT NOT NULL AUTO_INCREMENT,
  `numero_historia_clinica` VARCHAR(50) NOT NULL,
  `cedula_identidad` VARCHAR(20) NOT NULL,
  `nombres_completos` VARCHAR(100) NOT NULL,
  `apellidos_completos` VARCHAR(100) NOT NULL,
  `fecha_nacimiento` DATE NOT NULL,
  `sexo` ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
  `seguro_salud` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id_paciente`),
  UNIQUE INDEX `numero_historia_clinica` (`numero_historia_clinica` ASC) VISIBLE,
  UNIQUE INDEX `cedula_identidad` (`cedula_identidad` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`antecedentes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`antecedentes` (
  `id_antecedente` INT NOT NULL AUTO_INCREMENT,
  `id_paciente` INT NOT NULL,
  `tipo_antecedente` ENUM('Patologico Personal', 'No Patologico Personal', 'Familiar') NOT NULL,
  `enfermedad_asociada` VARCHAR(150) NOT NULL,
  `parentesco_familiar` VARCHAR(50) NULL DEFAULT NULL,
  `alergias_principales` TEXT NULL DEFAULT NULL,
  `descripcion_adicional` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id_antecedente`),
  INDEX `fk_antecedentes_paciente` (`id_paciente` ASC) VISIBLE,
  CONSTRAINT `fk_antecedentes_paciente`
    FOREIGN KEY (`id_paciente`)
    REFERENCES `hce_reto`.`pacientes` (`id_paciente`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`catalogo_cie10`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`catalogo_cie10` (
  `id_cie10` INT NOT NULL AUTO_INCREMENT,
  `codigo_cie` VARCHAR(20) NOT NULL,
  `nombre_enfermedad` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_cie10`),
  UNIQUE INDEX `codigo_cie` (`codigo_cie` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`catalogo_medicamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`catalogo_medicamentos` (
  `id_medicamento` INT NOT NULL AUTO_INCREMENT,
  `codigo_medicamento` VARCHAR(50) NOT NULL,
  `nombre_generico` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_medicamento`),
  UNIQUE INDEX `codigo_medicamento` (`codigo_medicamento` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`historia_clinica`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`historia_clinica` (
  `id_history_clinica` INT NOT NULL AUTO_INCREMENT,
  `id_paciente` INT NOT NULL,
  `fecha_apertura` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_expediente` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_history_clinica`),
  UNIQUE INDEX `id_paciente` (`id_paciente` ASC) VISIBLE,
  CONSTRAINT `fk_historia_paciente`
    FOREIGN KEY (`id_paciente`)
    REFERENCES `hce_reto`.`pacientes` (`id_paciente`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('Admision', 'Enfermeria', 'Medico') NOT NULL,
  `nombres_completos` VARCHAR(150) NOT NULL,
  `estado` TINYINT(1) NULL DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `username` (`username` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `hce_reto`.`usuarios` (`username`, `password_hash`, `rol`, `nombres_completos`, `estado`) VALUES
('recepcion', '1234', 'Admision', 'Recepcionista Prueba', 1),
('medico', '1234', 'Medico', 'Medico Prueba', 1);



-- -----------------------------------------------------
-- Table `hce_reto`.`consulta_medica`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`consulta_medica` (
  `id_consulta` INT NOT NULL AUTO_INCREMENT,
  `id_historia_clinica` INT NOT NULL,
  `id_medico` INT NOT NULL,
  `fecha_hora_atencion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `motivo_consulta` TEXT NOT NULL,
  `enfermedad_actual` TEXT NULL DEFAULT NULL,
  `evolucion` TEXT NULL DEFAULT NULL,
  `recomendaciones` TEXT NULL DEFAULT NULL,
  `proximo_control` DATE NULL DEFAULT NULL,
  `estado_consulta` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_consulta`),
  INDEX `fk_consulta_historia` (`id_historia_clinica` ASC) VISIBLE,
  INDEX `fk_consulta_medico` (`id_medico` ASC) VISIBLE,
  CONSTRAINT `fk_consulta_historia`
    FOREIGN KEY (`id_historia_clinica`)
    REFERENCES `hce_reto`.`historia_clinica` (`id_history_clinica`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_consulta_medico`
    FOREIGN KEY (`id_medico`)
    REFERENCES `hce_reto`.`usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`diagnosticos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`diagnosticos` (
  `id_diagnostic` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `id_cie10` INT NOT NULL,
  `tipo_diagnostico` ENUM('Presuntivo', 'Definitivo') NOT NULL,
  `condicion_diagnostico` ENUM('Principal', 'Secundario') NOT NULL DEFAULT 'Principal',
  `descripcion_clinica` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id_diagnostic`),
  INDEX `fk_diagnosticos_consulta` (`id_consulta` ASC) VISIBLE,
  INDEX `fk_diagnosticos_cie10` (`id_cie10` ASC) VISIBLE,
  CONSTRAINT `fk_diagnosticos_cie10`
    FOREIGN KEY (`id_cie10`)
    REFERENCES `hce_reto`.`catalogo_cie10` (`id_cie10`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_diagnosticos_consulta`
    FOREIGN KEY (`id_consulta`)
    REFERENCES `hce_reto`.`consulta_medica` (`id_consulta`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`examen_fisico`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`examen_fisico` (
  `id_examen` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `region_anatomica` VARCHAR(100) NOT NULL,
  `hallazgos` TEXT NOT NULL,
  PRIMARY KEY (`id_examen`),
  INDEX `fk_examen_consulta` (`id_consulta` ASC) VISIBLE,
  CONSTRAINT `fk_examen_consulta`
    FOREIGN KEY (`id_consulta`)
    REFERENCES `hce_reto`.`consulta_medica` (`id_consulta`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`signos_vitales`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`signos_vitales` (
  `id_signos` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `id_enfermero` INT NOT NULL,
  `temperatura` DECIMAL(4,2) NULL DEFAULT NULL,
  `presion_arterial` VARCHAR(20) NULL DEFAULT NULL,
  `pulso` INT NULL DEFAULT NULL,
  `frecuencia_respiratoria` INT NULL DEFAULT NULL,
  `peso_kg` DECIMAL(5,2) NULL DEFAULT NULL,
  `talla_cm` DECIMAL(5,2) NULL DEFAULT NULL,
  `grupo_sanguineo` VARCHAR(10) NULL DEFAULT NULL,
  PRIMARY KEY (`id_signos`),
  INDEX `fk_signos_consulta` (`id_consulta` ASC) VISIBLE,
  INDEX `fk_signos_enfermero` (`id_enfermero` ASC) VISIBLE,
  CONSTRAINT `fk_signos_consulta`
    FOREIGN KEY (`id_consulta`)
    REFERENCES `hce_reto`.`consulta_medica` (`id_consulta`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_signos_enfermero`
    FOREIGN KEY (`id_enfermero`)
    REFERENCES `hce_reto`.`usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `hce_reto`.`tratamientos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `hce_reto`.`tratamientos` (
  `id_tratamiento` INT NOT NULL AUTO_INCREMENT,
  `id_consulta` INT NOT NULL,
  `id_medicamento` INT NULL DEFAULT NULL,
  `nombre_medicamento` VARCHAR(255) NULL DEFAULT NULL,
  `indicaciones_dosis` TEXT NOT NULL,
  `fecha_hora_registro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tratamiento`),
  INDEX `fk_tratamientos_consulta` (`id_consulta` ASC) VISIBLE,
  INDEX `fk_tratamientos_medicamento` (`id_medicamento` ASC) VISIBLE,
  CONSTRAINT `fk_tratamientos_consulta`
    FOREIGN KEY (`id_consulta`)
    REFERENCES `hce_reto`.`consulta_medica` (`id_consulta`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_tratamientos_medicamento`
    FOREIGN KEY (`id_medicamento`)
    REFERENCES `hce_reto`.`catalogo_medicamentos` (`id_medicamento`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

