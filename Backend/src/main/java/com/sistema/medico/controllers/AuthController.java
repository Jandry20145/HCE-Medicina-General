package com.sistema.medico.controllers;

import com.sistema.medico.dto.LoginRequest;
import com.sistema.medico.dto.LoginResponse;
import com.sistema.medico.models.Usuario;
import com.sistema.medico.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Para permitir peticiones desde React
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("Intento de login. Username recibido: '" + loginRequest.getUsername() + "', Password recibido: '" + loginRequest.getPassword() + "'");
        
        System.out.println("Usuarios en DB: " + usuarioRepository.findAll().size());
        for(Usuario u : usuarioRepository.findAll()) {
            System.out.println(" - " + u.getUsername() + " | " + u.getPasswordHash());
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(loginRequest.getUsername());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            System.out.println("Usuario encontrado en DB: " + usuario.getUsername() + ", Password en DB: '" + usuario.getPasswordHash() + "'");
            
            // Validación de contraseña en texto plano
            if (usuario.getPasswordHash().equals(loginRequest.getPassword())) {
                LoginResponse response = new LoginResponse(
                        usuario.getIdUsuario(),
                        usuario.getUsername(),
                        usuario.getRol(),
                        usuario.getNombresCompletos()
                );
                return ResponseEntity.ok(response);
            }
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
    }
}
