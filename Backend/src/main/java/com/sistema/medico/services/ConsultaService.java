package com.sistema.medico.services;

import com.sistema.medico.dto.ClinicaRequests;
import com.sistema.medico.dto.ConsultaRequest;
import com.sistema.medico.models.*;
import com.sistema.medico.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Ciclo de vida de la consulta: Triaje (enfermería) → Borrador (médico) → Firmada (bloqueada).
 * Después de firmar, solo se añaden adendas, resultados de órdenes y certificados.
 */
@Service
@RequiredArgsConstructor
public class ConsultaService {

    /**
     * Principios activos sujetos a fiscalización: requieren receta especial (AM 25-2020) que este
     * sistema no emite. shortcut: lista mínima de uso frecuente; reemplazar por el listado oficial
     * vigente de ARCSA/MSP cuando se verifique (especificación, tarea L10).
     */
    static final Set<String> FISCALIZADOS = Set.of(
            "morfina", "fentanilo", "metadona", "oxicodona", "hidromorfona", "petidina", "buprenorfina",
            "codeina", "diazepam", "clonazepam", "alprazolam", "lorazepam", "midazolam", "bromazepam",
            "fenobarbital", "metilfenidato", "ketamina", "zolpidem");

    private final ConsultaMedicaRepository consultaRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SignosVitalesRepository signosVitalesRepository;
    private final ExamenFisicoRepository examenFisicoRepository;
    private final DiagnosticoRepository diagnosticoRepository;
    private final TratamientoRepository tratamientoRepository;
    private final OrdenRepository ordenRepository;
    private final AdendaRepository adendaRepository;
    private final CertificadoRepository certificadoRepository;
    private final CitaRepository citaRepository;
    private final CatalogoCie10Repository cie10Repository;
    private final CatalogoMedicamentoRepository medicamentoRepository;

    // ---------------------------------------------------------------- triaje

    /** Enfermería abre la consulta con los signos vitales. Si viene de una cita, la pasa a "En atención". */
    @Transactional
    public ConsultaMedica triaje(ClinicaRequests.Triaje dto, String username) {
        HistoriaClinica hc = historiaClinicaRepository.findByPaciente_IdPaciente(dto.idPaciente())
                .orElseThrow(() -> new IllegalArgumentException("El paciente no tiene historia clínica"));
        Usuario enfermera = usuario(username);

        ConsultaMedica consulta = new ConsultaMedica();
        consulta.setHistoriaClinica(hc);
        consulta.setMotivoConsulta(dto.motivo().trim());
        consulta.setAlergiasReportadas(vacioANull(dto.alergiasReportadas()));
        consulta.setNotaEnfermeria(vacioANull(dto.notaEnfermeria()));
        consulta.setEstadoConsulta(ConsultaMedica.TRIAJE);
        consulta = consultaRepository.save(consulta);
        guardarSignos(consulta, dto.signosVitales(), enfermera);

        if (dto.idCita() != null) {
            Cita cita = citaRepository.findById(dto.idCita())
                    .orElseThrow(() -> new IllegalArgumentException("La cita no existe"));
            if (!cita.getPaciente().getIdPaciente().equals(dto.idPaciente())) {
                throw new IllegalArgumentException("La cita es de otro paciente");
            }
            cita.setEstado("EnAtencion");
            cita.setConsulta(consulta);
            if (cita.getLlegadaEn() == null) {
                cita.setLlegadaEn(LocalDateTime.now());
            }
        }
        return consulta;
    }

    // ---------------------------------------------------------------- borrador

    /** El médico abre una consulta nueva sin triaje previo. Queda en borrador. */
    @Transactional
    public ConsultaMedica crear(ConsultaRequest dto, String usernameMedico) {
        HistoriaClinica hc = historiaClinicaRepository.findById(dto.idHistoriaClinica())
                .orElseThrow(() -> new IllegalArgumentException("La historia clínica no existe"));
        ConsultaMedica consulta = new ConsultaMedica();
        consulta.setHistoriaClinica(hc);
        consulta.setEstadoConsulta(ConsultaMedica.BORRADOR);
        consulta.setMedico(usuario(usernameMedico));
        consulta.setMotivoConsulta(dto.motivoConsulta().trim());
        consulta = consultaRepository.save(consulta);
        escribir(consulta, dto);
        return consulta;
    }

