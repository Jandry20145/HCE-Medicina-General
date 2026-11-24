package com.sistema.medico.controllers;

import com.sistema.medico.repositories.ConsultaMedicaRepository;
import com.sistema.medico.repositories.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

/** Conteos del tablero de inicio. Solo números: ningún dato clínico ni nombres. */
@RestController
@RequiredArgsConstructor
public class EstadisticasController {

    private final PacienteRepository pacienteRepository;
    private final ConsultaMedicaRepository consultaRepository;

    @GetMapping("/api/estadisticas")
    @Transactional(readOnly = true)
    public Map<String, Long> estadisticas() {
        LocalDate hoy = LocalDate.now();
        return Map.of(
                "pacientes", pacienteRepository.count(),
                "consultasTotales", consultaRepository.count(),
                "consultasHoy", consultaRepository.countByFechaHoraAtencionBetween(hoy.atStartOfDay(), hoy.plusDays(1).atStartOfDay()),
                "consultasSemana", consultaRepository.countByFechaHoraAtencionBetween(hoy.minusDays(6).atStartOfDay(), hoy.plusDays(1).atStartOfDay()));
    }
}
