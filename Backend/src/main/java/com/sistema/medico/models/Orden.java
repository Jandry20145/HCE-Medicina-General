package com.sistema.medico.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Orden de laboratorio, imagen, interconsulta o procedimiento. Solicitada → Resultado → Revisada. */
@Data
@Entity
@Table(name = "ordenes")
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_orden")
    private Integer idOrden;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(length = 500)
    private String indicacion;

    @Column(nullable = false, length = 10)
    private String prioridad;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String resultado;

    @Column(name = "resultado_en")
    private LocalDateTime resultadoEn;

    @Column(name = "revisada_por", length = 50)
    private String revisadaPor;
}
