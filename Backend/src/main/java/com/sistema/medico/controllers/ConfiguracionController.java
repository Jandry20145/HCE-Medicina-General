package com.sistema.medico.controllers;

import com.sistema.medico.dto.ClinicaRequests;
import com.sistema.medico.models.Configuracion;
import com.sistema.medico.repositories.ConfiguracionRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Lectura para cualquier usuario con sesión (agenda, encabezados); edición solo Admin. */
@RestController
@RequiredArgsConstructor
public class ConfiguracionController {

    private final ConfiguracionRepository repository;
    private final AuditoriaService auditoria;

    @GetMapping("/api/configuracion")
    public Configuracion leer() {
        return repository.findById(1).orElseThrow(() -> new IllegalStateException("Falta la configuración"));
    }

    @PutMapping("/api/admin/configuracion")
    @Transactional
    public Configuracion guardar(@Valid @RequestBody ClinicaRequests.Configuracion dto, HttpServletRequest http) {
        if (!dto.horaApertura().isBefore(dto.horaCierre())) {
            throw new IllegalArgumentException("La hora de apertura debe ser anterior a la de cierre");
        }
        Configuracion c = leer();
        c.setNombreEstablecimiento(dto.nombreEstablecimiento().trim());
        c.setDireccion(dto.direccion());
        c.setTelefono(dto.telefono());
        c.setHoraApertura(dto.horaApertura());
        c.setHoraCierre(dto.horaCierre());
        c.setDuracionCitaMin(dto.duracionCitaMin());
        c.setPieDocumentos(dto.pieDocumentos());
        auditoria.registrar("CONFIGURACION_ACTUALIZADA", null, http);
        return c;
    }
}
