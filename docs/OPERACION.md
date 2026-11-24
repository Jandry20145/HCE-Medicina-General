# Manual de operación

Para quien instala, actualiza y mantiene el sistema. Los comandos se ejecutan en la carpeta
raíz del proyecto, donde está `docker-compose.yml`.

## Servicios

| Servicio | Contenedor | Puerto | Accesible desde |
|---|---|---|---|
| Aplicación web (nginx) | `hcemg-frontend` | `FRONTEND_PORT` (8520) | la red |
| HTTPS opcional (Caddy) | `hcemg-https` | `HTTPS_PORT` (8543) | la red |
| API (Spring Boot) | `hcemg-backend` | ninguno | solo nginx y Caddy |
| MySQL | `hcemg-mysql` | `MYSQL_PORT` (33520) | solo este equipo |

Los datos de MySQL están en el volumen `hcemg-mysql-data`.

```bash
docker compose ps                 # estado
docker compose logs -f backend    # registro de la API
docker compose restart backend    # reiniciar un servicio
docker compose down               # detener (los datos se conservan)
```

> `docker compose down -v` borra el volumen y **todos los datos**. No lo use en producción.

## Primera instalación

1. Copie `.env.example` como `.env` y ponga valores propios en las claves (`MYSQL_ROOT_PASSWORD`,
   `MYSQL_PASSWORD`, `JWT_SECRET` de 32+ caracteres, `HCE_ADMIN_PASSWORD` de 8+). Con los valores
   de ejemplo el backend no arranca.
2. `docker compose up -d --build`
3. Abra `http://<servidor>:8520` y entre con `HCE_ADMIN_USERNAME` / `HCE_ADMIN_PASSWORD`. Cambie
   la clave en **Cambiar contraseña** y cree al personal en **Usuarios**.

Al arrancar, el backend crea o actualiza el esquema (Flyway) e importa `CIE10.xls` si el catálogo
está vacío (unos 11 000 códigos).

## Usuarios y contraseñas

- Roles: **Administración** (usuarios, configuración y auditoría, sin acceso clínico),
  **Enfermería** (expedientes, agenda, triaje, procedimientos) y **Médico** (nota, diagnóstico,
  receta, órdenes, firma, certificados). Los antiguos usuarios de Admisión pasan a Enfermería.
- A los médicos, registre su **registro profesional** en Usuarios: se imprime en recetas y certificados.
- Horario de atención, duración de citas y datos impresos en documentos: **Configuración**.
- Tras 5 intentos fallidos seguidos, ese usuario queda bloqueado 15 minutos desde esa dirección.
  Además nginx acepta como máximo 10 intentos de login por minuto por dirección.
- **Contraseña olvidada:** un administrador la restablece en **Usuarios**. Sus sesiones abiertas se
  cierran; el usuario debe cambiarla al entrar.
- **Desactivar** a alguien en **Usuarios** cierra sus sesiones al instante.
- Instalaciones anteriores con claves en texto plano: el backend las convierte a BCrypt al arrancar,
  y los usuarios de demostración con clave `1234` quedan desactivados.

Cambiar `JWT_SECRET` y reiniciar el backend cierra todas las sesiones.

## Respaldos

Un respaldo contiene datos de pacientes: guárdelo con acceso restringido y copie la carpeta
`backups/` a otro disco o equipo.

```bash
docker compose run --rm backup
```

Deja `backups/hcemg_AAAAMMDD_HHMMSS.sql.gz` y borra los de más de `BACKUP_RETENTION_DAYS` días.
Para programarlo a diario en Windows, cree una tarea en el Programador de tareas que ejecute ese
comando con la carpeta del proyecto como directorio de inicio.

**Restaurar** (reemplaza la base actual; haga antes un respaldo):

```bash
docker compose stop backend
gunzip -c backups/hcemg_AAAAMMDD_HHMMSS.sql.gz | docker exec -i hcemg-mysql sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose start backend
```

## Actualizar

1. `docker compose run --rm backup`
2. Obtenga el código nuevo.
3. `docker compose up -d --build`
4. En `docker compose logs backend` debe aparecer `Successfully applied` o `is up to date` y luego
   `Started SistemaMedicoApiApplication`. Si una migración falla, el backend no arranca: restaure
   el respaldo del paso 1, no arregle la base a mano.

## HTTPS

Por HTTP la cookie de sesión viaja sin cifrar por la red. Para usar HTTPS en la red local:

1. En `.env`, ponga en `HTTPS_HOST` la IP o nombre del servidor y añada
   `https://<HTTPS_HOST>:<HTTPS_PORT>` a `ALLOWED_ORIGINS`.
2. `docker compose --profile https up -d`
3. En cada equipo, instale como de confianza la raíz de Caddy:
   `docker cp hcemg-https:/data/caddy/pki/authorities/local/root.crt ./caddy-raiz.crt`

Con un dominio público, quite `tls internal` de `deploy/Caddyfile` y abra los puertos 80 y 443.

## Auditoría

La tabla `auditoria` registra inicios y cierres de sesión, intentos fallidos y bloqueados, cambios
de contraseña, gestión de usuarios, altas y cambios de pacientes, cada apertura de historia y
consulta, cada consulta creada y cada PDF descargado, con usuario, fecha e IP. No guarda datos
clínicos. El administrador ve las últimas 200 en **Auditoría**.

## Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El backend se reinicia en bucle | Falta una variable de `.env` o tiene el valor de ejemplo | `docker compose logs backend` |
| "Demasiados intentos fallidos" | Bloqueo por intentos | Esperar 15 minutos o reiniciar el backend |
| Error 429 al entrar | Límite de nginx (10 por minuto) | Esperar un minuto |
| El buscador CIE-10 no devuelve nada | No se importó `CIE10.xls` | Buscar `CIE-10` en `docker compose logs backend` |
| El navegador rechaza las peticiones (CORS) | La dirección usada no está en `ALLOWED_ORIGINS` | Añadirla y reiniciar el backend |
| Las horas salen desfasadas | Zona horaria | `TZ` en `.env` (por defecto `America/Guayaquil`) |
