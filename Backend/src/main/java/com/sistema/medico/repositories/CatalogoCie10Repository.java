package com.sistema.medico.repositories;

import com.sistema.medico.models.CatalogoCie10;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CatalogoCie10Repository extends JpaRepository<CatalogoCie10, Integer> {
    long count();
    java.util.List<CatalogoCie10> findTop50ByNombreEnfermedadContainingIgnoreCaseOrCodigoCieContainingIgnoreCase(String nombre, String codigo);
}
