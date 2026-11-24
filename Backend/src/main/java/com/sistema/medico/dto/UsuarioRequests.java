package com.sistema.medico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Peticiones de gestión de usuarios y contraseñas. */
public final class UsuarioRequests {

    private UsuarioRequests() {
    }

    private static final String ROLES = "Admin|Enfermeria|Medico";

    public record Crear(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$", message = "Usuario: 3 a 50 letras, números, punto, guion o guion bajo") String username,
            @NotBlank @Size(min = 8, max = 128, message = "La contraseña debe tener entre 8 y 128 caracteres") String password,
            @NotBlank @Pattern(regexp = ROLES, message = "Rol no válido") String rol,
            @NotBlank(message = "Ingrese los nombres completos") @Size(max = 150) String nombresCompletos,
            @Size(max = 50) String registroProfesional) {
    }

    public record Actualizar(
            @NotBlank @Pattern(regexp = ROLES, message = "Rol no válido") String rol,
            @NotBlank(message = "Ingrese los nombres completos") @Size(max = 150) String nombresCompletos,
            @NotNull Boolean activo,
            @Size(max = 50) String registroProfesional) {
    }

    public record CambiarPassword(
            @NotBlank(message = "Ingrese la contraseña actual") @Size(max = 128) String passwordActual,
            @NotBlank @Size(min = 8, max = 128, message = "La contraseña nueva debe tener entre 8 y 128 caracteres") String passwordNueva) {
    }

    public record RestablecerPassword(
            @NotBlank @Size(min = 8, max = 128, message = "La contraseña nueva debe tener entre 8 y 128 caracteres") String passwordNueva) {
    }
}
