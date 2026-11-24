# Especificación integral · HCE de consulta externa de medicina general (Ecuador)

**Producto:** BioHCEMG · **Versión del documento:** 1.0 · **Fecha:** 24 de noviembre de 2026
**Elaborado como:** equipo de medicina general, informática en salud, UX clínica, seguridad de la
información y asesoría jurídica sanitaria (perspectivas simuladas; **no sustituye** la revisión de
un abogado, del responsable de protección de datos ni de la dirección médica del establecimiento).

**Convenciones del documento**

| Marca | Significado |
|---|---|
| **[OBLIGACIÓN]** | Requisito que surge de una norma localizada en fuente oficial. Aun así, confirmar artículo y vigencia antes de citarlo. |
| **[BUENA PRÁCTICA]** | Recomendación profesional o de seguridad; no es exigencia legal identificada. |
| **[DISEÑO]** | Decisión de producto de este equipo. |
| **[VERIFICAR]** | Dato no confirmado: se convierte en tarea de verificación (sección 13). |
| ✅ Piloto | Implementado en la versión actual de BioHCEMG. |
| ⏳ Posterior | Planificado para una versión siguiente. |

Todos los ejemplos usan pacientes ficticios. Ningún dato de este documento proviene de pacientes
reales.

---

## 1. Resumen ejecutivo

### Qué problema resuelve

En un consultorio de medicina general la información del paciente suele estar dispersa: carpeta
física en admisión, signos vitales en una hoja de enfermería, receta en un talonario y resultados en
el correo o en papel. Eso produce omisiones (alergias no vistas, resultados sin seguimiento),
duplicados (dos historias para la misma persona) y consultas en las que el médico dedica más tiempo
a buscar que a atender.

BioHCEMG acompaña el recorrido completo del paciente ambulatorio (cita → llegada → triaje →
consulta → órdenes y receta → firma → indicaciones → seguimiento) en una sola historia clínica,
con cada actor documentando solo lo que le corresponde.

### Qué lo hace destacar ante un médico local

1. **La alergia aparece antes de prescribir**, no en la tercera pestaña.
2. **Enfermería deja todo listo**: cuando el médico abre la consulta, los signos vitales, el IMC y
   las alertas ya están, con hora y autor.
3. **Receta por DCI con los campos que pide la normativa** y documento listo para imprimir.
4. **Nota firmada = nota cerrada**: las correcciones son adendas visibles, nunca borrados.
5. **Rápida**: la consulta típica se documenta en una sola pantalla, con sugerencias pero sin
   copiar-pegar notas anteriores sin revisar.

### Principios de diseño

| Principio | Cómo se concreta |
|---|---|
| Centrado en el paciente | Identificación con dos datos, resumen comprensible al alta, señales de alarma escritas en lenguaje claro. |
| Documentación clínica clara | Estructura anamnesis → examen → evaluación → plan; cada dato con autor, fecha y hora. |
| Rapidez | Una pantalla por tarea, valores por defecto seguros, autocompletado CIE-10. |
| Seguridad | Mínimo privilegio por rol, sesiones que caducan, todo acceso auditado. |
| Trazabilidad | Nada clínico firmado se edita ni se borra; adendas con motivo. |
| Continuidad | Historia longitudinal: problemas, alergias, medicación y pendientes visibles en cada consulta. |

### Límites explícitos

- La HCE **no diagnostica, no prescribe y no decide**. Calcula (IMC, edad), advierte (signos fuera
  de rango, alergias) y recuerda (pendientes). Toda decisión es del profesional.
- No reemplaza las guías de práctica clínica vigentes del MSP ni el juicio médico.
- No se integra con sistemas nacionales (MSP, IESS, ARCSA, laboratorios, farmacias) hasta que esa
  integración exista, esté documentada oficialmente y el establecimiento esté autorizado
  **[VERIFICAR]**.

---

## 2. Marco legal y regulatorio ecuatoriano

**Fecha de verificación de fuentes:** 24 de noviembre de 2026.
**Método:** búsqueda de los instrumentos y localización de su publicación en sitios oficiales
(`*.gob.ec`). **No se revisó artículo por artículo el texto consolidado de cada norma**: por eso
cada fila indica el estado de la verificación. Ninguna fila debe presentarse como dictamen jurídico.

### 2.1 Matriz normativa

