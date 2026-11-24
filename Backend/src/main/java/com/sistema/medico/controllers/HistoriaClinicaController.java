package com.sistema.medico.controllers;

import com.sistema.medico.models.HistoriaClinica;
import com.sistema.medico.repositories.ConsultaMedicaRepository;
import com.sistema.medico.repositories.HistoriaClinicaRepository;
import com.sistema.medico.services.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/historia-clinica")
@RequiredArgsConstructor
public class HistoriaClinicaController {

    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final ConsultaMedicaRepository consultaMedicaRepository;
    private final AuditoriaService auditoria;
    private final com.sistema.medico.repositories.ProcedimientoEnfermeriaRepository procedimientoRepository;
    private final com.sistema.medico.repositories.CitaRepository citaRepository;

    /** Paciente, expediente y consultas (la más reciente primero). Cada apertura queda auditada. */
    @GetMapping("/paciente/{idPaciente}")
    @Transactional(readOnly = true)
    public Map<String, Object> historiaCompleta(@PathVariable Integer idPaciente, HttpServletRequest http) {
        HistoriaClinica hc = historiaClinicaRepository.findByPaciente_IdPaciente(idPaciente)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Historia clínica no encontrada"));
        auditoria.registrar("HCE_CONSULTADA", "paciente=" + idPaciente, http);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("paciente", hc.getPaciente());
        r.put("historia_clinica", hc);
        r.put("consultas", consultaMedicaRepository.findByHistoriaClinicaOrderByFechaHoraAtencionDesc(hc));
        r.put("procedimientos", procedimientoRepository.findByPaciente_IdPacienteOrderByFechaDesc(idPaciente));
        r.put("citas", citaRepository.findByPaciente_IdPacienteOrderByFechaHoraDesc(idPaciente));
        return r;
    }
}
