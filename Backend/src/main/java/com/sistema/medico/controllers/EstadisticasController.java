package com.sistema.medico.controllers;

import com.sistema.medico.models.ConsultaMedica;
import com.sistema.medico.repositories.CitaRepository;
import com.sistema.medico.repositories.ConsultaMedicaRepository;
import com.sistema.medico.repositories.PacienteRepository;
import com.sistema.medico.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/** Conteos del tablero de inicio. Solo números: ningún dato clínico ni nombres. */
@RestController
@RequiredArgsConstructor
public class EstadisticasController {

    private final PacienteRepository pacienteRepository;
    private final ConsultaMedicaRepository consultaRepository;
    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/api/estadisticas")
    @Transactional(readOnly = true)
    public Map<String, Long> estadisticas() {
        LocalDateTime hoy = LocalDate.now().atStartOfDay();
        LocalDateTime manana = hoy.plusDays(1);
        return Map.of(
                "pacientes", pacienteRepository.count(),
                "consultasHoy", consultaRepository.countByFechaHoraAtencionBetween(hoy, manana),
                "consultasSemana", consultaRepository.countByFechaHoraAtencionBetween(hoy.minusDays(6), manana),
                "citasHoy", citaRepository.countByFechaHoraBetween(hoy, manana),
                "enEspera", citaRepository.countByEstadoAndFechaHoraBetween("EnEspera", hoy, manana),
                "porAtender", consultaRepository.countByEstadoConsulta(ConsultaMedica.TRIAJE),
                "borradores", consultaRepository.countByEstadoConsulta(ConsultaMedica.BORRADOR),
                "usuariosActivos", usuarioRepository.countByEstadoTrue());
    }
}
