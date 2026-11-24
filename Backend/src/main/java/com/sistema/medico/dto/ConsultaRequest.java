package com.sistema.medico.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Consulta completa enviada por el médico. El médico responsable NO viene aquí: es el
 * usuario de la sesión. Los rangos rechazan errores de digitación evidentes, no diagnostican.
 */
public record ConsultaRequest(
        @NotNull(message = "Falta la historia clínica") Integer idHistoriaClinica,
        @NotBlank(message = "El motivo de consulta es obligatorio") @Size(max = 5000) String motivoConsulta,
        @Size(max = 10000) String enfermedadActual,
        @Size(max = 10000) String evolucion,
        @Size(max = 10000) String recomendaciones,
        LocalDate proximoControl,
        @Valid SignosVitales signosVitales,
        @Valid @Size(max = 30) List<Examen> examenFisico,
        @Valid @Size(max = 20) List<Diagnostico> diagnosticos,
        @Valid @Size(max = 30) List<Tratamiento> tratamientos) {

    public record SignosVitales(
            @DecimalMin(value = "30.0", message = "Temperatura fuera de rango (30-45 °C)")
            @DecimalMax(value = "45.0", message = "Temperatura fuera de rango (30-45 °C)") BigDecimal temperatura,
            @Pattern(regexp = "^$|^\\d{2,3}/\\d{2,3}$", message = "Presión arterial con formato 120/80") String presionArterial,
            @Min(value = 20, message = "Pulso fuera de rango (20-250)") @Max(value = 250, message = "Pulso fuera de rango (20-250)") Integer pulso,
            @Min(value = 4, message = "Frecuencia respiratoria fuera de rango (4-80)") @Max(value = 80, message = "Frecuencia respiratoria fuera de rango (4-80)") Integer frecuenciaRespiratoria,
            @Min(value = 50, message = "Saturación fuera de rango (50-100 %)") @Max(value = 100, message = "Saturación fuera de rango (50-100 %)") Integer saturacionOxigeno,
            @DecimalMin(value = "0.5", message = "Peso fuera de rango (0.5-400 kg)") @DecimalMax(value = "400", message = "Peso fuera de rango (0.5-400 kg)") BigDecimal pesoKg,
            @DecimalMin(value = "30", message = "Talla fuera de rango (30-250 cm)") @DecimalMax(value = "250", message = "Talla fuera de rango (30-250 cm)") BigDecimal tallaCm,
            @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Grupo sanguíneo no válido") String grupoSanguineo) {
    }

    public record Examen(
            @NotBlank(message = "Indique la región anatómica") @Size(max = 100) String regionAnatomica,
            @NotBlank(message = "Indique los hallazgos") @Size(max = 5000) String hallazgos) {
    }

    public record Diagnostico(
            @NotNull(message = "Seleccione el diagnóstico CIE-10") Integer idCie10,
            @NotBlank @Pattern(regexp = "Presuntivo|Definitivo", message = "Tipo de diagnóstico no válido") String tipoDiagnostico,
            @NotBlank @Pattern(regexp = "Principal|Secundario", message = "Condición de diagnóstico no válida") String condicionDiagnostico,
            @Size(max = 5000) String descripcionClinica) {
    }

    public record Tratamiento(
            Integer idMedicamento,
            @Size(max = 50) String codigoMedicamento,
            @Size(max = 255) String nombreMedicamento,
            @NotBlank(message = "Indique la dosis e indicaciones") @Size(max = 5000) String indicacionesDosis) {
    }
}