    /** El médico completa un triaje o edita su borrador. Reemplaza todo el contenido clínico. */
    @Transactional
    public ConsultaMedica actualizar(Integer id, ConsultaRequest dto, String usernameMedico) {
        ConsultaMedica consulta = buscar(id);
        exigirNoFirmada(consulta);
        Usuario medico = usuario(usernameMedico);
        if (consulta.getMedico() != null && !consulta.getMedico().getIdUsuario().equals(medico.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta consulta la está atendiendo " + consulta.getMedico().getNombresCompletos());
        }
        consulta.setMedico(medico);
        consulta.setEstadoConsulta(ConsultaMedica.BORRADOR);
        consulta.setMotivoConsulta(dto.motivoConsulta().trim());

        examenFisicoRepository.deleteByConsultaMedica_IdConsulta(id);
        diagnosticoRepository.deleteByConsultaMedica_IdConsulta(id);
        tratamientoRepository.deleteByConsultaMedica_IdConsulta(id);
        ordenRepository.deleteByConsultaMedica_IdConsulta(id);
        escribir(consulta, dto);
        return consulta;
    }

    private void escribir(ConsultaMedica consulta, ConsultaRequest dto) {
        consulta.setEnfermedadActual(vacioANull(dto.enfermedadActual()));
        consulta.setRevisionSistemas(vacioANull(dto.revisionSistemas()));
        consulta.setEvolucion(vacioANull(dto.evolucion()));
        consulta.setRecomendaciones(vacioANull(dto.recomendaciones()));
        consulta.setProximoControl(dto.proximoControl());

        // Los signos tomados por enfermería conservan su autor: el médico solo los registra si faltan.
        if (dto.signosVitales() != null
                && signosVitalesRepository.findByConsultaMedica_IdConsulta(consulta.getIdConsulta()).isEmpty()) {
            guardarSignos(consulta, dto.signosVitales(), consulta.getMedico());
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
            String dci = t.nombreMedicamento().trim();
            if (esFiscalizado(dci)) {
                throw new IllegalArgumentException(dci + " requiere receta especial de medicamentos sujetos a "
                        + "fiscalización, que este sistema no emite. Use el recetario especial.");
            }
            CatalogoMedicamento med = null;
            if (t.idMedicamento() != null) {
                med = medicamentoRepository.findById(t.idMedicamento()).orElse(null);
            } else if (t.codigoMedicamento() != null && !t.codigoMedicamento().isBlank()) {
                med = medicamentoRepository.findByCodigoMedicamento(t.codigoMedicamento()).orElse(null);
            }
            Tratamiento tr = new Tratamiento();
            tr.setConsultaMedica(consulta);
            tr.setMedicamento(med);
            tr.setNombreMedicamento(dci);
            tr.setFormaFarmaceutica(t.formaFarmaceutica().trim());
            tr.setConcentracion(t.concentracion().trim());
            tr.setDosis(t.dosis().trim());
            tr.setVia(t.via().trim());
            tr.setFrecuencia(t.frecuencia().trim());
            tr.setDuracion(t.duracion().trim());
            tr.setCantidad(t.cantidad().trim());
            String indicaciones = vacioANull(t.indicacionesDosis());
            tr.setIndicacionesDosis(indicaciones != null ? indicaciones
                    : "%s vía %s %s por %s".formatted(tr.getDosis(), tr.getVia().toLowerCase(Locale.ROOT),
                    tr.getFrecuencia().toLowerCase(Locale.ROOT), tr.getDuracion()));
            tratamientoRepository.save(tr);
        }

        for (ConsultaRequest.OrdenNueva o : nn(dto.ordenes())) {
            Orden orden = new Orden();
            orden.setConsultaMedica(consulta);
            orden.setTipo(o.tipo());
            orden.setDescripcion(o.descripcion().trim());
            orden.setIndicacion(vacioANull(o.indicacion()));
            orden.setPrioridad(o.prioridad());
            orden.setEstado("Solicitada");
            ordenRepository.save(orden);
        }
    }

    // ---------------------------------------------------------------- firma y después

    /** Firma y bloquea la nota. Exige motivo y al menos un diagnóstico; cierra la cita vinculada. */
    @Transactional
    public ConsultaMedica firmar(Integer id, String usernameMedico) {
        ConsultaMedica consulta = buscar(id);
        exigirNoFirmada(consulta);
        Usuario medico = usuario(usernameMedico);
        if (consulta.getMedico() == null || !consulta.getMedico().getIdUsuario().equals(medico.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo el médico que redactó la consulta puede firmarla");
        }
        if (diagnosticoRepository.findByConsultaMedica_IdConsulta(id).isEmpty()) {
            throw new IllegalArgumentException("Registre al menos un diagnóstico antes de firmar");
        }
        consulta.setEstadoConsulta(ConsultaMedica.FIRMADA);
        consulta.setFirmadaEn(LocalDateTime.now());
        citaRepository.findByConsulta_IdConsulta(id).forEach(c -> c.setEstado("Atendida"));
        return consulta;
    }

    @Transactional
    public Adenda adenda(Integer id, ClinicaRequests.Adenda dto, String username) {
        ConsultaMedica consulta = buscar(id);
        if (!ConsultaMedica.FIRMADA.equals(consulta.getEstadoConsulta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La consulta aún no está firmada: edite el borrador");
        }
        Adenda adenda = new Adenda();
        adenda.setConsultaMedica(consulta);
        adenda.setTexto(dto.texto().trim());
        adenda.setMotivo(dto.motivo().trim());
        adenda.setAutor(username);
        adenda.setFecha(LocalDateTime.now());
        return adendaRepository.save(adenda);
    }

    @Transactional
    public Certificado certificado(Integer id, ClinicaRequests.Certificado dto, String username) {
        ConsultaMedica consulta = buscar(id);
        if (!ConsultaMedica.FIRMADA.equals(consulta.getEstadoConsulta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Firme la consulta antes de emitir certificados");
        }
        Certificado c = new Certificado();
        c.setConsultaMedica(consulta);
        c.setTipo(dto.tipo());
        if ("Reposo".equals(dto.tipo())) {
            if (dto.diasReposo() == null) {
                throw new IllegalArgumentException("Indique los días de reposo");
            }
            c.setDiasReposo(dto.diasReposo());
            c.setDesde(dto.desde() != null ? dto.desde() : consulta.getFechaHoraAtencion().toLocalDate());
            c.setHasta(c.getDesde().plusDays(dto.diasReposo() - 1L));
        }
        c.setObservaciones(vacioANull(dto.observaciones()));
        c.setEmitidoPor(username);
        c.setEmitidoEn(LocalDateTime.now());
        return certificadoRepository.save(c);
    }

    /** Resultado de una orden. Solo sobre consultas firmadas (los borradores reemplazan sus órdenes). */
    @Transactional
    public Orden resultado(Integer idOrden, ClinicaRequests.Resultado dto) {
        Orden orden = orden(idOrden);
        if (!ConsultaMedica.FIRMADA.equals(orden.getConsultaMedica().getEstadoConsulta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Firme la consulta antes de registrar resultados");
        }
        orden.setResultado(dto.resultado().trim());
        orden.setResultadoEn(LocalDateTime.now());
        orden.setEstado("Resultado");
        orden.setRevisadaPor(null);
        return orden;
    }

    @Transactional
    public Orden revisar(Integer idOrden, String username) {
        Orden orden = orden(idOrden);
        if (orden.getResultado() == null) {
            throw new IllegalArgumentException("La orden todavía no tiene resultado");
        }
        orden.setEstado("Revisada");
        orden.setRevisadaPor(username);
        return orden;
    }

    // ---------------------------------------------------------------- lectura

    @Transactional(readOnly = true)
    public Map<String, Object> detalle(Integer id) {
        ConsultaMedica consulta = buscar(id);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("consulta", consulta);
        r.put("paciente", consulta.getHistoriaClinica().getPaciente());
        signosVitalesRepository.findByConsultaMedica_IdConsulta(id).ifPresent(sv -> r.put("signosVitales", sv));
        r.put("examenFisico", examenFisicoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("diagnosticos", diagnosticoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("tratamientos", tratamientoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("ordenes", ordenRepository.findByConsultaMedica_IdConsulta(id));
        r.put("certificados", certificadoRepository.findByConsultaMedica_IdConsulta(id));
        r.put("adendas", adendaRepository.findByConsultaMedica_IdConsultaOrderByFechaAsc(id));
        return r;
    }

    /** Cola del médico: triajes esperando y borradores sin firmar, del más antiguo al más reciente. */
    @Transactional(readOnly = true)
    public List<ConsultaMedica> pendientes() {
        return consultaRepository.findByEstadoConsultaInOrderByFechaHoraAtencionAsc(
                List.of(ConsultaMedica.TRIAJE, ConsultaMedica.BORRADOR));
    }

    // ---------------------------------------------------------------- utilidades

    static boolean esFiscalizado(String dci) {
        String normal = Normalizer.normalize(dci, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return FISCALIZADOS.stream().anyMatch(f -> normal.matches(".*\\b" + f + "\\b.*"));
    }

    private void guardarSignos(ConsultaMedica consulta, ConsultaRequest.SignosVitales s, Usuario autor) {
        SignosVitales signos = new SignosVitales();
        signos.setConsultaMedica(consulta);
        signos.setEnfermero(autor);
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

    private ConsultaMedica buscar(Integer id) {
        return consultaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consulta no encontrada"));
    }

    private Orden orden(Integer id) {
        return ordenRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada"));
    }

    private Usuario usuario(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Usuario de la sesión no encontrado"));
    }

    private static void exigirNoFirmada(ConsultaMedica consulta) {
        if (ConsultaMedica.FIRMADA.equals(consulta.getEstadoConsulta())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La consulta está firmada y no se puede modificar. Añada una adenda.");
        }
    }

    private static <T> List<T> nn(List<T> lista) {
        return lista == null ? List.of() : lista;
    }

    private static String vacioANull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
