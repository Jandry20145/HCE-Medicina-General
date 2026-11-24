package com.sistema.medico.controllers;

import com.sistema.medico.models.Antecedente;
import com.sistema.medico.models.Paciente;
import com.sistema.medico.repositories.AntecedenteRepository;
import com.sistema.medico.repositories.PacienteRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/antecedentes")
@RequiredArgsConstructor
public class AntecedenteController {

    private final AntecedenteRepository antecedenteRepository;
    private final PacienteRepository pacienteRepository;
    private final AuditoriaService auditoria;

    public record AntecedenteRequest(
            @NotNull Integer idPaciente,
            @NotBlank @Pattern(regexp = "Personal|Familiar|Patológico|Quirúrgico|Alergia", message = "Tipo de antecedente no válido") String tipoAntecedente,
            @NotBlank(message = "Indique la enfermedad, cirugía o alérgeno") @Size(max = 150) String enfermedadAsociada,
            @Size(max = 50) String parentescoFamiliar,
            @Size(max = 2000) String alergiasPrincipales,
            @Size(max = 5000) String descripcionAdicional) {
    }

    @GetMapping("/paciente/{idPaciente}")
    public List<Antecedente> listar(@PathVariable Integer idPaciente) {
        return antecedenteRepository.findByPaciente_IdPaciente(idPaciente);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Antecedente crear(@Valid @RequestBody AntecedenteRequest dto, HttpServletRequest http) {
        Paciente paciente = pacienteRepository.findById(dto.idPaciente())
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Antecedente ant = new Antecedente();
        ant.setPaciente(paciente);
        ant.setTipoAntecedente(dto.tipoAntecedente());
        ant.setEnfermedadAsociada(dto.enfermedadAsociada().trim());
        ant.setParentescoFamiliar(dto.parentescoFamiliar());
        ant.setAlergiasPrincipales(dto.alergiasPrincipales());
        ant.setDescripcionAdicional(dto.descripcionAdicional());
        Antecedente guardado = antecedenteRepository.save(ant);
        auditoria.registrar("ANTECEDENTE_CREADO", "paciente=" + paciente.getIdPaciente(), http);
        return guardado;
    }
}
