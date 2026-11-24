package com.sistema.medico.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Inyectable, curación, toma de muestra, nebulización u otro procedimiento de enfermería. */
@Data
@Entity
@Table(name = "procedimientos_enfermeria")
public class ProcedimientoEnfermeria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_procedimiento")
    private Integer idProcedimiento;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(name = "realizado_por", nullable = false, length = 50)
    private String realizadoPor;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
