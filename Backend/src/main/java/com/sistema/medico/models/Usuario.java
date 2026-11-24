package com.sistema.medico.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.ToString;

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

    @JsonIgnore // el hash nunca sale en una respuesta (iba dentro de cada consulta)
    @ToString.Exclude
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "rol", nullable = false)
    private String rol;

    @Column(name = "nombres_completos", nullable = false, length = 150)
    private String nombresCompletos;

    @Column(name = "estado", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean estado;

    /** Registro profesional que se imprime en recetas y certificados. */
    @Column(name = "registro_profesional", length = 50)
    private String registroProfesional;
}
