package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "CATALOGO_MEDICAMENTOS")
public class CatalogoMedicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_medicamento")
    private Integer idMedicamento;

    @Column(name = "codigo_medicamento", unique = true, nullable = false, length = 50)
    private String codigoMedicamento;

    @Column(name = "nombre_generico", nullable = false, length = 255)
    private String nombreGenerico;
}
