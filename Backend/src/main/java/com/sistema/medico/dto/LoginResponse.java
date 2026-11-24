package com.sistema.medico.dto;

import com.sistema.medico.models.Usuario;

/** Perfil del usuario con sesión. El token va aparte, en una cookie HttpOnly. */
public record LoginResponse(Integer idUsuario, String username, String rol, String nombresCompletos) {

    public static LoginResponse de(Usuario u) {
        return new LoginResponse(u.getIdUsuario(), u.getUsername(), u.getRol(), u.getNombresCompletos());
    }
}
