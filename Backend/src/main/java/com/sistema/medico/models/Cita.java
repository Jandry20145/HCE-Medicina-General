package com.sistema.medico.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "citas")
public class Cita {

    /** Programada → Confirmada → EnEspera (llegó) → EnAtencion → Atendida · Cancelada · NoAsistio */
    public static final List<String> ESTADOS =
            List.of("Programada", "Confirmada", "EnEspera", "EnAtencion", "Atendida", "Cancelada", "NoAsistio");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Integer idCita;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "duracion_min", nullable = false)
    private Integer duracionMin;

    @Column(length = 255)
    private String motivo;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(name = "llegada_en")
    private LocalDateTime llegadaEn;

    @ManyToOne
    @JoinColumn(name = "id_consulta")
    @JsonIgnoreProperties({"historiaClinica", "medico"})
    private ConsultaMedica consulta;

    @Column(name = "creada_por", nullable = false, length = 50)
    private String creadaPor;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;
}
