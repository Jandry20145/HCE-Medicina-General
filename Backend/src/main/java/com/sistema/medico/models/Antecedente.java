package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ANTECEDENTES")
public class Antecedente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_antecedente")
    private Integer idAntecedente;

    @ManyToOne
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @Column(name = "tipo_antecedente", nullable = false)
    private String tipoAntecedente;

    @Column(name = "enfermedad_asociada", nullable = false, length = 150)
    private String enfermedadAsociada;

    @Column(name = "parentesco_familiar", length = 50)
    private String parentescoFamiliar;

    @Column(name = "alergias_principales", columnDefinition = "TEXT")
    private String alergiasPrincipales;

    @Column(name = "descripcion_adicional", columnDefinition = "TEXT")
    private String descripcionAdicional;
}
