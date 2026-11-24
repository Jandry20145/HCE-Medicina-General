package com.sistema.medico.controllers;

import com.sistema.medico.dto.LoginRequest;
import com.sistema.medico.dto.LoginResponse;
import com.sistema.medico.dto.UsuarioRequests;
import com.sistema.medico.models.Usuario;
import com.sistema.medico.repositories.UsuarioRepository;
import com.sistema.medico.security.IntentosLogin;
import com.sistema.medico.security.JwtAuthFilter;
import com.sistema.medico.security.JwtService;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final IntentosLogin intentosLogin;
    private final AuditoriaService auditoria;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String ip = http.getRemoteAddr();
        if (intentosLogin.estaBloqueado(request.username(), ip)) {
            auditoria.registrar(request.username(), "LOGIN_BLOQUEADO", null, http);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Demasiados intentos fallidos. Espere 15 minutos e inténtelo de nuevo."));
        }
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException e) {
            // Mismo mensaje para usuario inexistente, clave errónea o cuenta desactivada.
            intentosLogin.registrarFallo(request.username(), ip);
            auditoria.registrar(request.username(), "LOGIN_FALLIDO", null, http);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario o contraseña incorrectos"));
        }
        Usuario usuario = usuarioRepository.findByUsername(request.username()).orElseThrow();
        intentosLogin.registrarExito(request.username(), ip);
        auditoria.registrar(usuario.getUsername(), "LOGIN", null, http);
        return conSesion(usuario, http).body(LoginResponse.de(usuario));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest http) {
        if (AuditoriaService.usuarioActual() != null) {
            auditoria.registrar("LOGOUT", null, http);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie("", 0, http.isSecure()).toString())
                .body(Map.of("mensaje", "Sesión cerrada"));
    }

    /** Perfil de la sesión actual: el frontend lo usa para saber si sigue con sesión. */
    @GetMapping("/me")
    public LoginResponse me(Authentication authentication) {
        return LoginResponse.de(usuarioRepository.findByUsername(authentication.getName()).orElseThrow());
    }

    @PostMapping("/password")
    public ResponseEntity<?> cambiarPassword(@Valid @RequestBody UsuarioRequests.CambiarPassword request,
                                             Authentication authentication, HttpServletRequest http) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName()).orElseThrow();
        if (!passwordEncoder.matches(request.passwordActual(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        if (passwordEncoder.matches(request.passwordNueva(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña nueva debe ser distinta de la actual");
        }
        usuario.setPasswordHash(passwordEncoder.encode(request.passwordNueva()));
        usuarioRepository.save(usuario);
        auditoria.registrar("CAMBIO_PASSWORD", null, http);
        // Las demás sesiones quedan cerradas; esta sigue con un token nuevo.
        return conSesion(usuario, http).body(Map.of("mensaje", "Contraseña actualizada"));
    }

    private ResponseEntity.BodyBuilder conSesion(Usuario usuario, HttpServletRequest http) {
        String token = jwtService.generateToken(usuario.getUsername(), usuario.getPasswordHash());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,
                cookie(token, jwtService.getExpirationSeconds(), http.isSecure()).toString());
    }

    private static ResponseCookie cookie(String valor, long maxAge, boolean secure) {
        return ResponseCookie.from(JwtAuthFilter.AUTH_COOKIE, valor)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Strict")
                .maxAge(maxAge)
                .build();
    }
}
