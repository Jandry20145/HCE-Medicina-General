package com.sistema.medico.controllers;

import com.sistema.medico.models.Antecedente;
import com.sistema.medico.models.Paciente;
import com.sistema.medico.repositories.AntecedenteRepository;
import com.sistema.medico.repositories.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/antecedentes")
@CrossOrigin(origins = "*")
public class AntecedenteController {

    @Autowired
    private AntecedenteRepository antecedenteRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    public static class AntecedenteDTO {
        public Integer idPaciente;
        public String tipoAntecedente;
        public String enfermedadAsociada;
        public String parentescoFamiliar;
        public String alergiasPrincipales;
        public String descripcionAdicional;
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<Antecedente>> getAntecedentesByPaciente(@PathVariable Integer idPaciente) {
        List<Antecedente> antecedentes = antecedenteRepository.findByPaciente_IdPaciente(idPaciente);
        return ResponseEntity.ok(antecedentes);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearAntecedente(@RequestBody AntecedenteDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Paciente> pacienteOpt = pacienteRepository.findById(dto.idPaciente);
            if (!pacienteOpt.isPresent()) {
                response.put("error", "Paciente no encontrado");
                return ResponseEntity.badRequest().body(response);
            }

            Antecedente ant = new Antecedente();
            ant.setPaciente(pacienteOpt.get());
            ant.setTipoAntecedente(dto.tipoAntecedente); // "Personal" o "Familiar"
            ant.setEnfermedadAsociada(dto.enfermedadAsociada);
            ant.setParentescoFamiliar(dto.parentescoFamiliar);
            ant.setAlergiasPrincipales(dto.alergiasPrincipales);
            ant.setDescripcionAdicional(dto.descripcionAdicional);

            Antecedente guardado = antecedenteRepository.save(ant);
            response.put("mensaje", "Antecedente registrado correctamente");
            response.put("antecedente", guardado);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error interno al guardar antecedente: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
