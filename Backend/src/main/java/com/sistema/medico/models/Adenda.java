package com.sistema.medico.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Corrección o ampliación de una consulta firmada. La nota original no se modifica. */
@Data
@Entity
@Table(name = "adendas")
public class Adenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_adenda")
    private Integer idAdenda;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Column(nullable = false, length = 255)
    private String motivo;

    @Column(nullable = false, length = 50)
    private String autor;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
