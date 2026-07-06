package com.sistema.medico.repositories;

import com.sistema.medico.models.Diagnostico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagnosticoRepository extends JpaRepository<Diagnostico, Integer> {
    List<Diagnostico> findByConsultaMedica_IdConsulta(Integer idConsulta);
}
