package com.sistema.medico.repositories;

import com.sistema.medico.models.HistoriaClinica;
import com.sistema.medico.models.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Integer> {
    Optional<HistoriaClinica> findByPaciente(Paciente paciente);
    Optional<HistoriaClinica> findByPaciente_IdPaciente(Integer idPaciente);
}
