package com.sistema.medico.repositories;

import com.sistema.medico.models.ConsultaMedica;
import com.sistema.medico.models.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsultaMedicaRepository extends JpaRepository<ConsultaMedica, Integer> {
    List<ConsultaMedica> findByHistoriaClinicaOrderByFechaHoraAtencionDesc(HistoriaClinica historiaClinica);

    List<ConsultaMedica> findByHistoriaClinica_IdHistoriaClinicaOrderByFechaHoraAtencionDesc(Integer idHistoriaClinica);

    long countByFechaHoraAtencionBetween(LocalDateTime desde, LocalDateTime hasta);

    List<ConsultaMedica> findTop5ByOrderByFechaHoraAtencionDesc();
}
