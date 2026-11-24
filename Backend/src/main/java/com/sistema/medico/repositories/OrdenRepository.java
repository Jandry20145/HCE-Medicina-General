package com.sistema.medico.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdenRepository extends JpaRepository<com.sistema.medico.models.Orden, Integer> {
    List<com.sistema.medico.models.Orden> findByConsultaMedica_IdConsulta(Integer idConsulta);

    // Solo para reemplazar el contenido de un borrador; una consulta firmada nunca se toca.
    void deleteByConsultaMedica_IdConsulta(Integer idConsulta);
}
