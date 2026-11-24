# ADR-001: Llevar HCE Medicina General al nivel de HCE Pediátrica

**Estado:** Aceptado
**Fecha:** 2026-11-23
**Decisores:** Jandry Solórzano (responsable del proyecto)

## Contexto

HCE Medicina General nació como un reto académico: React + Spring Boot 3.2 + MySQL en
Docker. Funciona, pero no se puede usar con pacientes reales:

| Problema | Dónde |
|---|---|
| Contraseñas guardadas y comparadas en texto plano, e impresas en consola en cada login | `AuthController` |
| Ningún endpoint pide sesión: cualquiera en la red lee y escribe historias clínicas | todos los controladores |
| CORS `*` en cada controlador | `WebConfig`, `@CrossOrigin` |
| El hash de la contraseña del médico sale en el JSON de cada consulta | `Usuario` serializado dentro de `ConsultaMedica` |
| El médico de una consulta lo elige el navegador (`idMedico` en el cuerpo) | `ConsultaController` |
| "Sesión" = `localStorage.isAuthenticated = 'true'` | `App.jsx` |
| Esquema creado por Hibernate (`ddl-auto=update`) y por un SQL de arranque que no coinciden | `application.properties`, `ordenado.sql` |
| Crear una consulta guarda 5 tablas sin transacción: un fallo a mitad deja datos a medias | `ConsultaController.crearConsulta` |
| Errores internos devueltos al cliente con `e.getMessage()` | todos los controladores |
| Sin tests, sin CI, sin respaldos, sin auditoría | — |

HCE Pediátrica (antes HCE Quingeo) ya resolvió todo esto en 8 fases y es la referencia
del equipo. Ambos proyectos los mantiene la misma persona.

## Decisión

Adoptar en Medicina General la **misma plataforma** que HCE Pediátrica, conservando el
dominio clínico propio de Medicina General (adulto: signos vitales, examen físico regional,
CIE-10, tratamiento) y la estructura de paquetes existente (`com.sistema.medico`).

| Capa | Antes | Después (igual que Pediátrica) |
|---|---|---|
| Runtime | Java 17, Spring Boot 3.2 | Java 21, Spring Boot 4.1 |
| Sesión | ninguna | JWT firmado HS256 en cookie `HttpOnly; SameSite=Strict`, 8 h, invalidado al cambiar la contraseña |
| Contraseñas | texto plano | BCrypt; las existentes se migran solas al arrancar |
| Autorización | ninguna | roles `Admin`, `Admision`, `Enfermeria`, `Medico` comprobados en el servidor |
| Fuerza bruta | — | bloqueo de 15 min tras 5 fallos (usuario + IP) |
| Esquema | Hibernate `update` | Flyway (`db/migration`), Hibernate no toca el esquema |
| Errores | `e.getMessage()` al cliente | `GlobalExceptionHandler`: 4xx explican, 5xx genéricos y al log |
| Auditoría | — | tabla `auditoria` (quién, qué, cuándo, IP; sin datos clínicos) |
| Usuarios | insert manual en SQL | administrador inicial desde `.env`, panel de usuarios |
| Despliegue | puertos abiertos, `root/root` | `.env` obligatorio, MySQL y API solo en `127.0.0.1`, nginx hace de proxy `/api`, HTTPS opcional con Caddy, respaldos con `docker compose run --rm backup` |
| Calidad | — | tests de backend (H2) y frontend (Vitest), GitHub Actions |

## Opciones consideradas

### Opción A: Misma plataforma que Pediátrica, online (elegida)

| Dimensión | Valoración |
|---|---|
| Complejidad | Media |
| Coste | Sin coste de infraestructura nuevo |
| Escalabilidad | Suficiente para un consultorio o centro de salud (decenas de usuarios) |
| Familiaridad | Alta: es el mismo código y los mismos patrones que Pediátrica |

**Pros:** un único modelo mental para ambos proyectos; las piezas de seguridad ya están
probadas; se puede reutilizar documentación de operación.
**Contras:** sin conexión no se puede registrar.

### Opción B: Copiar también el modo sin conexión (PWA + IndexedDB + sincronización)

| Dimensión | Valoración |
|---|---|
| Complejidad | Alta (cola de cambios, UUID por registro, conflictos, limpieza al cerrar sesión) |
| Coste | Igual |
| Escalabilidad | Igual |
| Familiaridad | Alta, pero es la parte de Pediátrica que más fases de corrección necesitó (4 y 5) |

**Pros:** funciona en brigadas o zonas sin red.
**Contras:** duplica los datos clínicos en cada navegador; casi duplica el código del
frontend; Medicina General se usa en consultorio con red estable.

### Opción C: Parche mínimo (solo hash de contraseñas y CORS)

| Dimensión | Valoración |
|---|---|
| Complejidad | Baja |
| Escalabilidad | Igual |
| Familiaridad | Alta |

**Pros:** un día de trabajo.
**Contras:** sigue sin autorización por rol ni auditoría; no alcanza el nivel pedido.

## Análisis de compromisos

El valor de Pediátrica no está en la cantidad de pantallas, sino en que **el servidor no
confía en el navegador**: sesión firmada, rol comprobado en cada endpoint, médico tomado de
la sesión, errores sin filtrar datos, esquema versionado. Eso es lo que se adopta (A).

El modo sin conexión (B) es la pieza más cara de mantener y solo aporta valor sin red. Se
deja fuera y se documenta cómo añadirlo si cambia el contexto de uso.

## Consecuencias

- **Más fácil:** desplegar en un servidor real; demostrar quién hizo qué; añadir cambios de
  esquema sin romper instalaciones; detectar regresiones (CI).
- **Más difícil:** arrancar requiere un `.env` con secretos propios (a propósito); desarrollo
  local necesita Java 21.
- **A revisar:** modo sin conexión si se usa en brigadas; firma electrónica de documentos;
  integración con el catálogo de medicamentos del MSP (la tabla existe pero está vacía).

## Acciones

1. [x] Backend: seguridad (JWT, BCrypt, roles, bloqueo), Flyway, servicios transaccionales, errores, auditoría.
2. [x] Backend: administrador inicial desde `.env`, panel de usuarios, cambio y restablecimiento de contraseña.
3. [x] Frontend: cliente HTTP único con cookie, sesión verificada en el servidor, rutas por rol, pantallas de usuarios, auditoría y contraseña.
4. [x] Frontend: nueva portada de acceso.
5. [x] Operación: `.env.example`, compose endurecido, proxy nginx, HTTPS opcional, respaldos, `docs/OPERACION.md`.
6. [x] Calidad: tests de backend y frontend, GitHub Actions.
7. [x] Auditoría de seguridad del resultado (`docs/SEGURIDAD.md`).
8. [ ] Seguimiento: decidir sobre modo sin conexión cuando haya un caso de uso real.
