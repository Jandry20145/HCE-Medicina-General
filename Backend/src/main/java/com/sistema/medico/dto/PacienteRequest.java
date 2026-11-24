package com.sistema.medico.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Datos que el cliente puede fijar de un paciente. El id y el N° de HC los asigna el servidor. */
public record PacienteRequest(
        @NotBlank(message = "La cédula es obligatoria") String cedulaIdentidad,
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100) String nombresCompletos,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100) String apellidosCompletos,
        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @PastOrPresent(message = "La fecha de nacimiento no puede ser futura") LocalDate fechaNacimiento,
        @NotBlank @Pattern(regexp = "Masculino|Femenino|Otro", message = "Sexo no válido") String sexo,
        @Size(max = 50) String estadoCivil,
        @Size(max = 100) String ocupacion,
        @Size(max = 255) String direccion,
        @Pattern(regexp = "^$|^[0-9+ ()-]{7,20}$", message = "Teléfono no válido") String telefono,
        @Size(max = 100) @Email(message = "Correo electrónico no válido") String correoElectronico,
        @Size(max = 100) String seguroSalud) {
}
