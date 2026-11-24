package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Una acción registrada en el servidor: quién, qué y cuándo. Sin datos clínicos. */
@Data
@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 50)
    private String usuario;

    @Column(nullable = false, length = 40)
    private String accion;

    @Column(length = 255)
    private String detalle;

    @Column(length = 45)
    private String ip;
}
