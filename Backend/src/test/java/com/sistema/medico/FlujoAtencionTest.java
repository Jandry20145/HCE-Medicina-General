package com.sistema.medico;

import com.jayway.jsonpath.JsonPath;
import com.sistema.medico.repositories.CitaRepository;
import com.sistema.medico.repositories.HistoriaClinicaRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Recorrido completo: cita → llegada → triaje → consulta → firma → adenda → documentos. */
class FlujoAtencionTest extends ApiTestBase {

    @Autowired private HistoriaClinicaRepository historiaRepository;
    @Autowired private CitaRepository citaRepository;

    private String enviar(String url, Cookie quien, String json, int esperado) throws Exception {
        return mockMvc.perform(post(url).cookie(quien).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().is(esperado)).andReturn().getResponse().getContentAsString();
    }

    private Integer paciente(Cookie quien, String cedula) throws Exception {
        return JsonPath.read(enviar("/api/pacientes", quien, pacienteJson(cedula), 201), "$.idPaciente");
    }

    private static String consulta(Integer idHistoria, String medicamento, Integer idCie10) {
        return """
                {"idHistoriaClinica":%d,"motivoConsulta":"Dolor de garganta","enfermedadActual":"Dos días de evolución",
                 "diagnosticos":[{"idCie10":%d,"tipoDiagnostico":"Presuntivo","condicionDiagnostico":"Principal"}],
                 "tratamientos":[{"nombreMedicamento":"%s","formaFarmaceutica":"Tableta","concentracion":"500 mg",
                   "dosis":"1 tableta","via":"Oral","frecuencia":"Cada 8 horas","duracion":"3 días","cantidad":"9"}],
                 "ordenes":[{"tipo":"Laboratorio","descripcion":"Biometría hemática","prioridad":"Rutina"}]}
                """.formatted(idHistoria, idCie10, medicamento);
    }

    @Test
    void recorridoCompletoDeEnfermeriaAMedico() throws Exception {
        Cookie enfermeria = sesion("enfermeria.prueba");
        Cookie medico = sesion("medico.prueba");
        Integer idPaciente = paciente(enfermeria, "1104567894");
        Integer idHistoria = historiaRepository.findByPaciente_IdPaciente(idPaciente).orElseThrow().getIdHistoriaClinica();

        // Agenda: cita mañana a las 10:00; otra a la misma hora choca.
        String manana = LocalDate.now().plusDays(1) + "T10:00:00";
        Integer idCita = JsonPath.read(enviar("/api/citas", enfermeria,
                "{\"idPaciente\":%d,\"fechaHora\":\"%s\",\"motivo\":\"Control\"}".formatted(idPaciente, manana), 201), "$.idCita");
        enviar("/api/citas", enfermeria, "{\"idPaciente\":%d,\"fechaHora\":\"%s\"}".formatted(idPaciente, manana), 409);

        // Llegada y triaje.
        enviar("/api/citas/" + idCita + "/estado", enfermeria, "{\"estado\":\"EnEspera\"}", 200);
        String triaje = """
                {"idPaciente":%d,"idCita":%d,"motivo":"Odinofagia","alergiasReportadas":"Penicilina",
                 "signosVitales":{"temperatura":38.6,"pulso":96,"saturacionOxigeno":97,"pesoKg":68,"tallaCm":160}}
                """.formatted(idPaciente, idCita);
        Integer idConsulta = JsonPath.read(enviar("/api/consultas/triaje", enfermeria, triaje, 201), "$.consultaId");
        assertThat(citaRepository.findById(idCita).orElseThrow().getEstado()).isEqualTo("EnAtencion");

        // El médico ve el triaje en su cola, lo completa y lo firma.
        mockMvc.perform(get("/api/consultas/pendientes").cookie(medico))
                .andExpect(content().string(containsString("\"idConsulta\":" + idConsulta)));
        mockMvc.perform(put("/api/consultas/" + idConsulta).cookie(medico).contentType(MediaType.APPLICATION_JSON)
                .content(consulta(idHistoria, "Paracetamol", idCie10))).andExpect(status().isOk());
        enviar("/api/consultas/" + idConsulta + "/firmar", medico, "{}", 200);
        assertThat(citaRepository.findById(idCita).orElseThrow().getEstado()).isEqualTo("Atendida");

        // Firmada: no se edita; se corrige con adenda.
        mockMvc.perform(put("/api/consultas/" + idConsulta).cookie(medico).contentType(MediaType.APPLICATION_JSON)
                .content(consulta(idHistoria, "Paracetamol", idCie10))).andExpect(status().isConflict());
        enviar("/api/consultas/" + idConsulta + "/adendas", medico,
                "{\"texto\":\"Se agrega: amígdalas sin exudado\",\"motivo\":\"Omisión en examen físico\"}", 201);

        // Documentos, resultado de la orden y detalle completo.
        Integer idCert = JsonPath.read(enviar("/api/consultas/" + idConsulta + "/certificados", medico,
                "{\"tipo\":\"Reposo\",\"diasReposo\":2}", 201), "$.idCertificado");
        mockMvc.perform(get("/api/pdf/receta/" + idConsulta).cookie(medico)).andExpect(status().isOk());
        mockMvc.perform(get("/api/pdf/certificado/" + idCert).cookie(medico)).andExpect(status().isOk());

        String detalle = mockMvc.perform(get("/api/consultas/" + idConsulta).cookie(enfermeria))
                .andExpect(jsonPath("$.consulta.estadoConsulta").value("Firmada"))
                .andExpect(jsonPath("$.consulta.alergiasReportadas").value("Penicilina"))
                .andExpect(jsonPath("$.signosVitales.enfermero.username").value("enfermeria.prueba"))
                .andExpect(jsonPath("$.adendas[0].motivo").value("Omisión en examen físico"))
                .andExpect(jsonPath("$.tratamientos[0].cantidad").value("9"))
                .andReturn().getResponse().getContentAsString();
        Integer idOrden = JsonPath.read(detalle, "$.ordenes[0].idOrden");
        mockMvc.perform(put("/api/ordenes/" + idOrden + "/resultado").cookie(medico).contentType(MediaType.APPLICATION_JSON)
                .content("{\"resultado\":\"Leucocitos 12 000\"}")).andExpect(jsonPath("$.estado").value("Resultado"));
        enviar("/api/ordenes/" + idOrden + "/revisar", medico, "{}", 200);
    }

