package com.sistema.medico.controllers;

import com.sistema.medico.dto.ClinicaRequests;
import com.sistema.medico.models.Cita;
import com.sistema.medico.models.Configuracion;
import com.sistema.medico.repositories.CitaRepository;
import com.sistema.medico.repositories.ConfiguracionRepository;
import com.sistema.medico.repositories.PacienteRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Agenda: Enfermería y Médico (SecurityConfig). */
@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private static final Set<String> INACTIVAS = Set.of("Cancelada", "NoAsistio", "Atendida");

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final AuditoriaService auditoria;

    @GetMapping
    @Transactional(readOnly = true)
    public List<Cita> delDia(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        return citaRepository.findByFechaHoraBetweenOrderByFechaHoraAsc(dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    @GetMapping("/paciente/{idPaciente}")
    @Transactional(readOnly = true)
    public List<Cita> delPaciente(@PathVariable Integer idPaciente) {
        return citaRepository.findByPaciente_IdPacienteOrderByFechaHoraDesc(idPaciente);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Cita crear(@Valid @RequestBody ClinicaRequests.Cita dto, Authentication auth, HttpServletRequest http) {
        Configuracion conf = configuracion();
        Cita cita = new Cita();
        cita.setPaciente(pacienteRepository.findById(dto.idPaciente())
                .orElseThrow(() -> new IllegalArgumentException("El paciente no existe")));
        cita.setMotivo(dto.motivo() == null || dto.motivo().isBlank() ? null : dto.motivo().trim());
        cita.setDuracionMin(dto.duracionMin() != null ? dto.duracionMin() : conf.getDuracionCitaMin());
        cita.setCreadaPor(auth.getName());
        cita.setCreadaEn(LocalDateTime.now());
        if (Boolean.TRUE.equals(dto.espontanea())) {
            // Llega sin cita: queda directamente en sala de espera.
            cita.setFechaHora(LocalDateTime.now().withSecond(0).withNano(0));
            cita.setEstado("EnEspera");
            cita.setLlegadaEn(LocalDateTime.now());
        } else {
            if (dto.fechaHora() == null) {
                throw new IllegalArgumentException("Indique la fecha y hora de la cita");
            }
            validarHorario(dto.fechaHora(), cita.getDuracionMin(), null, conf);
            cita.setFechaHora(dto.fechaHora());
            cita.setEstado("Programada");
        }
        citaRepository.save(cita);
        auditoria.registrar("CITA_CREADA", "cita=" + cita.getIdCita() + " paciente=" + dto.idPaciente(), http);
        return cita;
    }

    /** Reprogramar: nueva fecha y hora con las mismas validaciones. */
    @PutMapping("/{id}")
    @Transactional
    public Cita reprogramar(@PathVariable Integer id, @Valid @RequestBody ClinicaRequests.Cita dto, HttpServletRequest http) {
        Cita cita = buscar(id);
        if (INACTIVAS.contains(cita.getEstado()) || "EnAtencion".equals(cita.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta cita ya no se puede reprogramar");
        }
        if (dto.fechaHora() == null) {
            throw new IllegalArgumentException("Indique la nueva fecha y hora");
        }
        int duracion = dto.duracionMin() != null ? dto.duracionMin() : cita.getDuracionMin();
        validarHorario(dto.fechaHora(), duracion, id, configuracion());
        cita.setFechaHora(dto.fechaHora());
        cita.setDuracionMin(duracion);
        cita.setEstado("Programada");
        auditoria.registrar("CITA_REPROGRAMADA", "cita=" + id, http);
        return cita;
    }

    /** Confirmar, marcar llegada (EnEspera), cancelar o registrar inasistencia. */
    @PostMapping("/{id}/estado")
    @Transactional
    public Cita cambiarEstado(@PathVariable Integer id, @Valid @RequestBody ClinicaRequests.CitaEstado dto,
                              HttpServletRequest http) {
        Cita cita = buscar(id);
        if (INACTIVAS.contains(cita.getEstado()) || "EnAtencion".equals(cita.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La cita ya está " + cita.getEstado());
        }
        cita.setEstado(dto.estado());
        if ("EnEspera".equals(dto.estado()) && cita.getLlegadaEn() == null) {
            cita.setLlegadaEn(LocalDateTime.now());
        }
        auditoria.registrar("CITA_" + dto.estado().toUpperCase(), "cita=" + id, http);
        return cita;
    }

    private void validarHorario(LocalDateTime inicio, int duracionMin, Integer ignorar, Configuracion conf) {
        if (inicio.isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException("La fecha y hora ya pasaron");
        }
        LocalDateTime fin = inicio.plusMinutes(duracionMin);
        if (inicio.toLocalTime().isBefore(conf.getHoraApertura()) || fin.toLocalTime().isAfter(conf.getHoraCierre())
                || !fin.toLocalDate().equals(inicio.toLocalDate())) {
            throw new IllegalArgumentException("Fuera del horario de atención (" + conf.getHoraApertura() + " a "
                    + conf.getHoraCierre() + ")");
        }
        LocalDate dia = inicio.toLocalDate();
        boolean choca = citaRepository.findByFechaHoraBetweenOrderByFechaHoraAsc(dia.atStartOfDay(), dia.plusDays(1).atStartOfDay())
                .stream()
                .filter(c -> !c.getIdCita().equals(ignorar) && !INACTIVAS.contains(c.getEstado()))
                .anyMatch(c -> inicio.isBefore(c.getFechaHora().plusMinutes(c.getDuracionMin())) && c.getFechaHora().isBefore(fin));
        if (choca) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya hay una cita en ese horario");
        }
    }

    private Configuracion configuracion() {
        return configuracionRepository.findById(1).orElseThrow(() -> new IllegalStateException("Falta la configuración"));
    }

    private Cita buscar(Integer id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
    }
}
