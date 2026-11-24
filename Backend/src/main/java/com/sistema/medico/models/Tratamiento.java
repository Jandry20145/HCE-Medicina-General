package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "TRATAMIENTOS")
public class Tratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tratamiento")
    private Integer idTratamiento;

    @ManyToOne
    @JoinColumn(name = "id_consulta", nullable = false)
    private ConsultaMedica consultaMedica;

    @ManyToOne
    @JoinColumn(name = "id_medicamento", nullable = true)
    private CatalogoMedicamento medicamento;

    @Column(name = "nombre_medicamento", length = 255)
    private String nombreMedicamento;

    @Column(name = "indicaciones_dosis", nullable = false, columnDefinition = "TEXT")
    private String indicacionesDosis;

    @Column(name = "fecha_hora_registro")
    private LocalDateTime fechaHoraRegistro;

    @PrePersist
    protected void onCreate() {
        if (fechaHoraRegistro == null) {
            fechaHoraRegistro = LocalDateTime.now();
        }
    }

    // Receta estructurada (AM 00031-2020; ver docs/ESPECIFICACION_HCE_ECUADOR.md §7).
    @Column(name = "forma_farmaceutica", length = 60)
    private String formaFarmaceutica;

    @Column(name = "concentracion", length = 60)
    private String concentracion;

    @Column(name = "dosis", length = 60)
    private String dosis;

    @Column(name = "via", length = 40)
    private String via;

    @Column(name = "frecuencia", length = 60)
    private String frecuencia;

    @Column(name = "duracion", length = 60)
    private String duracion;

    @Column(name = "cantidad", length = 40)
    private String cantidad;
}
