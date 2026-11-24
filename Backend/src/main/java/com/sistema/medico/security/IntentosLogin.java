package com.sistema.medico.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Frena los intentos de adivinar contraseñas: tras varios fallos seguidos para el mismo
 * usuario desde la misma dirección, se bloquean nuevos intentos durante unos minutos.
 * shortcut: el conteo vive en memoria y se reinicia con el backend; pasar a la base si hay varias réplicas.
 */
@Component
public class IntentosLogin {

    static final int MAXIMO_FALLOS = 5;
    static final Duration VENTANA = Duration.ofMinutes(15);
    static final int LIMITE_REGISTROS = 10_000;

    private record Conteo(int fallos, Instant primerFallo) {
    }

    private final Map<String, Conteo> conteos = new ConcurrentHashMap<>();

    private static String clave(String usuario, String ip) {
        return (usuario == null ? "" : usuario.trim().toLowerCase()) + "|" + (ip == null ? "" : ip);
    }

    public boolean estaBloqueado(String usuario, String ip) {
        Conteo conteo = conteos.get(clave(usuario, ip));
        if (conteo == null) {
            return false;
        }
        if (conteo.primerFallo().plus(VENTANA).isBefore(Instant.now())) {
            conteos.remove(clave(usuario, ip));
            return false;
        }
        return conteo.fallos() >= MAXIMO_FALLOS;
    }

    public void registrarFallo(String usuario, String ip) {
        Instant ahora = Instant.now();
        // Muchos usuarios distintos (por ejemplo, un ataque) no deben llenar la memoria.
        if (conteos.size() > LIMITE_REGISTROS) {
            conteos.values().removeIf(c -> c.primerFallo().plus(VENTANA).isBefore(ahora));
        }
        conteos.merge(clave(usuario, ip), new Conteo(1, ahora), (anterior, nuevo) ->
                anterior.primerFallo().plus(VENTANA).isBefore(ahora)
                        ? nuevo
                        : new Conteo(anterior.fallos() + 1, anterior.primerFallo()));
    }

    public void registrarExito(String usuario, String ip) {
        conteos.remove(clave(usuario, ip));
    }
}
