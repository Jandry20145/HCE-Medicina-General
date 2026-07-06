package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "CATALOGO_CIE10")
@Data
@NoArgsConstructor
public class CatalogoCie10 {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idCie10;

    @Column(name = "codigo_cie", unique = true, nullable = false, length = 20)
    private String codigoCie;

    @Column(name = "nombre_enfermedad", nullable = false, length = 255)
    private String nombreEnfermedad;
}
