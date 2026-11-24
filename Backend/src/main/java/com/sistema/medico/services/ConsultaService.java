package com.sistema.medico.services;

import com.sistema.medico.dto.ConsultaRequest;
import com.sistema.medico.models.*;
import com.sistema.medico.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsultaService {

    private final ConsultaMedicaRepository consultaRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SignosVitalesRepository signosVitalesRepository;
    private final ExamenFisicoRepository examenFisicoRepository;
    private final DiagnosticoRepository diagnosticoRepository;
    private final TratamientoRepository tratamientoRepository;
    private final CatalogoCie10Repository cie10Repository;
    private final CatalogoMedicamentoRepository medicamentoRepository;

    /**
     * Guarda la consulta con sus signos, examen, diagnósticos y tratamientos. Todo o nada:
     * si una parte falla (por ejemplo, un CIE-10 inexistente) no queda una consulta a medias.
     */
    @Transactional
    public ConsultaMedica crear(ConsultaRequest dto, String usernameMedico) {
        HistoriaClinica hc = historiaClinicaRepository.findById(dto.idHistoriaClinica())
                .orElseThrow(() -> new IllegalArgumentException("La historia clínica no existe"));
        Usuario medico = usuarioRepository.findByUsername(usernameMedico)
                .orElseThrow(() -> new IllegalStateException("Usuario de la sesión no encontrado"));

        ConsultaMedica consulta = new ConsultaMedica();
        consulta.setHistoriaClinica(hc);
        consulta.setMedico(medico);
        consulta.setMotivoConsulta(dto.motivoConsulta().trim());
        consulta.setEnfermedadActual(dto.enfermedadActual());
        consulta.setEvolucion(dto.evolucion());
        consulta.setRecomendaciones(dto.recomendaciones());
        consulta.setProximoControl(dto.proximoControl());
        consulta.setEstadoConsulta("Finalizada");
        consulta = consultaRepository.save(consulta);

        if (dto.signosVitales() != null) {
            ConsultaRequest.SignosVitales s = dto.signosVitales();
            SignosVitales signos = new SignosVitales();
            signos.setConsultaMedica(consulta);
            signos.setEnfermero(medico);
            signos.setTemperatura(s.temperatura());
            signos.setPresionArterial(vacioANull(s.presionArterial()));
            signos.setPulso(s.pulso());
            signos.setFrecuenciaRespiratoria(s.frecuenciaRespiratoria());
            signos.setSaturacionOxigeno(s.saturacionOxigeno());
            signos.setPesoKg(s.pesoKg());
            signos.setTallaCm(s.tallaCm());
            signos.setGrupoSanguineo(vacioANull(s.grupoSanguineo()));
            signosVitalesRepository.save(signos);
        }

        for (ConsultaRequest.Examen e : nn(dto.examenFisico())) {
            ExamenFisico examen = new ExamenFisico();
            examen.setConsultaMedica(consulta);
            examen.setRegionAnatomica(e.regionAnatomica().trim());
            examen.setHallazgos(e.hallazgos().trim());
            examenFisicoRepository.save(examen);
        }

        for (ConsultaRequest.Diagnostico d : nn(dto.diagnosticos())) {
            Diagnostico diagnostico = new Diagnostico();
            diagnostico.setConsultaMedica(consulta);
            diagnostico.setCatalogoCie10(cie10Repository.findById(d.idCie10())
                    .orElseThrow(() -> new IllegalArgumentException("El diagnóstico CIE-10 seleccionado no existe")));
            diagnostico.setTipoDiagnostico(d.tipoDiagnostico());
            diagnostico.setCondicionDiagnostico(d.condicionDiagnostico());
            diagnostico.setDescripcionClinica(d.descripcionClinica());
            diagnosticoRepository.save(diagnostico);
        }

        for (ConsultaRequest.Tratamiento t : nn(dto.tratamientos())) {
            CatalogoMedicamento med = null;
            if (t.idMedicamento() != null) {
                med = medicamentoRepository.findById(t.idMedicamento()).orElse(null);
            } else if (t.codigoMedicamento() != null && !t.codigoMedicamento().isBlank()) {
                med = medicamentoRepository.findByCodigoMedicamento(t.codigoMedicamento()).orElse(null);
            }
            String nombre = vacioANull(t.nombreMedicamento());
            if (med == null && nombre == null) {
                throw new IllegalArgumentException("Cada tratamiento necesita el nombre del medicamento");
            }
            Tratamiento tratamiento = new Tratamiento();
            tratamiento.setConsultaMedica(consulta);
            tratamiento.setMedicamento(med);
            tratamiento.setNombreMedicamento(nombre);
            tratamiento.setIndicacionesDosis(t.indicacionesDosis().trim());
            tratamientoRepository.save(tratamiento);
        }
        return consulta;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detalle(Integer id) {
        ConsultaMedica consulta = consultaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consulta no encontrada"));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("consulta", consulta);
        r.put("paciente", consulta.getHistoriaClinica().getPaciente());
        signosVitalesRepository.findByConsultaMedica_IdConsulta(id).ifPresent(sv -> r.put("signosVitales", sv));
        r.put("examenFisico", examenFisicoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("diagnosticos", diagnosticoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("tratamientos", tratamientoRepository.findByConsultaMedica_IdConsulta(id));
        return r;
    }

    private static <T> List<T> nn(List<T> lista) {
        return lista == null ? List.of() : lista;
    }

    private static String vacioANull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
