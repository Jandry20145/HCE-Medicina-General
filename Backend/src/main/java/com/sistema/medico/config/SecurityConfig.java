package com.sistema.medico.config;

import com.sistema.medico.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Quién puede hacer qué. Es la única fuente de verdad de los permisos: el frontend solo
 * oculta botones, nunca autoriza.
 *
 * | Rol        | Pacientes        | Antecedentes / HCE / consultas | Nueva consulta, PDF, CIE-10 | Usuarios y auditoría |
 * |------------|------------------|--------------------------------|-----------------------------|----------------------|
 * | Admin      | ver, crear, editar | —                            | —                           | sí                   |
 * | Admision   | ver, crear, editar | —                            | —                           | —                    |
 * | Enfermeria | ver              | ver y registrar antecedentes   | —                           | —                    |
 * | Medico     | ver, crear, editar | ver y registrar              | sí                          | —                    |
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String ADMISION = "ADMISION";
    private static final String ENFERMERIA = "ENFERMERIA";
    private static final String MEDICO = "MEDICO";

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${ALLOWED_ORIGINS}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Sin CSRF: la cookie es SameSite=Strict y la API solo acepta JSON.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .headers(h -> h.cacheControl(c -> { }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers("/api/auth/**", "/api/estadisticas").authenticated()
                        .requestMatchers("/api/admin/**").hasRole(ADMIN)

                        .requestMatchers(HttpMethod.GET, "/api/pacientes/**").hasAnyRole(ADMIN, ADMISION, ENFERMERIA, MEDICO)
                        .requestMatchers("/api/pacientes/**").hasAnyRole(ADMIN, ADMISION, MEDICO)

                        .requestMatchers("/api/antecedentes/**", "/api/historia-clinica/**").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers(HttpMethod.GET, "/api/consultas/**").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers("/api/consultas/**", "/api/pdf/**", "/api/catalogos/**").hasRole(MEDICO)

                        .anyRequest().denyAll())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim).filter(o -> !o.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
