package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalTime;

/** Parámetros del establecimiento. Una sola fila (id = 1), editable solo por el administrador. */
@Data
@Entity
@Table(name = "configuracion")
public class Configuracion {

    @Id
    private Integer id;

    @Column(name = "nombre_establecimiento", nullable = false, length = 150)
    private String nombreEstablecimiento;

    @Column(length = 255)
    private String direccion;

    @Column(length = 30)
    private String telefono;

    @Column(name = "hora_apertura", nullable = false)
    private LocalTime horaApertura;

    @Column(name = "hora_cierre", nullable = false)
    private LocalTime horaCierre;

    @Column(name = "duracion_cita_min", nullable = false)
    private Integer duracionCitaMin;

    @Column(name = "pie_documentos", length = 500)
    private String pieDocumentos;
}
