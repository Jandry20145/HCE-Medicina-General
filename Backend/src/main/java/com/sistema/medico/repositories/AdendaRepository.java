package com.sistema.medico.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdendaRepository extends JpaRepository<com.sistema.medico.models.Adenda, Integer> {
    List<com.sistema.medico.models.Adenda> findByConsultaMedica_IdConsultaOrderByFechaAsc(Integer idConsulta);
}
