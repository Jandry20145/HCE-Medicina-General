package com.sistema.medico;

import com.sistema.medico.repositories.AuditoriaRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SeguridadTest extends ApiTestBase {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    private static String login(String usuario, String clave) {
        return "{\"username\":\"" + usuario + "\",\"password\":\"" + clave + "\"}";
    }

    @Test
    void sinSesionNoSeLeenNiEscribenDatosClinicos() throws Exception {
        mockMvc.perform(get("/api/pacientes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/historia-clinica/paciente/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/pdf/historia/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/pacientes").contentType(MediaType.APPLICATION_JSON).content(pacienteJson(CEDULA_VALIDA)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void soloHealthDeActuatorEsPublico() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginCorrectoEntregaCookieHttpOnlyYNoElToken() throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(login("medico.prueba", CLAVE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("Medico"))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Strict")))
                .andReturn();
        assertThat(r.getResponse().getContentAsString()).doesNotContain("token").doesNotContain("$2a$");
    }

    @Test
    void loginFallidoEsGenericoYQuedaAuditado() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(login("enfermeria.prueba", "otra_clave")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Usuario o contraseña incorrectos"));
        assertThat(auditoriaRepository.findAll())
                .anyMatch(a -> "LOGIN_FALLIDO".equals(a.getAccion()) && "enfermeria.prueba".equals(a.getUsuario()));
    }

    @Test
    void cincoFallosBloqueanAunConLaClaveCorrecta() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                    .with(req -> { req.setRemoteAddr("10.9.9.9"); return req; })
                    .content(login("no.existe", "x")));
        }
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .with(req -> { req.setRemoteAddr("10.9.9.9"); return req; })
                        .content(login("no.existe", "x")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void permisosPorRol() throws Exception {
        Cookie admin = sesion("admin.prueba");
        Cookie enfermeria = sesion("enfermeria.prueba");
        Cookie medico = sesion("medico.prueba");

        // Administración: sin acceso a información clínica (secreto médico).
        mockMvc.perform(get("/api/pacientes").cookie(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/historia-clinica/paciente/1").cookie(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/consultas/pendientes").cookie(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/citas").cookie(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/configuracion").cookie(admin)).andExpect(status().isOk());

        // Enfermería: expediente, agenda y triaje sí; diagnosticar, prescribir, firmar y PDF no.
        mockMvc.perform(get("/api/pacientes").cookie(enfermeria)).andExpect(status().isOk());
        mockMvc.perform(get("/api/citas").cookie(enfermeria)).andExpect(status().isOk());
        mockMvc.perform(post("/api/consultas").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/consultas/1/firmar").cookie(enfermeria)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/consultas/1/certificados").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/catalogos/cie10/buscar?q=J0").cookie(enfermeria)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/pdf/historia/1").cookie(enfermeria)).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/configuracion").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isForbidden());

        // Médico: lee procedimientos de enfermería pero no los registra; sin panel de administración.
        mockMvc.perform(post("/api/procedimientos").cookie(medico).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/usuarios").cookie(medico)).andExpect(status().isForbidden());
    }

    @Test
    void listadoDeUsuariosNoExponeElHash() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios").cookie(sesion("admin.prueba")))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("medico.prueba")))
                .andExpect(content().string(not(containsString("passwordHash"))))
                .andExpect(content().string(not(containsString("$2a$"))));
    }

    @Test
    void usuarioDesactivadoPierdeLaSesionAbierta() throws Exception {
        Cookie admin = sesion("admin.prueba");
        mockMvc.perform(post("/api/admin/usuarios").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"temporal\",\"password\":\"clave_temporal\",\"rol\":\"Enfermeria\",\"nombresCompletos\":\"Temporal\"}"))
                .andExpect(status().isCreated());
        Cookie temporal = sesion("temporal");
        mockMvc.perform(get("/api/auth/me").cookie(temporal)).andExpect(status().isOk());

        Integer id = usuarioRepository.findByUsername("temporal").orElseThrow().getIdUsuario();
        mockMvc.perform(put("/api/admin/usuarios/" + id).cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"Enfermeria\",\"nombresCompletos\":\"Temporal\",\"activo\":false}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").cookie(temporal)).andExpect(status().isUnauthorized());
    }

    @Test
    void cambiarLaContrasenaCierraLasSesionesAnteriores() throws Exception {
        Cookie antigua = sesion("enfermeria.prueba");
        mockMvc.perform(post("/api/auth/password").cookie(antigua).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"" + CLAVE + "\",\"passwordNueva\":\"clave_nueva_segura\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/me").cookie(antigua)).andExpect(status().isUnauthorized());

        // Restaura la clave para los demás tests.
        var u = usuarioRepository.findByUsername("enfermeria.prueba").orElseThrow();
        u.setPasswordHash(passwordEncoder.encode(CLAVE));
        usuarioRepository.save(u);
    }
}
