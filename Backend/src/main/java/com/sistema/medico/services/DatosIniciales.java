package com.sistema.medico.services;

import com.sistema.medico.models.Usuario;
import com.sistema.medico.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Al arrancar:
 * 1. Convierte a BCrypt las contraseñas que instalaciones anteriores guardaban en texto plano.
 * 2. Crea el administrador inicial (usuario y clave del entorno) si no existe. Un usuario ya
 *    existente nunca se modifica, para no pisar la contraseña cambiada desde la aplicación.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class DatosIniciales implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${HCE_ADMIN_USERNAME}")
    private String adminUsername;

    @Value("${HCE_ADMIN_PASSWORD}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        int migradas = 0;
        for (Usuario u : usuarioRepository.findAll()) {
            if (!esBcrypt(u.getPasswordHash())) {
                u.setPasswordHash(passwordEncoder.encode(u.getPasswordHash()));
                migradas++;
            }
        }
        if (migradas > 0) {
            log.warn("{} contraseña(s) en texto plano convertidas a BCrypt. Pida a esos usuarios que la cambien.", migradas);
        }

        String username = adminUsername == null ? "" : adminUsername.trim();
        if (username.isEmpty()) {
            throw new IllegalStateException("Defina HCE_ADMIN_USERNAME con el usuario administrador inicial");
        }
        if (usuarioRepository.findByUsername(username).isPresent()) {
            return;
        }
        if (adminPassword == null || adminPassword.length() < 8 || adminPassword.startsWith("cambia_esta")) {
            throw new IllegalStateException(
                    "HCE_ADMIN_PASSWORD debe tener al menos 8 caracteres y no ser el valor de ejemplo de .env.example");
        }
        Usuario admin = new Usuario();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRol("Admin");
        admin.setNombresCompletos("Administrador");
        admin.setEstado(true);
        usuarioRepository.save(admin);
        log.info("Administrador inicial '{}' creado", username);
    }

    static boolean esBcrypt(String hash) {
        return hash != null && hash.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    }
}
