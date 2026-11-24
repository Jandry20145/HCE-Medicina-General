package com.sistema.medico.controllers;

import com.sistema.medico.dto.ConsultaRequest;
import com.sistema.medico.models.ConsultaMedica;
import com.sistema.medico.services.AuditoriaService;
import com.sistema.medico.services.ConsultaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;
    private final AuditoriaService auditoria;

    @GetMapping("/{id}")
    public Map<String, Object> detalle(@PathVariable Integer id, HttpServletRequest http) {
        Map<String, Object> detalle = consultaService.detalle(id);
        auditoria.registrar("CONSULTA_VISTA", "consulta=" + id, http);
        return detalle;
    }

    /** El médico responsable es siempre el usuario de la sesión. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crear(@Valid @RequestBody ConsultaRequest dto, Authentication authentication,
                                     HttpServletRequest http) {
        ConsultaMedica consulta = consultaService.crear(dto, authentication.getName());
        auditoria.registrar("CONSULTA_CREADA",
                "consulta=" + consulta.getIdConsulta() + " historia=" + dto.idHistoriaClinica(), http);
        return Map.of("mensaje", "Consulta guardada", "consultaId", consulta.getIdConsulta());
    }
}
