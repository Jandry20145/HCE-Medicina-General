package com.sistema.medico.repositories;

import com.sistema.medico.models.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TratamientoRepository extends JpaRepository<Tratamiento, Integer> {
    List<Tratamiento> findByConsultaMedica_IdConsulta(Integer idConsulta);
}
