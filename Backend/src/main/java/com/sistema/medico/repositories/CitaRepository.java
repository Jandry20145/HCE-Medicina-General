package com.sistema.medico.repositories;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CitaRepository extends JpaRepository<com.sistema.medico.models.Cita, Integer> {
    List<com.sistema.medico.models.Cita> findByFechaHoraBetweenOrderByFechaHoraAsc(LocalDateTime desde, LocalDateTime hasta);

    List<com.sistema.medico.models.Cita> findByPaciente_IdPacienteOrderByFechaHoraDesc(Integer idPaciente);

    long countByFechaHoraBetween(LocalDateTime desde, LocalDateTime hasta);

    long countByEstadoAndFechaHoraBetween(String estado, LocalDateTime desde, LocalDateTime hasta);

    List<com.sistema.medico.models.Cita> findByConsulta_IdConsulta(Integer idConsulta);
}
