package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "PACIENTES")
@Data
@NoArgsConstructor
public class Paciente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPaciente;

    @Column(name = "numero_historia_clinica", unique = true, nullable = false, length = 50)
    private String numeroHistoriaClinica;

    @Column(name = "cedula_identidad", unique = true, nullable = false, length = 20)
    private String cedulaIdentidad;

    @Column(name = "nombres_completos", nullable = false, length = 100)
    private String nombresCompletos;

    @Column(name = "apellidos_completos", nullable = false, length = 100)
    private String apellidosCompletos;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "sexo", nullable = false)
    private String sexo;

    @Column(name = "estado_civil", length = 50)
    private String estadoCivil;

    @Column(name = "ocupacion", length = 100)
    private String ocupacion;

    @Column(name = "direccion", length = 255)
    private String direccion;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "correo_electronico", length = 100)
    private String correoElectronico;

    @Column(name = "seguro_salud", length = 100)
    private String seguroSalud;
}
