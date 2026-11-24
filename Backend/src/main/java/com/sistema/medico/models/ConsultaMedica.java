package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "CONSULTA_MEDICA")
public class ConsultaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consulta")
    private Integer idConsulta;

    @ManyToOne
    @JoinColumn(name = "id_historia_clinica", nullable = false)
    private HistoriaClinica historiaClinica;

    /** Null mientras la consulta está en triaje (todavía sin médico). */
    @ManyToOne
    @JoinColumn(name = "id_medico")
    private Usuario medico;

    @Column(name = "fecha_hora_atencion")
    private LocalDateTime fechaHoraAtencion;

    @Column(name = "motivo_consulta", nullable = false, columnDefinition = "TEXT")
    private String motivoConsulta;

    @Column(name = "enfermedad_actual", columnDefinition = "TEXT")
    private String enfermedadActual;

    @Column(name = "estado_consulta", nullable = false, length = 50)
    private String estadoConsulta;

    @Column(name = "evolucion", columnDefinition = "TEXT")
    private String evolucion;

    @Column(name = "recomendaciones", columnDefinition = "TEXT")
    private String recomendaciones;

    @Column(name = "proximo_control")
    private java.time.LocalDate proximoControl;

    @Column(name = "revision_sistemas", columnDefinition = "TEXT")
    private String revisionSistemas;

    @Column(name = "nota_enfermeria", columnDefinition = "TEXT")
    private String notaEnfermeria;

    @Column(name = "alergias_reportadas", length = 500)
    private String alergiasReportadas;

    /** Fecha de firma. Una consulta firmada no se modifica: solo admite adendas. */
    @Column(name = "firmada_en")
    private LocalDateTime firmadaEn;

    public static final String TRIAJE = "Triaje";
    public static final String BORRADOR = "Borrador";
    public static final String FIRMADA = "Firmada";

    @PrePersist
    protected void onCreate() {
        if (fechaHoraAtencion == null) {
            fechaHoraAtencion = LocalDateTime.now();
        }
    }
}
