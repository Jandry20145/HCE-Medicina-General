package com.sistema.medico.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcedimientoEnfermeriaRepository extends JpaRepository<com.sistema.medico.models.ProcedimientoEnfermeria, Integer> {
    List<com.sistema.medico.models.ProcedimientoEnfermeria> findByPaciente_IdPacienteOrderByFechaDesc(Integer idPaciente);
}
