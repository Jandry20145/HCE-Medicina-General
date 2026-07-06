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

    @ManyToOne
    @JoinColumn(name = "id_medico", nullable = false)
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

    @PrePersist
    protected void onCreate() {
        if (fechaHoraAtencion == null) {
            fechaHoraAtencion = LocalDateTime.now();
        }
    }
}
