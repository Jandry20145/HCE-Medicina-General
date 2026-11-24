package com.sistema.medico.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Certificado de asistencia, reposo o salud emitido por el médico. */
@Data
@Entity
@Table(name = "certificados")
public class Certificado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_certificado")
    private Integer idCertificado;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "dias_reposo")
    private Integer diasReposo;

    private LocalDate desde;

    private LocalDate hasta;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "emitido_por", nullable = false, length = 50)
    private String emitidoPor;

    @Column(name = "emitido_en", nullable = false)
    private LocalDateTime emitidoEn;
}
