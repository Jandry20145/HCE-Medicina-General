package com.sistema.medico.repositories;

import com.sistema.medico.models.Antecedente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AntecedenteRepository extends JpaRepository<Antecedente, Integer> {
    List<Antecedente> findByPaciente_IdPaciente(Integer idPaciente);
}
