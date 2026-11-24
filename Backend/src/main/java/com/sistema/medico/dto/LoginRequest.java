package com.sistema.medico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Ingrese el usuario") @Size(max = 50) String username,
        @NotBlank(message = "Ingrese la contraseña") @Size(max = 128) String password) {
}
