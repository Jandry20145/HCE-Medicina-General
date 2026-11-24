# Revisión de seguridad

**Fecha:** 2026-11-24 · **Alcance:** revisión enfocada (no auditoría completa) del backend,
frontend, nginx, Caddy y docker-compose en la rama `hce-nivel-pediatrica`.
**Método:** lectura de código y pruebas locales contra la instalación Docker propia, con
usuarios ficticios. Nada se probó contra servidores externos.

## Controles comprobados

| Control | Cómo se comprobó |
|---|---|
| Sin sesión no se lee ni escribe nada clínico (401) | `SeguridadTest` + curl |
| Permisos por rol en el servidor (Admisión no ve HCE, Enfermería no crea consultas ni descarga PDF, solo Admin gestiona usuarios) | `SeguridadTest.permisosPorRol` |
| Cookie `HttpOnly; SameSite=Strict`, `Secure` bajo HTTPS | `SeguridadTest` + curl por el puerto 8543 |
| Cambiar contraseña o desactivar un usuario invalida sus sesiones abiertas | `SeguridadTest` |
| El hash de contraseña nunca sale en respuestas | `SeguridadTest`, `FlujoClinicoTest` |
| El médico de una consulta es el de la sesión, no el que envía el navegador | `FlujoClinicoTest` |
| Consulta todo-o-nada | `FlujoClinicoTest` |
| Bloqueo de 15 min tras 5 fallos (usuario + IP) | `SeguridadTest` + curl |
| Actuator no publicado; CSP, `X-Frame-Options: DENY`, `nosniff` | curl |
| Sin SQL armado a mano, sin `innerHTML`/`eval`, sin ejecución de comandos | búsqueda en el código |

## Hallazgos corregidos

### 1. Bloqueo de login e IP de auditoría falseables por el puerto del backend — medio

- **Quién:** cualquier proceso o persona con acceso al servidor (el puerto 8521 estaba en `127.0.0.1`).
- **Qué:** Spring confía en `X-Forwarded-For` de direcciones internas. Llamando directo al backend
  con una IP inventada en cada intento, el sexto intento fallido no se bloqueaba y la auditoría
  registraba las IPs falsas (reproducido: `203.0.113.1` … `.6`, sin 429).
- **Corrección:** el backend ya no publica puerto; solo nginx y Caddy, que sobrescriben la cabecera,
  llegan a él (`docker-compose.yml`). Verificado: el puerto no responde y una cabecera falsa por
  HTTPS queda registrada con la IP real.

### 2. Inundación de intentos de login sin cuenta — bajo

- **Qué:** rotando nombres de usuario se evitaba el bloqueo (es por usuario + IP) y cada intento
  añadía una fila a `auditoria`.
- **Corrección:** `limit_req` en nginx para `/api/auth/login`: 10 por minuto por IP con ráfaga de 10
  (`Fronted/nginx.conf`). Verificado: el intento 12 de una ráfaga recibe 429.

### 3. Sesión sin cifrar en la red local — depende del despliegue

- **Qué:** por HTTP la cookie de sesión viaja en claro.
- **Corrección:** perfil opcional `https` con Caddy (puerto 8543, `deploy/Caddyfile`). Verificado: la
  cookie sale con `Secure`. Usarlo es decisión de operación (ver `OPERACION.md`).

## Pendiente de validar (depende de dónde se instale)

- **IP real de los clientes con Docker Desktop.** En Windows/macOS, Docker Desktop traduce las
  conexiones y todas llegan con la IP de su puerta de enlace (se vio `192.168.16.1`). Entonces el
  bloqueo "usuario + IP" pasa a ser "usuario": alguien en la red puede bloquear 15 minutos el acceso
  de un usuario concreto fallando 5 veces, y la auditoría no distingue equipos. En un servidor Linux
  con Docker nativo se ve la IP real. Validar en el servidor definitivo mirando la columna IP de la
  auditoría tras entrar desde dos equipos distintos.
- **Video de la portada en un CDN externo.** Cada apertura de la pantalla de acceso hace una petición
  a `d8j0ntlcm91z4.cloudfront.net`, que ve la IP y la hora. No lleva datos clínicos. Para evitarlo,
  copiar el video a `Fronted/public/` y cambiar la constante `VIDEO` en `LoginPage.jsx` y `media-src`
  en `nginx.conf`.

## Riesgos aceptados

- Cerrar sesión borra la cookie, pero un token copiado antes sigue valiendo hasta 8 h (igual que en
  HCE Pediátrica). Mitigación: cambiar la contraseña invalida todos los tokens del usuario.
- Cualquier médico o enfermero puede abrir cualquier historia: no hay asignación de pacientes por
  profesional. Cada apertura queda en la auditoría (`HCE_CONSULTADA`).
- El conteo de intentos de login vive en memoria y se reinicia con el backend.