    @Test
    void noSeFirmaSinDiagnosticoNiSePrescribenFiscalizados() throws Exception {
        Cookie medico = sesion("medico.prueba");
        Integer idPaciente = paciente(medico, "0601234560");
        Integer idHistoria = historiaRepository.findByPaciente_IdPaciente(idPaciente).orElseThrow().getIdHistoriaClinica();

        String sinDx = "{\"idHistoriaClinica\":%d,\"motivoConsulta\":\"Control\"}".formatted(idHistoria);
        Integer idConsulta = JsonPath.read(enviar("/api/consultas", medico, sinDx, 201), "$.consultaId");
        mockMvc.perform(post("/api/consultas/" + idConsulta + "/firmar").cookie(medico))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("al menos un diagnóstico")));

        mockMvc.perform(put("/api/consultas/" + idConsulta).cookie(medico).contentType(MediaType.APPLICATION_JSON)
                        .content(consulta(idHistoria, "Clonazepam", idCie10)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("receta especial")));
    }

    @Test
    void elAdministradorConfiguraElHorarioYLaAgendaLoRespeta() throws Exception {
        Cookie admin = sesion("admin.prueba");
        Cookie enfermeria = sesion("enfermeria.prueba");
        mockMvc.perform(put("/api/admin/configuracion").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreEstablecimiento\":\"Consultorio Prueba\",\"horaApertura\":\"08:00\",\"horaCierre\":\"12:00\",\"duracionCitaMin\":30}"))
                .andExpect(status().isOk());
        try {
            Integer idPaciente = paciente(enfermeria, "1709876542");
            String tarde = LocalDate.now().plusDays(2) + "T15:00:00";
            mockMvc.perform(post("/api/citas").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"idPaciente\":%d,\"fechaHora\":\"%s\"}".formatted(idPaciente, tarde)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", containsString("Fuera del horario")));
        } finally {
            mockMvc.perform(put("/api/admin/configuracion").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombreEstablecimiento\":\"Consultorio de prueba\",\"horaApertura\":\"00:00\",\"horaCierre\":\"23:59\",\"duracionCitaMin\":20}"));
        }
    }
}
