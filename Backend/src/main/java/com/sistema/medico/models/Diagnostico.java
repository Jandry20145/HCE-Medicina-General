package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "DIAGNOSTICOS")
public class Diagnostico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_diagnostic")
    private Integer idDiagnostic;

    @ManyToOne
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @ManyToOne
    @JoinColumn(name = "id_cie10", nullable = false)
    private CatalogoCie10 catalogoCie10;

    @Column(name = "tipo_diagnostico", nullable = false)
    private String tipoDiagnostico;

    @Column(name = "condicion_diagnostico", nullable = false)
    private String condicionDiagnostico;

    @Column(name = "descripcion_clinica", columnDefinition = "TEXT")
    private String descripcionClinica;
}
