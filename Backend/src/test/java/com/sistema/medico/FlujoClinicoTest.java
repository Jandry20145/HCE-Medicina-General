package com.sistema.medico;

import com.jayway.jsonpath.JsonPath;
import com.sistema.medico.repositories.ConsultaMedicaRepository;
import com.sistema.medico.repositories.HistoriaClinicaRepository;
import com.sistema.medico.repositories.SignosVitalesRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FlujoClinicoTest extends ApiTestBase {

    @Autowired private HistoriaClinicaRepository historiaRepository;
    @Autowired private ConsultaMedicaRepository consultaRepository;
    @Autowired private SignosVitalesRepository signosRepository;

    private Integer crearPaciente(Cookie quien, String cedula) throws Exception {
        String body = mockMvc.perform(post("/api/pacientes").cookie(quien).contentType(MediaType.APPLICATION_JSON)
                        .content(pacienteJson(cedula)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.idPaciente");
    }

    private String consulta(Integer idHistoria, String extra) {
        return """
                {"idHistoriaClinica":%d,"idMedico":999,"motivoConsulta":"Dolor de garganta",
                 "signosVitales":{"temperatura":38.2,"presionArterial":"120/80","pulso":88,"frecuenciaRespiratoria":18,
                                  "saturacionOxigeno":97,"pesoKg":65.5,"tallaCm":162},
                 "examenFisico":[{"regionAnatomica":"Cabeza y Cuello","hallazgos":"Faringe eritematosa"}],
                 "diagnosticos":[{"idCie10":%s,"tipoDiagnostico":"Presuntivo","condicionDiagnostico":"Principal"}],
                 "tratamientos":[{"nombreMedicamento":"Paracetamol","formaFarmaceutica":"Tableta","concentracion":"500 mg","dosis":"1 tableta","via":"Oral","frecuencia":"Cada 8 horas","duracion":"3 días","cantidad":"9"}]%s}
                """.formatted(idHistoria, "%s", extra);
    }

    @Test
    void enfermeriaCreaPacienteConHistoriaYNumeroAsignadoPorElServidor() throws Exception {
        Cookie enfermeria = sesion("enfermeria.prueba");
        Integer id = crearPaciente(enfermeria, "0102030400");

        assertThat(historiaRepository.findByPaciente_IdPaciente(id)).isPresent();
        mockMvc.perform(get("/api/pacientes/" + id).cookie(enfermeria))
                .andExpect(jsonPath("$.numeroHistoriaClinica").value(String.format("HC-%05d", id)));

        // La misma cédula no se registra dos veces y una cédula inválida se rechaza.
        mockMvc.perform(post("/api/pacientes").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON)
                .content(pacienteJson("0102030400"))).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/pacientes").cookie(enfermeria).contentType(MediaType.APPLICATION_JSON)
                        .content(pacienteJson("1234567890")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("La cédula ingresada no es válida."));
    }

    @Test
    void consultaCompletaGuardaSignosYElMedicoEsElDeLaSesion() throws Exception {
        Cookie medico = sesion("medico.prueba");
        Integer idPaciente = crearPaciente(medico, CEDULA_VALIDA);
        Integer idHistoria = historiaRepository.findByPaciente_IdPaciente(idPaciente).orElseThrow().getIdHistoriaClinica();

        String body = mockMvc.perform(post("/api/consultas").cookie(medico).contentType(MediaType.APPLICATION_JSON)
                        .content(consulta(idHistoria, "").formatted(idCie10)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer idConsulta = JsonPath.read(body, "$.consultaId");

        var guardada = consultaRepository.findById(idConsulta).orElseThrow();
        assertThat(guardada.getMedico().getUsername()).isEqualTo("medico.prueba"); // ignora "idMedico":999
        var signos = signosRepository.findByConsultaMedica_IdConsulta(idConsulta).orElseThrow();
        assertThat(signos.getPesoKg()).isEqualByComparingTo("65.5");
        assertThat(signos.getSaturacionOxigeno()).isEqualTo(97);

        mockMvc.perform(get("/api/consultas/" + idConsulta).cookie(sesion("enfermeria.prueba")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagnosticos[0].catalogoCie10.codigoCie").exists())
                .andExpect(content().string(not(containsString("passwordHash"))));
    }

    @Test
    void unDiagnosticoInexistenteNoDejaUnaConsultaAMedias() throws Exception {
        Cookie medico = sesion("medico.prueba");
        Integer idPaciente = crearPaciente(medico, "0912345675");
        Integer idHistoria = historiaRepository.findByPaciente_IdPaciente(idPaciente).orElseThrow().getIdHistoriaClinica();
        long antes = consultaRepository.count();

        mockMvc.perform(post("/api/consultas").cookie(medico).contentType(MediaType.APPLICATION_JSON)
                        .content(consulta(idHistoria, "").formatted(987654)))
                .andExpect(status().isBadRequest());

        assertThat(consultaRepository.count()).isEqualTo(antes);
    }

    @Test
    void signosFueraDeRangoSeRechazanConMensajeClaro() throws Exception {
        Cookie medico = sesion("medico.prueba");
        String json = """
                {"idHistoriaClinica":1,"motivoConsulta":"Control","signosVitales":{"temperatura":3.7,"pulso":900}}
                """;
        mockMvc.perform(post("/api/consultas").cookie(medico).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Temperatura fuera de rango")))
                .andExpect(jsonPath("$.error", containsString("Pulso fuera de rango")));
    }
}
