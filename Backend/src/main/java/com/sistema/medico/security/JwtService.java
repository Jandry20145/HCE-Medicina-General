package com.sistema.medico.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;

/** Emite y verifica el token de sesión (HS256, 8 horas). */
@Service
public class JwtService {

    private static final int MIN_SECRET_BYTES = 32; // HS256 exige al menos 256 bits
    private static final long EXPIRATION_MS = 1000L * 60 * 60 * 8;
    private static final String CLAIM_HUELLA = "pwd";

    private final SecretKey secretKey;

    public JwtService(@Value("${JWT_SECRET}") String secret) {
        if (secret.startsWith("cambia_esta")) {
            throw new IllegalStateException("JWT_SECRET tiene el valor de ejemplo de .env.example: defina uno propio y aleatorio");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos " + MIN_SECRET_BYTES + " caracteres");
        }
        this.secretKey = Keys.hmacShaKeyFor(bytes);
    }

    /**
     * El token lleva una huella del hash de la contraseña: al cambiarla o restablecerla, las
     * sesiones abiertas con la anterior dejan de valer.
     */
    public String generateToken(String username, String passwordHash) {
        return Jwts.builder()
                .subject(username)
                .claim(CLAIM_HUELLA, huella(passwordHash))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /** Datos del token si la firma y la fecha son válidas; null si no. */
    public Claims leer(String token) {
        try {
            return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public boolean esDeLaPasswordActual(Claims claims, String passwordHash) {
        return MessageDigest.isEqual(
                huella(passwordHash).getBytes(StandardCharsets.UTF_8),
                String.valueOf(claims.get(CLAIM_HUELLA)).getBytes(StandardCharsets.UTF_8));
    }

    private static String huella(String passwordHash) {
        try {
            byte[] sha = MessageDigest.getInstance("SHA-256").digest(passwordHash.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sha).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public long getExpirationSeconds() {
        return EXPIRATION_MS / 1000;
    }
}
