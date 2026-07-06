package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "EXAMEN_FISICO")
public class ExamenFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_examen")
    private Integer idExamen;

    @ManyToOne
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @Column(name = "region_anatomica", nullable = false, length = 100)
    private String regionAnatomica;

    @Column(name = "hallazgos", nullable = false, columnDefinition = "TEXT")
    private String hallazgos;
}
