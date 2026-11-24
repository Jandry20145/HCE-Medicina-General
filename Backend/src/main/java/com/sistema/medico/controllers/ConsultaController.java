package com.sistema.medico.controllers;

import com.sistema.medico.dto.ClinicaRequests;
import com.sistema.medico.dto.ConsultaRequest;
import com.sistema.medico.models.Adenda;
import com.sistema.medico.models.Certificado;
import com.sistema.medico.models.ConsultaMedica;
import com.sistema.medico.models.Orden;
import com.sistema.medico.services.AuditoriaService;
import com.sistema.medico.services.ConsultaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Permisos en SecurityConfig: triaje (Enfermería y Médico), lectura (ambos), el resto solo Médico. */
@RestController
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;
    private final AuditoriaService auditoria;

    @GetMapping("/api/consultas/pendientes")
    public List<ConsultaMedica> pendientes() {
        return consultaService.pendientes();
    }

    @GetMapping("/api/consultas/{id}")
    public Map<String, Object> detalle(@PathVariable Integer id, HttpServletRequest http) {
        Map<String, Object> detalle = consultaService.detalle(id);
        auditoria.registrar("CONSULTA_VISTA", "consulta=" + id, http);
        return detalle;
    }

    @PostMapping("/api/consultas/triaje")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> triaje(@Valid @RequestBody ClinicaRequests.Triaje dto, Authentication auth,
                                      HttpServletRequest http) {
        ConsultaMedica consulta = consultaService.triaje(dto, auth.getName());
        auditoria.registrar("TRIAJE_REGISTRADO", "consulta=" + consulta.getIdConsulta() + " paciente=" + dto.idPaciente(), http);
        return Map.of("mensaje", "Triaje registrado", "consultaId", consulta.getIdConsulta());
    }

    /** Consulta nueva sin triaje. Queda en borrador; el médico es el de la sesión. */
    @PostMapping("/api/consultas")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crear(@Valid @RequestBody ConsultaRequest dto, Authentication auth,
                                     HttpServletRequest http) {
        ConsultaMedica consulta = consultaService.crear(dto, auth.getName());
        auditoria.registrar("CONSULTA_CREADA",
                "consulta=" + consulta.getIdConsulta() + " historia=" + dto.idHistoriaClinica(), http);
        return Map.of("mensaje", "Borrador guardado", "consultaId", consulta.getIdConsulta());
    }

    @PutMapping("/api/consultas/{id}")
    public Map<String, Object> actualizar(@PathVariable Integer id, @Valid @RequestBody ConsultaRequest dto,
                                          Authentication auth, HttpServletRequest http) {
        consultaService.actualizar(id, dto, auth.getName());
        auditoria.registrar("CONSULTA_ACTUALIZADA", "consulta=" + id, http);
        return Map.of("mensaje", "Borrador guardado", "consultaId", id);
    }

    @PostMapping("/api/consultas/{id}/firmar")
    public Map<String, Object> firmar(@PathVariable Integer id, Authentication auth, HttpServletRequest http) {
        ConsultaMedica consulta = consultaService.firmar(id, auth.getName());
        auditoria.registrar("CONSULTA_FIRMADA", "consulta=" + id, http);
        return Map.of("mensaje", "Consulta firmada", "firmadaEn", consulta.getFirmadaEn());
    }

    @PostMapping("/api/consultas/{id}/adendas")
    @ResponseStatus(HttpStatus.CREATED)
    public Adenda adenda(@PathVariable Integer id, @Valid @RequestBody ClinicaRequests.Adenda dto,
                         Authentication auth, HttpServletRequest http) {
        Adenda adenda = consultaService.adenda(id, dto, auth.getName());
        auditoria.registrar("ADENDA_CREADA", "consulta=" + id, http);
        return adenda;
    }

    @PostMapping("/api/consultas/{id}/certificados")
    @ResponseStatus(HttpStatus.CREATED)
    public Certificado certificado(@PathVariable Integer id, @Valid @RequestBody ClinicaRequests.Certificado dto,
                                   Authentication auth, HttpServletRequest http) {
        Certificado c = consultaService.certificado(id, dto, auth.getName());
        auditoria.registrar("CERTIFICADO_EMITIDO", "consulta=" + id + " certificado=" + c.getIdCertificado(), http);
        return c;
    }

    @PutMapping("/api/ordenes/{id}/resultado")
    public Orden resultado(@PathVariable Integer id, @Valid @RequestBody ClinicaRequests.Resultado dto,
                           HttpServletRequest http) {
        Orden orden = consultaService.resultado(id, dto);
        auditoria.registrar("ORDEN_RESULTADO", "orden=" + id, http);
        return orden;
    }

    @PostMapping("/api/ordenes/{id}/revisar")
    public Orden revisar(@PathVariable Integer id, Authentication auth, HttpServletRequest http) {
        Orden orden = consultaService.revisar(id, auth.getName());
        auditoria.registrar("ORDEN_REVISADA", "orden=" + id, http);
        return orden;
    }
}