| # | Norma / instrumento | Autoridad | Ámbito | Requisito que afecta a la HCE | Implementación en BioHCEMG | Evidencia de cumplimiento | Estado de verificación |
|---|---|---|---|---|---|---|---|
| L1 | **Ley Orgánica de Salud**, art. 7 lit. f (derecho a historia clínica única y a la confidencialidad de su contenido) | Asamblea Nacional | Todo el Sistema Nacional de Salud | Una sola historia por paciente; confidencialidad del contenido. | Identificador único por cédula; bloqueo de duplicados; acceso por rol; auditoría de cada apertura. ✅ | Restricción `UNIQUE` en cédula; registros `HCE_CONSULTADA` en auditoría. | Literal citado por el MSP en [comunicado oficial](https://www.salud.gob.ec/comunicado-legislacion-prohibe-divulgacion-de-datos-personales/). **[VERIFICAR]** texto consolidado vigente. |
| L2 | **Ley de Derechos y Amparo del Paciente** (Ley 77, RO Supl. 626, 3-feb-1995), art. 4 (confidencialidad de consulta, examen, diagnóstico, tratamiento) | Congreso Nacional | Pacientes de todo establecimiento | Confidencialidad de toda la información clínica. | Datos clínicos solo para Medicina y Enfermería; Administración sin acceso clínico. ✅ | Matriz de permisos (sección 4.3) y pruebas automáticas de permisos. | Ficha en [gob.ec/regulaciones](https://www.gob.ec/regulaciones/ley-derechos-amparo-paciente). **[VERIFICAR]** reformas posteriores a 2006. |
| L3 | **Acuerdo Ministerial 00115-2021** · Reglamento para el manejo de la Historia Clínica Única (RO 378, 26-ene-2021, según fuentes secundarias) | MSP | Sistema Nacional de Salud | Formularios estandarizados de la historia clínica; registro cronológico; custodia por el establecimiento. | Estructura cronológica; secciones de consulta externa; PDF de la historia. ✅ Correspondencia exacta con cada formulario oficial ⏳. | Comparación campo a campo con los formularios del anexo (tarea V-02). | PDF publicado por [ACESS](http://www.acess.gob.ec/wp-content/uploads/2023/12/Acuerdo-Ministerial-00115-2021-ENE-10-FORMULARIOS-HISTORIA-CLINICA.pdf). **[VERIFICAR]** anexos de formularios, reglas de corrección, firma y conservación. |
| L4 | **Acuerdo Ministerial 5216-A** · confidencialidad de documentos con información de salud | MSP | Sistema Nacional de Salud | La historia clínica solo la maneja personal de la cadena sanitaria. | Administrador sin acceso clínico; acceso por rol. ✅ | Pruebas de permisos; auditoría. | PDF en [salud.gob.ec](https://www.salud.gob.ec/wp-content/uploads/2016/09/AM-5216-A-Confidencialidad.pdf). **[VERIFICAR]** vigencia y alcance para entrega de copias. |
| L5 | **Ley Orgánica de Protección de Datos Personales (LOPDP)** (5.º Supl. RO 459, 26-may-2021); art. 30 datos de salud | Asamblea Nacional | Todo responsable de tratamiento | Datos de salud = especial protección; confidencialidad; seudonimización cuando sea posible; medidas técnicas y organizativas; derechos del titular. | Cifrado en tránsito (HTTPS), mínimo privilegio, auditoría, sin datos reales en desarrollo, exportación del paciente ⏳. | Registro de actividades de tratamiento, política de privacidad, evaluación de impacto. | PDF del RO en [cancilleria.gob.ec](https://www.cancilleria.gob.ec/wp-content/uploads/2023/03/2021.05.10_ley_organica_de_proteccion_de_datos_personales.pdf). **[VERIFICAR]** texto vigente del art. 30 (hay variaciones de redacción entre copias). |
| L6 | **Reglamento General de la LOPDP** (Decreto Ejecutivo 904, nov-2023) | Presidencia | Responsables y encargados | Evaluación de impacto obligatoria en los casos de ley, previa al tratamiento (arts. 29-32, según resúmenes). | Plantilla de evaluación de impacto como entregable del piloto (sección 13). | Documento de evaluación firmado. | Copia en [cosede.gob.ec](https://www.cosede.gob.ec/wp-content/uploads/2023/12/REGLAMENTO-GENERAL-A-LA-LEY-ORG%C3%81NICA-DE-PROTECCION-DE-DATOS-PERSONALES_compressed-1.pdf). **[VERIFICAR]** si este tratamiento exige evaluación y si debe presentarse a la Superintendencia. |
| L7 | **Acuerdo Ministerial 5316** · Modelo de gestión de aplicación del consentimiento informado (RO EE 510, 22-feb-2016) | MSP | Sistema Nacional de Salud | Consentimiento escrito en procedimientos de riesgo mayor; documento de negación; testigo si no firma; archivo en la historia. | Módulo de consentimiento y negativa ⏳ (la consulta ambulatoria básica no suele requerirlo; los procedimientos de enfermería sí pueden). | Formularios firmados vinculados a la historia. | PDF en [salud.gob.ec](https://www.salud.gob.ec/wp-content/uploads/2022/09/A.M.5316-Consentimiento-Informado_-AM-5316.pdf). **[VERIFICAR]** formulario oficial vigente (fuentes académicas mencionan el formulario 024). |
| L8 | **Reglamento del contenido y requisitos de la receta médica** · AM 00031-2020 (RO 251, 22-jul-2020), reformado por AM 00052-2022 | MSP | Prescriptores | Receta física o electrónica con firma; prescripción por DCI sin abreviaturas; forma farmacéutica, concentración, vía, cantidad en números y letras, dosis, frecuencia y duración. | Campos estructurados de receta (sección 7) y documento imprimible. ✅ Cantidad en letras ⏳. | Receta generada con todos los campos. | **Solo fuentes secundarias** ([Noticiero Médico](https://www.noticieromedico.com/post/reglamento-para-establecer-el-contenido-y-requisitos-de-la-receta-medica), [Meythaler & Zambrano](https://www.meythalerzambranoabogados.com/post/el-ministerio-de-salud-p%C3%BAblica-regula-el-contenido-y-requisitos-de-la-receta-m%C3%A9dica)). **[VERIFICAR]** texto oficial y reforma. |
| L9 | **Ley Orgánica de Salud, art. 167** (nombre genérico en la receta) | Asamblea Nacional | Prescriptores | Nombre genérico en primer lugar. | Campo `principio activo (DCI)` obligatorio y primero. ✅ | Receta generada. | Citado por fuentes secundarias. **[VERIFICAR]**. |
| L10 | **AM 25-2020** · prescripción y dispensación de medicamentos sujetos a fiscalización; recetas especiales | MSP / ARCSA | Estupefacientes y psicotrópicos | Recetario especial; controles propios. | **Fuera del piloto:** el sistema advierte que estos medicamentos requieren receta especial y no la emite. [DISEÑO] | Mensaje de bloqueo y auditoría. | PDF en [controlsanitario.gob.ec](https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/01/Acuerdo-Ministerial-25_Reglamento-para-regular-la-prescripcion-dispensacion-y-movimientos-de-los-medicamentos-sujetos-a-fiscalizacion-y-el-abastecimiento-y-control-de-las-recetas-especiales.pdf). **[VERIFICAR]** vigencia y si existe receta especial electrónica. |
| L11 | **Certificados médicos y de reposo** · procedimientos del IESS (validación de certificados externos; firma digital permite validación en línea) | IESS / MSP | Afiliados al IESS; todos los certificados | Datos del médico (nombre, firma, registro); validación en el IESS dentro de un plazo tras el reposo (8 días según el instructivo). | Certificado con médico, registro profesional, fechas y días de reposo. ✅ Firma electrónica ⏳. | PDF del certificado + auditoría `CERTIFICADO_EMITIDO`. | [Trámite IESS](https://www.iess.gob.ec/documents/10162/22686348/128.pdf). **[VERIFICAR]** reglamento MSP vigente de certificados (no se localizó el número de acuerdo) y formato actual del IESS. |
| L12 | **Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos** (Ley 67-2002) y su reglamento | Congreso / Presidencia | Documentos electrónicos | La firma electrónica de una entidad de certificación acreditada equivale a la manuscrita. | Fase 1: "firma" = cierre auditado por usuario autenticado + documento impreso con firma manuscrita. Firma electrónica real ⏳. [DISEÑO] | Bloqueo de la nota firmada; documento impreso firmado. | Ley en [firmadigital.gob.ec](https://www.firmadigital.gob.ec/wp-content/uploads/2018/01/ley_de_comercio_electronico.pdf). **[VERIFICAR]** si una nota de HCE sin firma electrónica acreditada tiene valor probatorio suficiente. |
| L13 | **Norma Técnica de Telesalud** (2.º Supl. RO 153, 28-oct-2025) | MSP | Atención a distancia | Requisitos de teleconsulta. | Fuera del alcance del piloto. | — | PDF en [ACESS](http://www.acess.gob.ec/wp-content/uploads/2025/11/Norma-Tecnica-de-Telesalud.pdf). **[VERIFICAR]** antes de habilitar teleconsulta. |
| L14 | **Licenciamiento de establecimientos** | ACESS | Establecimientos públicos y privados | Requisitos de la historia clínica en la inspección de licenciamiento. | — | Checklist de ACESS. | **[VERIFICAR]** con ACESS qué exige sobre HCE en el tipo de establecimiento. |
| L15 | **Agenda Digital de Salud 2023-2027** (AM 00228-2023 según fuente secundaria) | MSP | Política pública | Dirección de interoperabilidad y salud digital. | Referencia para la hoja de ruta de interoperabilidad. | — | [Manual en salud.gob.ec](https://www.salud.gob.ec/wp-content/uploads/2023/06/Manual_Agenda_Digital_2023_Seg.pdf). No es una obligación para el producto. |

### 2.2 Lo que **no** se pudo confirmar (no se inventa)

| Tema | Situación | Qué hace el sistema mientras tanto |
|---|---|---|
| Plazo mínimo de conservación de la historia clínica | Fuentes institucionales antiguas mencionan archivo activo de 5 años y pasivo de 5 a 10 años, pero no se confirmó en el AM 00115-2021 vigente. | **No se elimina ninguna historia.** Solo respaldos con retención configurable; la purga de historias está deshabilitada. |
| Requisitos de firma de la nota en HCE electrónica | No confirmado. | Cierre auditado + bloqueo; firma electrónica acreditada como mejora. |
| Plazos y forma de entrega de copias al paciente | No confirmado. | Exportación a PDF por el médico, auditada; requiere verificación de identidad presencial. |
| Interoperabilidad con PRAS/RDACAA u otras plataformas del MSP | No se encontró especificación técnica pública. | Sin integración. Exportación estructurada propia. |
| Reglamento MSP vigente de certificados médicos | No se localizó el número de acuerdo. | Certificado con los datos mínimos que exige el IESS para validarlos. |

### 2.3 Diferencias público / privado **[VERIFICAR]**

| Aspecto | Público (red MSP) | Privado |
|---|---|---|
| Sistema de HCE | Puede existir un sistema institucional obligatorio | Libre elección, sujeto a AM 00115-2021 y LOPDP |
| Reporte de atenciones | Plataformas del MSP | Según el convenio o la obligación aplicable |
| Facturación / cobertura | Gratuidad | Pago, seguros privados, derivaciones de la red pública |
| Responsable del tratamiento de datos | Institución pública | Persona natural o jurídica titular del establecimiento |

---

## 3. Recorrido completo del paciente

### 3.0 Roles

| Rol | Enfoque | Puede | No puede |
|---|---|---|---|
| **Enfermería** (admisión y atención primaria) | Primer filtro operativo y asistencial | Crear y actualizar expedientes, antecedentes y alergias, gestionar la agenda, marcar llegada, triaje y signos vitales, procedimientos de enfermería, notas de enfermería | Diagnosticar, prescribir, firmar consultas, emitir certificados, modificar notas médicas |
| **Médico general** | Atención clínica y resolución | Todo lo de enfermería más anamnesis, revisión por sistemas, examen físico, diagnóstico CIE-10, receta, órdenes, certificados, firma y adendas, PDF de la historia | Gestionar usuarios o configuración del sistema |
| **Administrador** | Configuración, seguridad y cumplimiento | Usuarios, roles, restablecer y dar de baja accesos, configuración del establecimiento (horario, duración de citas, encabezados), auditoría, respaldos | Ver o escribir información clínica, recetas o diagnósticos (secreto médico) |

Roles **⏳ posteriores** (no en el piloto): recepción sin acceso clínico, laboratorio (carga de
resultados), farmacia (dispensación), auditor clínico (lectura con motivo), paciente (portal).

### 3.1 Flujo por pasos

Cada paso indica: responsable · pantalla · datos · validaciones · excepciones · eventos de auditoría
· mensaje al paciente.

**A. Agendamiento y preparación** ✅
- **Responsable:** Enfermería (o médico).
- **Pantalla:** Agenda → "Nueva cita".
- **Datos:** paciente, fecha y hora, duración (por defecto de configuración), motivo breve opcional.
- **Validaciones:** dentro del horario configurado; sin solapamiento con otra cita en el mismo horario
  [DISEÑO]; fecha no pasada.
- **Excepciones:** paciente nuevo → crear expediente primero; atención sin cita → "cita espontánea"
  creada en el momento de la llegada.
- **Auditoría:** `CITA_CREADA`, `CITA_REPROGRAMADA`, `CITA_CANCELADA`.
- **Mensaje al paciente:** "Su cita es el martes 2 de diciembre a las 09:30. Traiga su cédula y la
  lista de medicamentos que toma." Los recordatorios **no** incluyen motivo ni diagnóstico
  [BUENA PRÁCTICA] ⏳ (envío automático).

**B. Llegada e identificación** ✅
- **Responsable:** Enfermería.
- **Pantalla:** Agenda del día → "Marcar llegada".
- **Datos:** confirmación de **dos identificadores** (nombres completos + fecha de nacimiento o cédula).
- **Validaciones:** la cédula pasa el dígito verificador; aviso de **posible homónimo** si existe otro
  paciente con los mismos nombres y apellidos ⏳.
- **Excepciones:** sin documento → registro con identificación "pendiente" y nota ⏳; menor de edad →
  representante legal ⏳; extranjero → pasaporte ⏳.
- **Auditoría:** `CITA_LLEGADA`.

**C. Registro administrativo** ✅
- **Datos mínimos:** cédula, nombres, apellidos, fecha de nacimiento, sexo. **Opcionales:** estado civil,
  ocupación, dirección, teléfono, correo, seguro de salud.
- **Validaciones:** cédula válida y única; teléfono y correo con formato.
- **Auditoría:** `PACIENTE_CREADO`, `PACIENTE_ACTUALIZADO`.

**D. Triaje y signos vitales** ✅
- **Responsable:** Enfermería.
- **Pantalla:** "Triaje" desde la cita o el paciente.
- **Datos:** PA (mmHg), FC (lpm), FR (rpm), temperatura (°C), SpO₂ (%), peso (kg), talla (cm),
  IMC calculado, motivo breve, alergias reportadas al ingreso, nota de enfermería. Hora y autor
  automáticos.
- **Validaciones:** rangos de plausibilidad (ej. temperatura 30-45 °C) que rechazan errores de
  digitación; **alertas** de valores anormales que **no bloquean**.
- **Escalamiento:** alertas "críticas" (ej. SpO₂ < 90 %, PA ≥ 180/120) se muestran destacadas al médico.
  Los umbrales son generales de consulta externa en adultos y **debe aprobarlos la dirección médica**
  [VERIFICAR]; configurables ⏳.
- **Auditoría:** `TRIAJE_REGISTRADO`.

**E. Consulta médica** ✅
- **Responsable:** Médico.
- **Pantalla:** Consulta (una sola pantalla con secciones).
- **Datos:** motivo, enfermedad actual, revisión por sistemas, examen físico por regiones, evaluación,
  diagnósticos CIE-10 (presuntivo/definitivo, principal/secundario), plan.
- **Validaciones:** al firmar: motivo y al menos un diagnóstico.
- **Auditoría:** `CONSULTA_CREADA`, `CONSULTA_ACTUALIZADA`.

**F. Órdenes** ✅ (sin integración externa)
- Laboratorio, imagen, interconsulta y procedimientos, con indicación, prioridad y estado.
- Medicamentos: receta estructurada (sección 7).

**G. Revisión y cierre** ✅
- La pantalla muestra alergias y alertas de triaje antes de firmar.
- **Firma:** la nota pasa a "Firmada" con fecha, hora y médico; queda **bloqueada**.
- **Auditoría:** `CONSULTA_FIRMADA`.

**H. Alta ambulatoria** ✅ (parcial)
- Documentos: receta e indicaciones, certificado si corresponde.
- Resumen comprensible para el paciente con señales de alarma y próximo control ⏳ (plantilla propia).

**I. Después de la consulta**
- Resultados de órdenes: registro del resultado y marca "revisado por el médico" ✅.
- Correcciones mediante **adenda** con motivo ✅.
- Lista de pendientes (resultados sin revisar, controles vencidos) ⏳.
- Notificación segura de resultados al paciente ⏳.

### 3.2 Estados

| Entidad | Estados |
|---|---|
| Cita | Programada → Confirmada → En espera (llegó) → En atención → Atendida · Cancelada · No asistió |
| Consulta | Triaje (solo enfermería) → Borrador (médico) → **Firmada** (bloqueada) |
| Orden | Solicitada → Con resultado → Revisada |

---

## 4. Modelo de datos y estructura de la historia clínica

### 4.1 Entidades y campos

Leyenda: **O** obligatorio · **Op** opcional · **C** condicional.

| Entidad | Campo | O/Op/C | Propósito | Visible para |
|---|---|---|---|---|
| Paciente | cédula | O | Identificación única | Enfermería, Médico |
| | nombres, apellidos, fecha de nacimiento, sexo | O | Identificación y cálculo de edad | Enfermería, Médico |
| | estado civil, ocupación, dirección, teléfono, correo, seguro | Op | Contacto y contexto | Enfermería, Médico |
| | representante legal | C (menor o incapaz) | Consentimiento | ⏳ |
| Antecedente | tipo (Personal, Familiar, Patológico, Quirúrgico, Alergia), descripción, parentesco (C: Familiar) | O | Contexto clínico | Enfermería, Médico |
| Cita | paciente, fecha-hora, duración, estado, motivo breve (Op) | O | Organización | Enfermería, Médico |
| Consulta | historia, estado, motivo, enfermedad actual, revisión por sistemas, evolución, recomendaciones, próximo control, médico, firmada en | Según estado | Nota clínica | Médico (escritura), Enfermería (lectura) |
| | nota de enfermería, alergias reportadas | Op | Observaciones de triaje | Enfermería (escritura), Médico |
| Signos vitales | PA, FC, FR, T, SpO₂, peso, talla, grupo sanguíneo, **autor y hora** | Op cada uno | Triaje | Enfermería, Médico |
| Examen físico | región, hallazgos | C | Exploración | Médico |
| Diagnóstico | CIE-10, tipo (presuntivo/definitivo), condición (principal/secundario), descripción | O al firmar | Evaluación | Médico, Enfermería (lectura) |
| Prescripción | DCI, forma farmacéutica, concentración, dosis, vía, frecuencia, duración, cantidad, indicaciones | O (salvo indicaciones) | Tratamiento | Médico, Enfermería (lectura) |
| Orden | tipo, descripción, indicación, prioridad, estado, resultado, fecha del resultado | Según estado | Exámenes e interconsultas | Médico |
| Procedimiento de enfermería | tipo (inyectable, curación, toma de muestra, nebulización, otro), descripción, autor, fecha | O | Registro asistencial | Enfermería, Médico |
| Certificado | tipo (asistencia, reposo, salud), días de reposo (C), desde/hasta (C), observaciones, médico, fecha | O | Documento legal | Médico |
| Adenda | consulta, texto, motivo, autor, fecha | O | Corrección sin borrar | Médico, Enfermería (lectura) |
| Auditoría | fecha, usuario, acción, detalle (identificadores), IP | O | Trazabilidad | Administrador |

**⏳ Posteriores:** vacunación, hábitos y determinantes sociales estructurados, antecedentes
gineco-obstétricos, medicación habitual con conciliación, lista de problemas activos con estado.

### 4.2 Vistas

- **Resumen longitudinal del paciente** ✅: cabecera con edad, sexo, HC, **alergias en rojo**,
  antecedentes por tipo, últimos signos vitales, línea de tiempo de consultas y procedimientos.
- **Vista de consulta** ✅: a la izquierda la nota; a la derecha, fijo, el triaje, las alertas y las
  alergias. Lo crítico siempre visible, lo histórico a un clic.

### 4.3 Matriz de permisos (implementada en `SecurityConfig.java`)

| Acción | Enfermería | Médico | Admin |
|---|:-:|:-:|:-:|
| Ver / crear / editar pacientes | ✓ | ✓ | — |
| Antecedentes y alergias | ✓ | ✓ | — |
| Agenda y llegada | ✓ | ✓ | — |
| Triaje y signos vitales | ✓ | ✓ | — |
| Procedimientos de enfermería | ✓ | ✓ (lectura) | — |
| Ver historia y consultas | ✓ | ✓ | — |
| Escribir consulta, diagnóstico, receta, órdenes | — | ✓ | — |
| Firmar y adendas | — | ✓ | — |
| Certificados y PDF | — | ✓ | — |
| Usuarios, configuración, auditoría | — | — | ✓ |
| Indicadores agregados (solo conteos) | ✓ | ✓ | ✓ |

### 4.4 Duplicados y correcciones

- **Duplicados:** cédula única + validación de dígito verificador ✅; aviso de homónimos ⏳; fusión de
  historias solo por el médico, con auditoría y sin borrar el original ⏳.
- **Correcciones:** antes de firmar, la nota se edita libremente (borrador). Después, **solo adenda**:
  texto, motivo, autor y fecha. La nota original nunca se modifica ✅.

---

## 5. Diseño de experiencia

### 5.1 Identidad

La interfaz sigue la identidad de la portada de acceso: papel claro, tinta casi negra, tipografía
Inter con titulares grandes y compactos, etiquetas pequeñas en mayúsculas espaciadas, reglas de
1 px, botones en forma de cápsula y **un solo acento** (verde azulado clínico) reservado para la
acción principal y los estados "en curso". Color semántico solo para lo clínico: rojo (alergia,
crítico), ámbar (atención), verde (normal). Movimiento breve (entradas escalonadas de 0,6 s) que
desaparece con `prefers-reduced-motion`.

### 5.2 Pantallas clave por rol

| Rol | Inicio | Recorrido típico (clics) |
|---|---|---|
| Enfermería | **Hoy**: agenda del día con estados y sala de espera | Agenda → Marcar llegada → Triaje → Guardar (3) |
| Médico | **Hoy**: pacientes triados en espera y borradores por firmar | Abrir paciente en espera → completar → Firmar (3) |
| Administrador | **Hoy**: usuarios activos, últimos eventos de seguridad, configuración | Usuarios → Crear (2) |

### 5.3 Rapidez sin perder calidad

- Autocompletado CIE-10 por código o nombre ✅; listas sugeridas de hallazgos y dosis ✅.
- **No** se ofrece "copiar la nota anterior" [DISEÑO]: se muestran los datos previos como referencia,
  pero la nota nueva se escribe.
- Plantillas por motivo de consulta y por médico, versionadas ⏳.
- Dictado opcional ⏳ (requiere evaluación de privacidad del proveedor de voz).

### 5.4 Alertas sin fatiga

- Tres niveles: **crítico** (rojo, fijo), **atención** (ámbar), **información** (sin color). Solo
  crítico interrumpe.
- Cada alerta dice el motivo ("SpO₂ 88 %: menor de 90 %") ✅.
- Documentar por qué se continúa pese a una alerta ⏳.

### 5.5 Accesibilidad y dispositivos

Contraste AA, foco visible, etiquetas en todos los campos, navegación por teclado, diseño usable en
tableta. Conectividad intermitente: **no** en el piloto (ver ADR-001).

### 5.6 Portal del paciente ⏳

Solo tras definir verificación de identidad remota. Mientras tanto, entrega presencial de documentos.

---

## 6. Apoyo a la seguridad clínica

| Salvaguarda | Estado | Comportamiento |
|---|---|---|
| Alergias visibles al prescribir | ✅ | Banner rojo en la consulta y en la historia |
| Signos vitales anormales | ✅ | Avisos de atención y críticos, sin bloqueo |
| Plausibilidad de datos | ✅ | El servidor rechaza valores imposibles (ej. pulso 900) |
| IMC y clasificación OMS | ✅ | Cálculo automático con fuente indicada |
| Datos faltantes al firmar | ✅ | No se firma sin motivo y diagnóstico |
| Medicamentos sujetos a fiscalización | ✅ | Aviso: requieren receta especial, fuera del sistema |
| Duplicidad / interacciones / dosis fuera de rango | ⏳ | Requiere base de datos farmacológica validada **[VERIFICAR]** licencia y fuente |
| Ajuste por edad, peso, embarazo, función renal | ⏳ | Mismo requisito |
| Resultados críticos y pendientes | ⏳ | Bandeja de pendientes por médico |

**Reglas:** cada regla muestra su fuente, fecha y responsable de aprobación. El sistema no inventa
dosis ni sugiere diagnósticos.

---

## 7. Prescripción y órdenes

### 7.1 Receta

| Campo | Ejemplo ficticio | Obligatorio |
|---|---|---|
| Principio activo (DCI) | Paracetamol | Sí |
| Forma farmacéutica | Tableta | Sí |
| Concentración | 500 mg | Sí |
| Dosis | 1 tableta | Sí |
| Vía | Oral | Sí |
| Frecuencia | Cada 8 horas | Sí |
| Duración | 3 días | Sí |
| Cantidad | 9 (nueve) | Sí |
| Indicaciones | Tomar después de las comidas | No |
| Fecha, prescriptor, registro profesional, firma | Automático | Sí |

- **Validaciones:** sin abreviaturas en el nombre (aviso) ✅; cantidad numérica ✅; en letras ⏳.
- **Fiscalizados:** el sistema no emite receta especial ✅.
- **Formato:** receta imprimible para firma manuscrita ✅; receta electrónica con firma acreditada ⏳
  **[VERIFICAR]** validez y aceptación en farmacias.

### 7.2 Órdenes

| Campo | Valores |
|---|---|
| Tipo | Laboratorio · Imagen · Interconsulta · Procedimiento |
| Descripción | "Biometría hemática", "Rx de tórax PA" |
| Indicación clínica | Texto libre |
| Prioridad | Rutina · Urgente |
| Estado | Solicitada → Con resultado → Revisada |
| Resultado | Texto + fecha (adjuntos ⏳) |

Sin integración con laboratorios o farmacias hasta confirmar disponibilidad y autorización.

---

## 8. Consentimientos, documentos y comunicación

| Documento | Estado | Notas |
|---|---|---|
| Certificado de asistencia | ✅ | Médico, fecha, hora |
| Certificado de reposo | ✅ | Días, desde, hasta, diagnóstico solo si el paciente lo autoriza [BUENA PRÁCTICA] |
| Certificado de salud | ✅ | Texto de la evaluación |
| Consentimiento informado / negativa | ⏳ | Según AM 5316: capacidad, representante, información entregada, decisión, testigos, firma |
| Aviso de privacidad | ⏳ | **Separado** del consentimiento clínico; texto aprobado por el responsable de datos |
| Copia de la historia (PDF) | ✅ | Solo médico, auditado; entrega presencial tras verificar identidad |

**Mensajes al paciente:** sin diagnóstico ni motivo en SMS o correo; solo "tiene una cita" o "tiene
un documento disponible en el establecimiento" [BUENA PRÁCTICA].

---

## 9. Seguridad, privacidad y continuidad tecnológica

| Control | Estado | Responsable | Evidencia | Frecuencia | Riesgo mitigado |
|---|---|---|---|---|---|
| Acceso por rol y mínimo privilegio | ✅ | Admin + desarrollo | Pruebas automáticas de permisos | Cada cambio | Acceso indebido |
| Contraseñas BCrypt, bloqueo tras 5 fallos, límite de intentos | ✅ | Desarrollo | Pruebas, `docs/SEGURIDAD.md` | Cada cambio | Fuerza bruta |
| Sesión en cookie HttpOnly/SameSite, 8 h, invalidada al cambiar clave o desactivar | ✅ | Desarrollo | Pruebas | Cada cambio | Robo de sesión |
| Segundo factor | ⏳ | Desarrollo | — | — | Credenciales filtradas |
| Auditoría de acceso, apertura, creación, firma, impresión | ✅ | Admin | Tabla `auditoria` | Revisión mensual | Uso indebido no detectado |
| Auditoría inalterable (encadenada o externa) | ⏳ | Desarrollo | — | — | Borrado de evidencia por quien administra la base |
| Cifrado en tránsito (HTTPS) | ✅ opcional | Operación | `docs/OPERACION.md` | Instalación | Interceptación en red |
| Cifrado en reposo | ⏳ | Operación | Disco cifrado del servidor | Instalación | Robo de equipo |
| Respaldos y restauración probada | ✅ / prueba ⏳ | Admin | Archivo de respaldo + acta de prueba | Diario / trimestral | Pérdida de datos |
| Datos sintéticos en desarrollo y demostración | ✅ | Desarrollo | Datos de prueba ficticios | Siempre | Exposición de pacientes reales |
| Actualizaciones de dependencias y revisión de vulnerabilidades | ✅ CI / ⏳ escaneo | Desarrollo | GitHub Actions | Cada cambio / mensual | Vulnerabilidades conocidas |
| Plan de respuesta a incidentes | ⏳ | Dirección + responsable de datos | Procedimiento escrito | Anual | Brechas sin respuesta |
| Ubicación de datos y proveedores | ✅ local | Dirección | Inventario | Anual | Transferencias no autorizadas |
| Modo de contingencia sin red | ⏳ (formularios en papel + digitación posterior con marca) | Dirección médica | Procedimiento | — | Interrupción de la atención |

---

## 10. Firma, correcciones, auditoría y conservación

```
Triaje (Enfermería) ──► Borrador (Médico, editable) ──► Firmada (bloqueada) ──► Adenda(s)
```

- **Corregir ≠ sobrescribir.** Antes de firmar, el borrador es del médico. Después, el texto original
  queda tal cual y la adenda se muestra debajo, con motivo, autor y fecha.
- **Auditoría:** quién (usuario), qué (acción + identificadores), cuándo (fecha-hora local), desde
  dónde (IP). Sin datos clínicos en la auditoría.
- **Conservación y eliminación:** deshabilitadas hasta confirmar plazos oficiales (sección 2.2).

---

## 11. Arquitectura e interoperabilidad

Ver [ADR-001](adr/ADR-001-evolucion-a-nivel-hce-pediatrica.md). Resumen:

- **Capas:** SPA React → nginx (proxy, CSP, límite de intentos) → API Spring Boot → MySQL. Docker
  Compose; HTTPS con Caddy.
- **Módulos:** identidad y acceso · pacientes · agenda · triaje · consulta · prescripción y órdenes ·
  documentos · auditoría · configuración.
- **Estándares:** CIE-10 (catálogo cargado) ✅. HL7 FHIR como formato de exportación es una opción
  razonable, pero **no se confirmó su adopción oficial en Ecuador** [VERIFICAR]; no se implementa
  hasta entonces.
- **Interoperabilidad:**
  - **Técnica:** API REST propia documentada; exportación PDF ✅; exportación estructurada (JSON) ⏳.
  - **Semántica:** CIE-10 ✅; DCI en receta ✅; unidades del SI ✅.
  - **Organizacional:** acuerdos con laboratorios o con el MSP ⏳.
- **Evitar dependencia del proveedor:** base de datos abierta (MySQL), esquema versionado (Flyway),
  respaldos SQL estándar.
- **Pruebas:** solo datos sintéticos (`ApiTestBase`, pacientes ficticios).

---

## 12. Indicadores

| Indicador | Fórmula | Fuente | Frecuencia | Responsable |
|---|---|---|---|---|
| Tiempo de espera a triaje | Promedio (hora de triaje − hora de llegada) | Citas + auditoría | Mensual | Coordinación de enfermería |
| Consultas firmadas el mismo día | Consultas firmadas el día de atención ÷ consultas del día | Consultas | Semanal | Dirección médica |
| Completitud de signos vitales | Consultas con PA, FC, T y SpO₂ ÷ consultas | Signos vitales | Mensual | Coordinación de enfermería |
| Órdenes con resultado revisado | Órdenes revisadas ÷ órdenes con resultado | Órdenes | Mensual | Dirección médica |
| Inasistencia | Citas "No asistió" ÷ citas programadas | Citas | Mensual | Administración |
| Posibles duplicados detectados | Conteo de avisos de homónimo | Auditoría ⏳ | Mensual | Administración |
| Intentos de acceso bloqueados | Conteo `LOGIN_BLOQUEADO` | Auditoría | Semanal | Administrador |
| Disponibilidad | Minutos en servicio ÷ minutos del horario | Monitoreo ⏳ | Mensual | Operación |

> Los indicadores no deben convertirse en metas que presionen a atender más rápido o a llenar campos
> sin sentido clínico. Se revisan en conjunto con calidad de atención.

---

## 13. Plan de implementación

| Fase | Entregables | Responsable | Criterio de aceptación |
|---|---|---|---|
| 1. Descubrimiento | Observación de 10 consultas reales (sin capturar datos), entrevistas a 3 médicos, 2 enfermeras | Equipo UX + dirección médica | Recorrido validado |
| 2. Validación legal | Respuesta a las preguntas jurídicas (abajo), evaluación de impacto si aplica | Asesoría jurídica + responsable de datos | Matriz 2.1 sin filas críticas en [VERIFICAR] |
| 3. Prototipo | Versión actual de BioHCEMG | Desarrollo | Flujo A–G completo con datos sintéticos |
| 4. Usabilidad | 5 sesiones con tareas cronometradas | UX | Triaje < 3 min; consulta simple documentada < 8 min |
| 5. Piloto | 1 consultorio, 4 semanas, papel como respaldo | Dirección médica | Sin incidentes de seguridad; 90 % de consultas firmadas el mismo día |
| 6. Capacitación | Guía de 2 páginas por rol + sesión de 1 h | Enfermería y médico líder | Cada usuario completa un caso ficticio |
| 7. Despliegue | Servidor con HTTPS, respaldo diario fuera del equipo | Operación | Restauración probada |
| 8. Revisión | Indicadores + retroalimentación | Dirección | Revisión trimestral |

### Tareas de verificación

| ID | Tarea |
|---|---|
| V-01 | Confirmar texto vigente de la LOPDP art. 30 y obligaciones del responsable (registro de actividades, delegado, evaluación de impacto). |
| V-02 | Obtener los formularios anexos del AM 00115-2021 y mapear campo a campo con la consulta externa. |
| V-03 | Confirmar plazos de conservación y reglas de corrección y custodia de la historia. |
| V-04 | Confirmar texto oficial del AM 00031-2020 y su reforma (receta). |
| V-05 | Confirmar reglamento MSP vigente de certificados médicos y formato aceptado por el IESS. |
| V-06 | Confirmar si una nota firmada por usuario autenticado tiene valor probatorio o si se requiere firma electrónica acreditada. |
| V-07 | Confirmar con ACESS los requisitos de HCE para el licenciamiento del establecimiento. |
| V-08 | Consultar si existen especificaciones de interoperabilidad oficiales del MSP. |

### Decisiones que requieren aprobación del establecimiento

1. Umbrales de alertas de signos vitales.
2. Horario de atención y duración de citas.
3. Encabezado y pie de receta y certificados.
4. Quién puede ver la historia (¿todo el personal clínico o solo el tratante?).
5. Procedimiento de contingencia ante caída del sistema.
6. Política de respaldos (frecuencia, ubicación, custodia).

### Preguntas para asesoría jurídica, protección de datos y dirección médica

1. ¿El establecimiento es responsable del tratamiento? ¿Necesita delegado de protección de datos?
2. ¿Es obligatoria una evaluación de impacto para esta HCE? ¿Debe presentarse a la Superintendencia?
3. ¿Qué texto de aviso de privacidad se entrega y cómo se documenta su entrega?
4. ¿La firma por usuario y contraseña basta para la nota médica o se exige firma electrónica?
5. ¿Plazo de conservación y procedimiento de eliminación?
6. ¿Cómo se entrega una copia de la historia y a quién (paciente, representante, autoridad)?
7. ¿Qué cambia si el establecimiento es público?

### Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Resistencia del personal | Piloto voluntario, papel como respaldo, capacitación corta |
| Caída del servidor durante consulta | Procedimiento en papel y digitación posterior marcada |
| Requisito legal no previsto | Validación legal antes del piloto (fase 2) |
| Fatiga de alertas | Pocos niveles, revisión mensual de alertas ignoradas |

---

## 14. Propuesta de valor y demostración

### Guion de 5 minutos (paciente ficticia: Ana María Pérez Loja, 41 años)

| Minuto | Quién | Qué se muestra |
|---|---|---|
| 0:00 | Enfermera | Agenda del día: Ana María llega a las 09:28 → "Marcar llegada". |
| 0:45 | Enfermera | Triaje: T 38,6 °C, FC 96, SpO₂ 97 %, peso 68 kg, talla 160 cm. Aparece **IMC 26,6 · Sobrepeso** y aviso **Fiebre**. Refiere alergia a penicilina. |
| 1:45 | Médico | "Hoy": Ana María aparece **en espera, triada**. Al abrir, la **alergia en rojo** y la fiebre ya están arriba. |
| 2:30 | Médico | Escribe motivo y examen; busca "J02" → Faringitis aguda. |
| 3:15 | Médico | Receta: Paracetamol · tableta · 500 mg · 1 tableta · oral · c/8 h · 3 días · 9. Certificado de reposo de 2 días. |
| 4:00 | Médico | **Firmar**: la nota se bloquea. Intenta editar: solo puede añadir una adenda. |
| 4:30 | Admin | Auditoría: quién abrió la historia, quién firmó, a qué hora. El administrador **no** puede ver la nota. |

### Cinco características que muestran valor en una consulta real

1. Alergia visible antes de prescribir.
2. Signos vitales con IMC y alertas listos al abrir la consulta.
3. Diagnóstico CIE-10 en dos teclas.
4. Receta completa por DCI e imprimible.
5. Firma que protege la nota y adendas que muestran la corrección.

### Validar con un grupo de médicos antes de seguir desarrollando

- ¿El orden de secciones de la consulta coincide con cómo piensan?
- ¿Qué umbrales de alerta les parecen útiles y cuáles ruido?
- ¿Necesitan plantillas por motivo desde el primer día?
- ¿El certificado y la receta impresos son aceptados por sus pacientes y farmacias?

---

## Requisitos mínimos para un piloto seguro

1. HTTPS activo en la red del consultorio.
2. Contraseñas propias para cada usuario; nadie comparte cuenta.
3. Respaldo diario copiado fuera del servidor y **una restauración probada**.
4. Matriz legal revisada por asesoría jurídica (sección 2) y aviso de privacidad aprobado.
5. Umbrales de alerta aprobados por la dirección médica.
6. Procedimiento en papel para caídas del sistema.
7. Solo datos sintéticos en capacitación y demostraciones.

## Puede esperar a una versión posterior

- Portal del paciente y recordatorios automáticos.
- Firma electrónica acreditada y receta electrónica.
- Base farmacológica (interacciones, dosis).
- Plantillas por motivo y dictado.
- Roles de laboratorio, farmacia y auditor clínico.
- Consentimiento informado digital.
- Telemedicina.
- Interoperabilidad con plataformas oficiales.
- Modo sin conexión.
