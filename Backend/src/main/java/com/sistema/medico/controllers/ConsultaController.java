package com.sistema.medico.controllers;

import com.sistema.medico.models.*;
import com.sistema.medico.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin(origins = "*")
public class ConsultaController {

    @Autowired private ConsultaMedicaRepository consultaMedicaRepository;
    @Autowired private HistoriaClinicaRepository historiaClinicaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SignosVitalesRepository signosVitalesRepository;
    @Autowired private ExamenFisicoRepository examenFisicoRepository;
    @Autowired private DiagnosticoRepository diagnosticoRepository;
    @Autowired private TratamientoRepository tratamientoRepository;
    @Autowired private CatalogoCie10Repository cie10Repository;
    @Autowired private CatalogoMedicamentoRepository medicamentoRepository;

    public static class ConsultaDTO {
        public Integer idHistoriaClinica;
        public Integer idMedico;
        public String motivoConsulta;
        public String enfermedadActual;
        public String evolucion;
        public String recomendaciones;
        public java.time.LocalDate proximoControl;
        
        public SignosVitales signosVitales;
        public List<ExamenFisico> examenFisico;
        
        public List<DiagnosticoDTO> diagnosticos;
        public List<TratamientoDTO> tratamientos;
    }

    public static class DiagnosticoDTO {
        public Integer idCie10;
        public String tipoDiagnostico;
        public String condicionDiagnostico;
        public String descripcionClinica;
    }

    public static class TratamientoDTO {
        public String codigoMedicamento;
        public Integer idMedicamento;
        public String nombreMedicamento;
        public String indicacionesDosis;
    }

    @GetMapping
    public ResponseEntity<List<ConsultaMedica>> getAllConsultas() {
        return ResponseEntity.ok(consultaMedicaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getConsultaCompleta(@PathVariable Integer id) {
        Optional<ConsultaMedica> optConsulta = consultaMedicaRepository.findById(id);
        if (!optConsulta.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        ConsultaMedica consulta = optConsulta.get();
        Map<String, Object> response = new HashMap<>();
        response.put("consulta", consulta);
        
        Optional<SignosVitales> signosOpt = signosVitalesRepository.findByConsultaMedica_IdConsulta(id);
        signosOpt.ifPresent(sv -> response.put("signosVitales", sv));
        
        List<ExamenFisico> examenes = examenFisicoRepository.findByConsultaMedica_IdConsulta(id);
        response.put("examenFisico", examenes);
        
        List<Diagnostico> diagnosticos = diagnosticoRepository.findByConsultaMedica_IdConsulta(id);
        response.put("diagnosticos", diagnosticos);
        
        List<Tratamiento> tratamientos = tratamientoRepository.findByConsultaMedica_IdConsulta(id);
        response.put("tratamientos", tratamientos);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearConsulta(@RequestBody ConsultaDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            HistoriaClinica hc = historiaClinicaRepository.findById(dto.idHistoriaClinica)
                    .orElseThrow(() -> new RuntimeException("Historia clinica no encontrada"));
            Usuario medico = usuarioRepository.findById(dto.idMedico)
                    .orElseThrow(() -> new RuntimeException("Médico no encontrado"));

            // Guardar Consulta
            ConsultaMedica consulta = new ConsultaMedica();
            consulta.setHistoriaClinica(hc);
            consulta.setMedico(medico);
            consulta.setMotivoConsulta(dto.motivoConsulta);
            consulta.setEnfermedadActual(dto.enfermedadActual);
            consulta.setEvolucion(dto.evolucion);
            consulta.setRecomendaciones(dto.recomendaciones);
            consulta.setProximoControl(dto.proximoControl);
            consulta.setEstadoConsulta("Finalizada");
            ConsultaMedica savedConsulta = consultaMedicaRepository.save(consulta);

            // Guardar Signos Vitales
            if (dto.signosVitales != null) {
                dto.signosVitales.setConsultaMedica(savedConsulta);
                dto.signosVitales.setEnfermero(medico); // assuming medico took it for simplicity
                signosVitalesRepository.save(dto.signosVitales);
            }

            // Guardar Examen Fisico
            if (dto.examenFisico != null) {
                for (ExamenFisico ef : dto.examenFisico) {
                    ef.setConsultaMedica(savedConsulta);
                    examenFisicoRepository.save(ef);
                }
            }

            // Guardar Diagnosticos
            if (dto.diagnosticos != null) {
                for (DiagnosticoDTO diagDto : dto.diagnosticos) {
                    CatalogoCie10 cie10 = cie10Repository.findById(diagDto.idCie10)
                            .orElseThrow(() -> new RuntimeException("CIE10 no encontrado"));
                    Diagnostico d = new Diagnostico();
                    d.setConsultaMedica(savedConsulta);
                    d.setCatalogoCie10(cie10);
                    d.setTipoDiagnostico(diagDto.tipoDiagnostico);
                    d.setCondicionDiagnostico(diagDto.condicionDiagnostico);
                    d.setDescripcionClinica(diagDto.descripcionClinica);
                    diagnosticoRepository.save(d);
                }
            }

            // Guardar Tratamientos
            if (dto.tratamientos != null) {
                for (TratamientoDTO tratDto : dto.tratamientos) {
                    CatalogoMedicamento med = null;
                    if(tratDto.idMedicamento != null) {
                        med = medicamentoRepository.findById(tratDto.idMedicamento).orElse(null);
                    } else if(tratDto.codigoMedicamento != null && !tratDto.codigoMedicamento.isEmpty()) {
                         med = medicamentoRepository.findByCodigoMedicamento(tratDto.codigoMedicamento).orElse(null);
                    }
                    if (med != null || (tratDto.nombreMedicamento != null && !tratDto.nombreMedicamento.trim().isEmpty())) {
                        Tratamiento t = new Tratamiento();
                        t.setConsultaMedica(savedConsulta);
                        t.setMedicamento(med);
                        t.setNombreMedicamento(tratDto.nombreMedicamento);
                        t.setIndicacionesDosis(tratDto.indicacionesDosis);
                        tratamientoRepository.save(t);
                    }
                }
            }

            response.put("mensaje", "Consulta guardada exitosamente");
            response.put("consultaId", savedConsulta.getIdConsulta());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
