package com.sistema.medico.controllers;

import com.sistema.medico.dto.UsuarioRequests;
import com.sistema.medico.models.Auditoria;
import com.sistema.medico.models.Usuario;
import com.sistema.medico.repositories.UsuarioRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/** Gestión del personal y consulta de la auditoría. Solo rol Admin (ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoria;

    @GetMapping("/auditoria")
    public List<Auditoria> verAuditoria() {
        return auditoria.ultimos();
    }

    @GetMapping("/usuarios")
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAllByOrderByUsernameAsc();
    }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario crearUsuario(@Valid @RequestBody UsuarioRequests.Crear dto, HttpServletRequest http) {
        if (usuarioRepository.findByUsername(dto.username()).isPresent()) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        Usuario nuevo = new Usuario();
        nuevo.setUsername(dto.username());
        nuevo.setPasswordHash(passwordEncoder.encode(dto.password()));
        nuevo.setRol(dto.rol());
        nuevo.setNombresCompletos(dto.nombresCompletos().trim());
        nuevo.setEstado(true);
        usuarioRepository.save(nuevo);
        auditoria.registrar("USUARIO_CREADO", "usuario=" + nuevo.getUsername() + " rol=" + nuevo.getRol(), http);
        return nuevo;
    }

    @PutMapping("/usuarios/{id}")
    public Usuario actualizarUsuario(@PathVariable Integer id, @Valid @RequestBody UsuarioRequests.Actualizar dto,
                                     Authentication authentication, HttpServletRequest http) {
        Usuario usuario = buscar(id);
        // Evita que el sistema se quede sin nadie que pueda gestionar usuarios.
        if (usuario.getUsername().equals(authentication.getName()) && (!dto.activo() || !"Admin".equals(dto.rol()))) {
            throw new IllegalArgumentException("No puede quitarse a sí mismo el rol de administrador ni desactivarse");
        }
        usuario.setRol(dto.rol());
        usuario.setNombresCompletos(dto.nombresCompletos().trim());
        usuario.setEstado(dto.activo());
        usuarioRepository.save(usuario);
        auditoria.registrar("USUARIO_ACTUALIZADO",
                "usuario=" + usuario.getUsername() + " rol=" + dto.rol() + " activo=" + dto.activo(), http);
        return usuario;
    }

    /**
     * Fija una contraseña nueva para quien olvidó la suya y cierra sus sesiones abiertas.
     * El usuario debería cambiarla después desde "Cambiar contraseña".
     */
    @PutMapping("/usuarios/{id}/password")
    public Map<String, Object> restablecerPassword(@PathVariable Integer id,
                                                   @Valid @RequestBody UsuarioRequests.RestablecerPassword dto,
                                                   HttpServletRequest http) {
        Usuario usuario = buscar(id);
        usuario.setPasswordHash(passwordEncoder.encode(dto.passwordNueva()));
        usuarioRepository.save(usuario);
        auditoria.registrar("PASSWORD_RESTABLECIDA", "usuario=" + usuario.getUsername(), http);
        return Map.of("mensaje", "Contraseña restablecida");
    }

    private Usuario buscar(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }
}
