package com.sistema.medico.controllers;

import com.sistema.medico.models.CatalogoCie10;
import com.sistema.medico.repositories.CatalogoCie10Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoCie10Repository catalogoCie10Repository;

    /** Hasta 50 coincidencias por código o nombre; menos de 2 caracteres no busca. */
    @GetMapping("/cie10/buscar")
    public List<CatalogoCie10> buscarCie10(@RequestParam("q") String q) {
        String texto = q.trim();
        if (texto.length() < 2 || texto.length() > 100) {
            return List.of();
        }
        return catalogoCie10Repository
                .findTop50ByNombreEnfermedadContainingIgnoreCaseOrCodigoCieContainingIgnoreCase(texto, texto);
    }
}
