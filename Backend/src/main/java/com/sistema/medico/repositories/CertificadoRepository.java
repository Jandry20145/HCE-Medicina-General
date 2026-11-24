package com.sistema.medico.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificadoRepository extends JpaRepository<com.sistema.medico.models.Certificado, Integer> {
    List<com.sistema.medico.models.Certificado> findByConsultaMedica_IdConsulta(Integer idConsulta);
}
