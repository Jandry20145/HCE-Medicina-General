package com.sistema.medico.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Peticiones de agenda, triaje, procedimientos, documentos y configuración. */
public final class ClinicaRequests {

    private ClinicaRequests() {
    }

    /** Triaje de enfermería: abre la consulta con signos vitales, sin médico todavía. */
    public record Triaje(
            @NotNull Integer idPaciente,
            Integer idCita,
            @NotBlank(message = "Indique el motivo breve de consulta") @Size(max = 500) String motivo,
            @Size(max = 500) String alergiasReportadas,
            @Size(max = 5000) String notaEnfermeria,
            @NotNull(message = "Registre los signos vitales") @Valid ConsultaRequest.SignosVitales signosVitales) {
    }

    public record Adenda(
            @NotBlank(message = "Escriba el texto de la adenda") @Size(max = 10000) String texto,
            @NotBlank(message = "Indique el motivo de la adenda") @Size(max = 255) String motivo) {
    }

    public record Certificado(
            @NotBlank @Pattern(regexp = "Asistencia|Reposo|Salud", message = "Tipo de certificado no válido") String tipo,
            @Min(value = 1, message = "El reposo es de al menos 1 día") @Max(value = 90, message = "El reposo máximo es de 90 días") Integer diasReposo,
            LocalDate desde,
            @Size(max = 2000) String observaciones) {
    }

    public record Resultado(@NotBlank(message = "Escriba el resultado") @Size(max = 10000) String resultado) {
    }

    public record Cita(
            @NotNull Integer idPaciente,
            LocalDateTime fechaHora,
            @Min(5) @Max(240) Integer duracionMin,
            @Size(max = 255) String motivo,
            /** Paciente que llega sin cita: se registra ahora y queda en sala de espera. */
            Boolean espontanea) {
    }

    public record CitaEstado(
            @NotBlank @Pattern(regexp = "Programada|Confirmada|EnEspera|Cancelada|NoAsistio",
                    message = "Estado no válido") String estado) {
    }

    public record Procedimiento(
            @NotNull Integer idPaciente,
            @NotBlank @Pattern(regexp = "Inyectable|Curacion|TomaMuestra|Nebulizacion|Otro",
                    message = "Tipo de procedimiento no válido") String tipo,
            @NotBlank(message = "Describa el procedimiento") @Size(max = 500) String descripcion) {
    }

    public record Configuracion(
            @NotBlank(message = "Indique el nombre del establecimiento") @Size(max = 150) String nombreEstablecimiento,
            @Size(max = 255) String direccion,
            @Size(max = 30) String telefono,
            @NotNull LocalTime horaApertura,
            @NotNull LocalTime horaCierre,
            @NotNull @Min(value = 5, message = "Duración mínima 5 minutos") @Max(value = 240, message = "Duración máxima 240 minutos") Integer duracionCitaMin,
            @Size(max = 500) String pieDocumentos) {
    }
}
