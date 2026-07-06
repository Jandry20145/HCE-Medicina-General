package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "USUARIOS")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "rol", nullable = false)
    private String rol;

    @Column(name = "nombres_completos", nullable = false, length = 150)
    private String nombresCompletos;

    @Column(name = "estado", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean estado;
}
