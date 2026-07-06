package com.sistema.medico.repositories;

import com.sistema.medico.models.SignosVitales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignosVitalesRepository extends JpaRepository<SignosVitales, Integer> {
    Optional<SignosVitales> findByConsultaMedica_IdConsulta(Integer idConsulta);
}
