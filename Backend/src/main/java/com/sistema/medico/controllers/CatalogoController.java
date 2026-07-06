package com.sistema.medico.controllers;

import com.sistema.medico.models.CatalogoCie10;
import com.sistema.medico.repositories.CatalogoCie10Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos")
@CrossOrigin(origins = "*")
public class CatalogoController {

    @Autowired
    private CatalogoCie10Repository catalogoCie10Repository;

    @GetMapping("/cie10/buscar")
    public ResponseEntity<List<CatalogoCie10>> buscarCie10(@RequestParam("q") String query) {
        try {
            List<CatalogoCie10> resultados = catalogoCie10Repository.findTop50ByNombreEnfermedadContainingIgnoreCaseOrCodigoCieContainingIgnoreCase(query, query);
            return ResponseEntity.ok(resultados);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
