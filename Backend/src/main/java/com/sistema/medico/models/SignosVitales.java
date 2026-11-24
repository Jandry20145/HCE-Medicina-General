package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "SIGNOS_VITALES")
public class SignosVitales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_signos")
    private Integer idSignos;

    @OneToOne
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @ManyToOne
    @JoinColumn(name = "id_enfermero", nullable = false)
    private Usuario enfermero;

    @Column(name = "temperatura", precision = 4, scale = 2)
    private BigDecimal temperatura;

    @Column(name = "presion_arterial", length = 20)
    private String presionArterial;

    @Column(name = "pulso")
    private Integer pulso;

    @Column(name = "frecuencia_respiratoria")
    private Integer frecuenciaRespiratoria;

    @Column(name = "peso_kg", precision = 5, scale = 2)
    private BigDecimal pesoKg;

    @Column(name = "talla_cm", precision = 5, scale = 2)
    private BigDecimal tallaCm;

    @Column(name = "grupo_sanguineo", length = 10)
    private String grupoSanguineo;

    @Column(name = "saturacion_oxigeno")
    private Integer saturacionOxigeno;
}
