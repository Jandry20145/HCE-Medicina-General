package com.sistema.medico.controllers;

import com.sistema.medico.dto.ClinicaRequests;
import com.sistema.medico.models.ProcedimientoEnfermeria;
import com.sistema.medico.repositories.PacienteRepository;
import com.sistema.medico.repositories.ProcedimientoEnfermeriaRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** Procedimientos de enfermería: los registra Enfermería; Médico los lee (SecurityConfig). */
@RestController
@RequestMapping("/api/procedimientos")
@RequiredArgsConstructor
public class ProcedimientoController {

    private final ProcedimientoEnfermeriaRepository repository;
    private final PacienteRepository pacienteRepository;
    private final AuditoriaService auditoria;

    @GetMapping("/paciente/{idPaciente}")
    public List<ProcedimientoEnfermeria> delPaciente(@PathVariable Integer idPaciente) {
        return repository.findByPaciente_IdPacienteOrderByFechaDesc(idPaciente);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProcedimientoEnfermeria crear(@Valid @RequestBody ClinicaRequests.Procedimiento dto, Authentication auth,
                                         HttpServletRequest http) {
        ProcedimientoEnfermeria p = new ProcedimientoEnfermeria();
        p.setPaciente(pacienteRepository.findById(dto.idPaciente())
                .orElseThrow(() -> new IllegalArgumentException("El paciente no existe")));
        p.setTipo(dto.tipo());
        p.setDescripcion(dto.descripcion().trim());
        p.setRealizadoPor(auth.getName());
        p.setFecha(LocalDateTime.now());
        repository.save(p);
        auditoria.registrar("PROCEDIMIENTO_REGISTRADO", "paciente=" + dto.idPaciente() + " tipo=" + dto.tipo(), http);
        return p;
    }
}
