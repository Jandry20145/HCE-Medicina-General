package com.sistema.medico;

import com.sistema.medico.models.CatalogoCie10;
import com.sistema.medico.models.Usuario;
import com.sistema.medico.repositories.CatalogoCie10Repository;
import com.sistema.medico.repositories.UsuarioRepository;
import com.sistema.medico.security.JwtAuthFilter;
import com.sistema.medico.security.JwtService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Base de los tests de la API: un usuario por rol y un código CIE-10. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestBase {

    protected static final String CEDULA_VALIDA = "1710034065";
    protected static final String CLAVE = "clave_de_prueba";

    @Autowired protected MockMvc mockMvc;
    @Autowired protected UsuarioRepository usuarioRepository;
    @Autowired protected CatalogoCie10Repository cie10Repository;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected JwtService jwtService;

    protected Integer idCie10;

    @BeforeEach
    void datosBase() {
        for (String rol : new String[]{"Admision", "Enfermeria", "Medico"}) {
            String username = rol.toLowerCase() + ".prueba";
            if (usuarioRepository.findByUsername(username).isEmpty()) {
                Usuario u = new Usuario();
                u.setUsername(username);
                u.setPasswordHash(passwordEncoder.encode(CLAVE));
                u.setRol(rol);
                u.setNombresCompletos(rol + " de Prueba");
                u.setEstado(true);
                usuarioRepository.save(u);
            }
        }
        idCie10 = cie10Repository.findAll().stream().findFirst().map(CatalogoCie10::getIdCie10).orElseGet(() -> {
            CatalogoCie10 c = new CatalogoCie10();
            c.setCodigoCie("J00");
            c.setNombreEnfermedad("Rinofaringitis aguda");
            return cie10Repository.save(c).getIdCie10();
        });
    }

    /** Cookie de sesión válida para el usuario indicado. */
    protected Cookie sesion(String username) {
        Usuario u = usuarioRepository.findByUsername(username).orElseThrow();
        return new Cookie(JwtAuthFilter.AUTH_COOKIE, jwtService.generateToken(username, u.getPasswordHash()));
    }

    protected static String pacienteJson(String cedula) {
        return """
                {"cedulaIdentidad":"%s","nombresCompletos":"Ana María","apellidosCompletos":"Pérez Loja",
                 "fechaNacimiento":"1990-05-10","sexo":"Femenino","telefono":"0991234567"}
                """.formatted(cedula);
    }
}
