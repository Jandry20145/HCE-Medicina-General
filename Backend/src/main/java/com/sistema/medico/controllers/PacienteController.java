package com.sistema.medico.controllers;

import com.sistema.medico.dto.PacienteRequest;
import com.sistema.medico.models.Paciente;
import com.sistema.medico.services.AuditoriaService;
import com.sistema.medico.services.PacienteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;
    private final AuditoriaService auditoria;

    @GetMapping
    public List<Paciente> listar() {
        return pacienteService.listar();
    }

    @GetMapping("/{id}")
    public Paciente obtener(@PathVariable Integer id) {
        return pacienteService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Paciente crear(@Valid @RequestBody PacienteRequest datos, HttpServletRequest http) {
        Paciente paciente = pacienteService.crear(datos);
        auditoria.registrar("PACIENTE_CREADO", "id=" + paciente.getIdPaciente(), http);
        return paciente;
    }

    @PutMapping("/{id}")
    public Paciente actualizar(@PathVariable Integer id, @Valid @RequestBody PacienteRequest datos, HttpServletRequest http) {
        Paciente paciente = pacienteService.actualizar(id, datos);
        auditoria.registrar("PACIENTE_ACTUALIZADO", "id=" + id, http);
        return paciente;
    }
}
