package com.sistema.medico.services;

import com.sistema.medico.models.Auditoria;
import com.sistema.medico.repositories.AuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Registro de auditoría. Nunca impide la operación que audita: si no se puede guardar el
 * registro, se anota en el log y la operación continúa.
 */
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaService.class);

    private final AuditoriaRepository auditoriaRepository;

    /**
     * Registra una acción del usuario con sesión iniciada. Transacción propia: una llamada
     * interna no pasa por el proxy, así que sin esto se uniría a la del llamador (que puede
     * ser de solo lectura y MySQL rechazaría la escritura).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String accion, String detalle, HttpServletRequest request) {
        registrar(usuarioActual(), accion, detalle, request);
    }

    /** Registra una acción indicando el usuario (por ejemplo, un intento de login). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String usuario, String accion, String detalle, HttpServletRequest request) {
        try {
            Auditoria registro = new Auditoria();
            registro.setFecha(LocalDateTime.now());
            registro.setUsuario(recortar(usuario, 50));
            registro.setAccion(recortar(accion, 40));
            registro.setDetalle(recortar(detalle, 255));
            registro.setIp(request != null ? recortar(request.getRemoteAddr(), 45) : null);
            auditoriaRepository.save(registro);
        } catch (RuntimeException e) {
            log.error("No se pudo guardar el registro de auditoría de la acción {}", accion, e);
        }
    }

    @Transactional(readOnly = true)
    public List<Auditoria> ultimos() {
        return auditoriaRepository.findTop200ByOrderByFechaDescIdDesc();
    }

    public static String usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)
                ? auth.getName()
                : null;
    }

    private static String recortar(String valor, int maximo) {
        if (valor == null) {
            return null;
        }
        return valor.length() <= maximo ? valor : valor.substring(0, maximo);
    }
}
