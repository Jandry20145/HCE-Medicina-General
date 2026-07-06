package com.sistema.medico.repositories;

import com.sistema.medico.models.CatalogoMedicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CatalogoMedicamentoRepository extends JpaRepository<CatalogoMedicamento, Integer> {
    Optional<CatalogoMedicamento> findByCodigoMedicamento(String codigoMedicamento);
}
