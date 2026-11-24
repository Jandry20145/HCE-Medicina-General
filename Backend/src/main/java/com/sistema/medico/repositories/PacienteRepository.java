package com.sistema.medico.repositories;

import com.sistema.medico.models.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    boolean existsByCedulaIdentidad(String cedulaIdentidad);

    boolean existsByCedulaIdentidadAndIdPacienteNot(String cedulaIdentidad, Integer idPaciente);

    List<Paciente> findAllByOrderByApellidosCompletosAscNombresCompletosAsc();
}
