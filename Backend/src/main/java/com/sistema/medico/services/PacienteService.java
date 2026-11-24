package com.sistema.medico.services;

import com.sistema.medico.dto.PacienteRequest;
import com.sistema.medico.models.HistoriaClinica;
import com.sistema.medico.models.Paciente;
import com.sistema.medico.repositories.HistoriaClinicaRepository;
import com.sistema.medico.repositories.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;

    @Transactional(readOnly = true)
    public List<Paciente> listar() {
        return pacienteRepository.findAllByOrderByApellidosCompletosAscNombresCompletosAsc();
    }

    @Transactional(readOnly = true)
    public Paciente obtener(Integer id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
    }

    /** Crea el paciente y su historia clínica en una sola transacción. */
    @Transactional
    public Paciente crear(PacienteRequest datos) {
        String cedula = cedulaValida(datos);
        if (pacienteRepository.existsByCedulaIdentidad(cedula)) {
            throw new IllegalArgumentException("Ya existe un paciente con esta cédula de identidad.");
        }
        Paciente paciente = new Paciente();
        copiar(datos, paciente);
        paciente.setCedulaIdentidad(cedula);
        // El N° de HC depende del id autogenerado: primero un valor único provisional.
        paciente.setNumeroHistoriaClinica(UUID.randomUUID().toString());
        paciente = pacienteRepository.saveAndFlush(paciente);
        paciente.setNumeroHistoriaClinica(String.format("HC-%05d", paciente.getIdPaciente()));

        HistoriaClinica historia = new HistoriaClinica();
        historia.setPaciente(paciente);
        historiaClinicaRepository.save(historia);
        return paciente;
    }

    @Transactional
    public Paciente actualizar(Integer id, PacienteRequest datos) {
        Paciente paciente = obtener(id);
        String cedula = cedulaValida(datos);
        if (pacienteRepository.existsByCedulaIdentidadAndIdPacienteNot(cedula, id)) {
            throw new IllegalArgumentException("Ya existe otro paciente con esta cédula de identidad.");
        }
        copiar(datos, paciente);
        paciente.setCedulaIdentidad(cedula);
        return pacienteRepository.save(paciente);
    }

    private static String cedulaValida(PacienteRequest datos) {
        String cedula = datos.cedulaIdentidad().trim();
        if (!CedulaEcuatoriana.esValida(cedula)) {
            throw new IllegalArgumentException("La cédula ingresada no es válida.");
        }
        return cedula;
    }

    private static void copiar(PacienteRequest d, Paciente p) {
        p.setNombresCompletos(d.nombresCompletos().trim());
        p.setApellidosCompletos(d.apellidosCompletos().trim());
        p.setFechaNacimiento(d.fechaNacimiento());
        p.setSexo(d.sexo());
        p.setEstadoCivil(vacioANull(d.estadoCivil()));
        p.setOcupacion(vacioANull(d.ocupacion()));
        p.setDireccion(vacioANull(d.direccion()));
        p.setTelefono(vacioANull(d.telefono()));
        p.setCorreoElectronico(vacioANull(d.correoElectronico()));
        p.setSeguroSalud(vacioANull(d.seguroSalud()));
    }

    private static String vacioANull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
