package com.sistema.medico.repositories;

import com.sistema.medico.models.ExamenFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamenFisicoRepository extends JpaRepository<ExamenFisico, Integer> {
    List<ExamenFisico> findByConsultaMedica_IdConsulta(Integer idConsulta);
}
