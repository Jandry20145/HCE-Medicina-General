package com.sistema.medico.controllers;

import com.sistema.medico.models.ConsultaMedica;
import com.sistema.medico.models.HistoriaClinica;
import com.sistema.medico.models.Paciente;
import com.sistema.medico.repositories.ConsultaMedicaRepository;
import com.sistema.medico.repositories.HistoriaClinicaRepository;
import com.sistema.medico.repositories.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/historia-clinica")
@CrossOrigin(origins = "*")
public class HistoriaClinicaController {

    @Autowired
    private HistoriaClinicaRepository historiaClinicaRepository;

    @Autowired
    private ConsultaMedicaRepository consultaMedicaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<?> getHistoriaCompleta(@PathVariable Integer idPaciente) {
        Optional<Paciente> pacienteOpt = pacienteRepository.findById(idPaciente);
        if (!pacienteOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Paciente paciente = pacienteOpt.get();
        Optional<HistoriaClinica> hcOpt = historiaClinicaRepository.findByPaciente(paciente);
        
        if (!hcOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        HistoriaClinica hc = hcOpt.get();
        
        // Obtener historial cronológico de consultas
        List<ConsultaMedica> consultas = consultaMedicaRepository.findByHistoriaClinicaOrderByFechaHoraAtencionDesc(hc);

        Map<String, Object> response = new HashMap<>();
        response.put("paciente", paciente);
        response.put("historia_clinica", hc);
        response.put("consultas", consultas);

        return ResponseEntity.ok(response);
    }
}
