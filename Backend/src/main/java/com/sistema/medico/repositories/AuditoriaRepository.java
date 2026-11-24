package com.sistema.medico.repositories;

import com.sistema.medico.models.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findTop200ByOrderByFechaDescIdDesc();
}
