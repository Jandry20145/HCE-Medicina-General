package com.sistema.medico.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "HISTORIA_CLINICA")
@Data
@NoArgsConstructor
public class HistoriaClinica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_history_clinica")
    private Integer idHistoriaClinica;

    @OneToOne
    @JoinColumn(name = "id_paciente", nullable = false, unique = true)
    private Paciente paciente;

    @Column(name = "fecha_apertura")
    private LocalDateTime fechaApertura;

    @Column(name = "estado_expediente", nullable = false, length = 50)
    private String estadoExpediente;
    
    @PrePersist
    protected void onCreate() {
        if (fechaApertura == null) {
            fechaApertura = LocalDateTime.now();
        }
        if (estadoExpediente == null) {
            estadoExpediente = "Activo";
        }
    }
}
