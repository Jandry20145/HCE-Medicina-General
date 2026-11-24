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
 * oculta botones, nunca autoriza. Ver docs/ESPECIFICACION_HCE_ECUADOR.md §4.3.
 *
 * - Enfermería: pacientes, antecedentes, agenda, triaje, procedimientos; lee historias y consultas.
 *   No diagnostica, no prescribe, no firma ni emite certificados.
 * - Médico: todo lo clínico, firma, adendas, órdenes, certificados y PDF.
 * - Admin: usuarios, configuración y auditoría. Sin acceso a información clínica (secreto médico).
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
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
                        // Un 403 se reenvía a /error sin sesión (filtro stateless): si /error no fuese
                        // público, llegaría al navegador como 401 y el frontend cerraría la sesión.
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**", "/api/estadisticas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/configuracion").authenticated()
                        .requestMatchers("/api/admin/**").hasRole(ADMIN)

                        .requestMatchers("/api/pacientes/**", "/api/antecedentes/**", "/api/historia-clinica/**",
                                "/api/citas/**").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers(HttpMethod.GET, "/api/procedimientos/**").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers("/api/procedimientos/**").hasRole(ENFERMERIA)
                        .requestMatchers(HttpMethod.POST, "/api/consultas/triaje").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers(HttpMethod.GET, "/api/consultas/**").hasAnyRole(ENFERMERIA, MEDICO)
                        .requestMatchers("/api/consultas/**", "/api/ordenes/**", "/api/pdf/**", "/api/catalogos/**")
                        .hasRole(MEDICO)

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
