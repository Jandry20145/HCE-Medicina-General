# BioHCEMG · Historia Clínica Electrónica de Medicina General

Registro de pacientes, antecedentes y consultas de medicina general (signos vitales, examen
físico regional, diagnóstico CIE-10, tratamiento) con reporte PDF, control de acceso por rol y
auditoría.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Aplicación web | React 19, Vite, Tailwind | `Fronted/` |
| API | Java 21, Spring Boot 4.1, Spring Security, Flyway | `Backend/` |
| Base de datos | MySQL 8 | migraciones en `Backend/src/main/resources/db/migration/` |
| Despliegue | Docker Compose, nginx, Caddy (HTTPS opcional) | `docker-compose.yml`, `deploy/` |

## Puesta en marcha

Requisito: Docker Desktop en ejecución.

1. Copie `.env.example` como `.env` y ponga **sus propias** claves. El sistema no arranca con los
   valores de ejemplo.
2. `docker compose up -d --build`
3. Abra <http://localhost:8520> y entre con `HCE_ADMIN_USERNAME` / `HCE_ADMIN_PASSWORD`.
   Cambie la clave y cree al personal en **Usuarios**.

Operación diaria (respaldos, actualización, HTTPS, problemas frecuentes):
[docs/OPERACION.md](docs/OPERACION.md).

## Roles

| Rol | Puede |
|---|---|
| Admin | gestionar usuarios, ver la auditoría, registrar y editar pacientes |
| Admisión | registrar y editar pacientes |
| Enfermería | ver historias y consultas, registrar antecedentes |
| Médico | todo lo anterior salvo usuarios/auditoría, registrar consultas, descargar el PDF |

El servidor comprueba cada permiso (`Backend/.../config/SecurityConfig.java`); el frontend solo
oculta lo que no corresponde.

## Desarrollo

```bash
# API (necesita un MySQL accesible y las variables de .env en el entorno)
cd Backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Web (Vite redirige /api a localhost:8080)
cd Fronted && npm ci && npm run dev
```

### Pruebas

```bash
cd Backend && ./mvnw test          # API, con H2 en memoria
cd Fronted && npm test && npm run lint && npm run build
```

GitHub Actions ejecuta lo mismo en cada pull request (`.github/workflows/ci.yml`).

### Cambios en la base de datos

Cada cambio de esquema va en un archivo nuevo `V<n>__descripcion.sql` en
`Backend/src/main/resources/db/migration/`. Las migraciones ya aplicadas no se editan.

## Documentación

- [docs/adr/ADR-001](docs/adr/ADR-001-evolucion-a-nivel-hce-pediatrica.md): por qué esta arquitectura.
- [docs/SEGURIDAD.md](docs/SEGURIDAD.md): revisión de seguridad, hallazgos y riesgos aceptados.
- [docs/OPERACION.md](docs/OPERACION.md): instalación, respaldos, HTTPS, auditoría.
- [Documentacion_Tecnica.md](Documentacion_Tecnica.md): requerimientos y diagramas del reto original.
