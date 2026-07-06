package com.sistema.medico.controllers;

import com.sistema.medico.models.HistoriaClinica;
import com.sistema.medico.models.Paciente;
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
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private HistoriaClinicaRepository historiaClinicaRepository;

    @GetMapping
    public ResponseEntity<List<Paciente>> getAllPacientes() {
        return ResponseEntity.ok(pacienteRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPacienteById(@PathVariable Integer id) {
        Optional<Paciente> paciente = pacienteRepository.findById(id);
        if (paciente.isPresent()) {
            return ResponseEntity.ok(paciente.get());
        }
        return ResponseEntity.notFound().build();
    }

    private boolean isValidCedulaEcuatoriana(String cedula) {
        if (cedula == null || cedula.length() != 10 || !cedula.matches("\\d+")) {
            return false;
        }
        int provincia = Integer.parseInt(cedula.substring(0, 2));
        if (provincia < 1 || provincia > 24) {
            return false;
        }
        int tercerDigito = Integer.parseInt(cedula.substring(2, 3));
        if (tercerDigito >= 6) {
            return false; // Solo naturales por ahora
        }
        
        int suma = 0;
        for (int i = 0; i < 9; i++) {
            int digito = Character.getNumericValue(cedula.charAt(i));
            if (i % 2 == 0) { // Posiciones impares (índice 0, 2, 4...)
                int multi = digito * 2;
                if (multi > 9) multi -= 9;
                suma += multi;
            } else { // Posiciones pares (índice 1, 3, 5...)
                suma += digito;
            }
        }
        
        int modulo = suma % 10;
        int verificador = modulo == 0 ? 0 : 10 - modulo;
        int ultimoDigito = Character.getNumericValue(cedula.charAt(9));
        
        return verificador == ultimoDigito;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearPaciente(@RequestBody Paciente paciente) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (!isValidCedulaEcuatoriana(paciente.getCedulaIdentidad())) {
                response.put("error", "La cédula ingresada no es válida.");
                return ResponseEntity.badRequest().body(response);
            }
            if (pacienteRepository.existsByCedulaIdentidad(paciente.getCedulaIdentidad())) {
                response.put("error", "Ya existe un paciente con esta cédula de identidad.");
                return ResponseEntity.badRequest().body(response);
            }

            // Asignar temporalmente un UUID para evadir la restricción UNIQUE y de nulidad
            paciente.setNumeroHistoriaClinica(java.util.UUID.randomUUID().toString());

            Paciente pacienteGuardado = pacienteRepository.save(paciente);
            
            // Re-asignar el HC basado en su ID autogenerado
            String newHc = String.format("HC-%02d", pacienteGuardado.getIdPaciente());
            pacienteGuardado.setNumeroHistoriaClinica(newHc);
            pacienteGuardado = pacienteRepository.save(pacienteGuardado);
            
            HistoriaClinica historia = new HistoriaClinica();
            historia.setPaciente(pacienteGuardado);
            HistoriaClinica historiaGuardada = historiaClinicaRepository.save(historia);

            response.put("mensaje", "Paciente e Historia Clínica creados con éxito.");
            response.put("paciente", pacienteGuardado);
            response.put("historia_clinica_id", historiaGuardada.getIdHistoriaClinica());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", "Error interno al crear el paciente: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizarPaciente(@PathVariable Integer id, @RequestBody Paciente detallesPaciente) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Paciente> pacienteExistente = pacienteRepository.findById(id);
            if (!pacienteExistente.isPresent()) {
                response.put("error", "Paciente no encontrado");
                return ResponseEntity.notFound().build();
            }

            Paciente paciente = pacienteExistente.get();
            paciente.setNombresCompletos(detallesPaciente.getNombresCompletos());
            paciente.setApellidosCompletos(detallesPaciente.getApellidosCompletos());
            paciente.setFechaNacimiento(detallesPaciente.getFechaNacimiento());
            paciente.setSexo(detallesPaciente.getSexo());
            paciente.setEstadoCivil(detallesPaciente.getEstadoCivil());
            paciente.setOcupacion(detallesPaciente.getOcupacion());
            paciente.setDireccion(detallesPaciente.getDireccion());
            paciente.setTelefono(detallesPaciente.getTelefono());
            paciente.setCorreoElectronico(detallesPaciente.getCorreoElectronico());
            paciente.setSeguroSalud(detallesPaciente.getSeguroSalud());

            Paciente actualizado = pacienteRepository.save(paciente);
            response.put("mensaje", "Paciente actualizado con éxito");
            response.put("paciente", actualizado);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error interno al actualizar el paciente: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
