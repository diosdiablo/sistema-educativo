# Historial de Chat - Sistema Educativo

## Sesión 2026-10-08

- **Grades.jsx — Selección múltiple + nota grupal CONECTADA a la UI** (antes los helpers estaban huérfanos):
  - Checkbox "seleccionar todos" en el header de la tabla + checkbox por fila de alumno (fila seleccionada se pinta `#e8f0fe`).
  - Barra flotante inferior (azul, pill) cuando hay selección: contador + botón "Nota grupal" + botón limpiar (`X`).
  - Modal "Nota grupal" nuevo: actividad, competencia, nota 0–20, opción `groupOnlyFirst` ("solo sin nota"). Guarda con `saveInstrumentEvaluation` iterando `selectedStudents` (usa `findEvalFor` para actualizar existentes o crear nuevas con id `grp-<ts>-<studentId>`, `instrumentType: 'quick_grade'`, `maxPossible: 20`, qualitative vía `numToQualitative`). Muestra resumen creadas/actualizadas/omitidas.
  - Modal de edición individual: checkbox `quickGradeApplyToSelected` ("aplicar también a los N seleccionados") visible solo si el alumno editado está en una selección de 2+; `handleSaveEdit` replica la nota al resto.
  - ESLint en Grades.jsx bajó de 16 → 8 errores (los 8 restantes son pre-existentes: `type/scores/criteria` en `numToQualitative`, `hoveredEval`, 2 `no-empty`, `Icon`, `idx`).
  - Build OK (`npm run build` ✓).
- **Pendiente:** commit/push de los 5 archivos modificados (`CHAT_HISTORY.md`, `BoletaNotas.jsx`, `Grades.jsx`, `Schedule.jsx`, `supabase-schema.sql`). Probar flujo en `npm run dev`.

## Línea de tiempo completa del proyecto (reconstruida desde git, 5-abr → 17-sep-2026)

Total: **756 commits** en `main`. Rama extra sin merge: `opencode/glowing-comet`.
Volumen: abr 407 · may 152 · jun 19 · jul 29 · ago 108 · sep 41.

### Abr 2026 — Cimientos (407 commits, `a5d2e31` → `3d3f0e0` aprox.)
- Base funcional: Login, Dashboard, Estudiantes, Calificaciones, Instrumentos, Asistencias, Horario, Reportes, Configuración, `StoreContext.jsx` como fuente única de estado.
- `supabase-schema.sql` se crea y se va ampliando; importadores `import-students.cjs`/`import-all.cjs` + SQL de carga masiva.
- Decisión temprana importante: **primero localStorage, sync a Supabase opcional** para no perder datos (`b8d1176`), luego se implementa la sync real (`3881db4`).
- Ordenamiento de estudiantes por apellido/grado/sección, normalización de campos snake_case↔camelCase desde Supabase.
- Planificación documental + generador con IA: `gemini.js`, `deepseek.js`, `groq.js`, `AIPlanningGenerator.jsx`.
- Historial de ingresos de usuarios guardado en Supabase (`60dd266`).
- Informes dentro de Planificación, filtrados por docente.
- Many fixes de sintaxis JSX y de carga (Settings, App, StoreContext).
- `exportTemplates.js` creado para los reportes Excel.

### May 2026 — ProductoSchool: módulos y primer gran módulo nuevo (152 commits)
- **Ficha del estudiante** (`/students/:id`): calificaciones, asistencia, eval. diagnóstica + filtro por bimestre (`015fc4a`).
- **Calendario escolar** con gestión de eventos + notificaciones al crear eventos + Calendario Cívico Escolar MINEDU (`f0dd7cf`, `5e7981f`).
- **Notificaciones**: in-app (campanita en sidebar, swipe para borrar en móvil) y **push PWA** con Vercel API + VAPID (`7515986`).
- **Boleta de Notas** (`/boleta`): buscador autocomplete, tabla competencias × 4 bimestres, PDF por grado; html2pdf → html2canvas+jsPDF página por página.
- **Portal de Padres**: acceso con DNI, notas y asistencia de sus hijos (`8ab37a9`).
- **Chat entre docentes** en tiempo real con push al destinatario, luego separado en `/chat` y `/chat/:userId`; varios fixes de pantalla en blanco en móvil por `position:fixed`/`dvh`.
- Registro de conducta (positivas/negativas), calificación rápida sin instrumento, filtro de notas cualitativas por % (no cubetas).
- Gráficos de asistencia diaria/semanal/mensual + filtros por grado/sección.
- **Realtime Supabase** multi-máquina: canal genérico con broadcast automático en `syncToSupabase`/`deleteFromSupabase` (`d147d6b`) — tras muchas pruebas con polling como respaldo.
- Sorteo aleatorio de estudiante, tabla de historial de asistencias, y pastel de cumpleaños animado.
- Auto-refresh en cada deploy: `version.json` generado en prebuild + polling.
- **BUG ABIERTO**: el PDF de la Boleta se genera pero descarga en blanco (4 intentos fallidos, ver sección de pendientes).

### Jun 2026 — Calificaciones pulidas (19 commits)
- Ruleta de sorteo en la tabla de notas: muchas iteraciones (canvas → CSS conic-gradient, nombres radiales, animación de rebote) hasta la versión estable.
- Calificación rápida con nivel literal AD/A/B/C y botón de alumno al azar.
- Modal editor para modificar/crear evaluaciones; logica de calificacion equitativa segun criterios positivos.
- Fixes de parseo JSON de `records` y de `QuotaExceededError` en localStorage.

### Jul 2026 — Persistencia de columnas extra (29 commits)
- Columnas de calificación rápida persistidas primero en localStorage, luego en Supabase (`instruments`, `type: quick_column`).
- Matching de evaluaciones por `instrumentId` (el matching por `activityName` duplicaba columnas), dedupe extra vs existentes.
- Botón de borrar columna (extra y existentes), renombrado por clic en Pencil.
- Ciclo de azar persistente 90 min en localStorage, con alumno resaltado hasta calificar.
- Revert de un intento de persistencia fallida + re-add (el ciclo del 13-jul).

### Ago 2026 — Rediseño visual masivo + madurez operacional (108 commits)
- **Rediseño "Google Material" de ~15 páginas** en dos días (24–25 ago): Login, Dashboard, Estudiantes, Calificaciones, Asistencia, Instrumentos, Reportes, Configuración, Gestión de Usuarios, Grados y Secciones, Áreas, Conducta, Planificación, Eval. Diagnóstica, Perfil de Estudiante, Portal de Padres, Acceso de Padres, Chat, ruleta, modales y notificaciones. Calendario y horario al estilo Google (Calendar). Modo oscuro "black" con toggle en sidebar.
- **Rendimiento**: lazy loading de páginas (bundle 3MB → 249KB), no descargar `file_data` al iniciar (52s → 3s), tooltip portal con posición por cursor.
- **Registro Auxiliar** con plantilla institucional: se dejó de generar Excel simple y se edita el XML del xlsx directamente con JSZip para preservar colores, escudo y fórmulas; columnas de competencias dinámicas, conclusiones por nivel NL,Generalidades con área/grado/sección, y export oficial RegNotas. El salto inicial fue `0f6ac06`/`51da4b5`, seguido de ~25 fixes de corrupción XML.
- **Rol Auxiliar de Educación** (EBR Secundaria) con permisos y menú dinámico; el auxiliar no aparece en el desplegable de docentes del Horario.
- **Modo invitado** de solo lectura para demo, con escrituras Supabase no-op a nivel cliente (luego se quitó el botón del login).
- Documentos (planificación y sesiones de aprendizaje) pasan de Postgres a **Supabase Storage**, con fallback a DB y columna `storage_path`.
- **Anotación de PDFs** con lápiz/mouse/touch, guardado del PDF plano en Supabase; PDFs en iframe, Word/Excel con descarga; blob URLs para data URLs.
- **Sync incremental** por `updated_at` con refresh completo cada 24h, cargas filtradas por rol, login_history con auto-limpieza a 90 días.
- Trigger `set_updated_at` para todas las tablas; import de instrumentos desde JSON.

### Sep 2026 — Multi-docente, asistencia real y cierre de seguridad (41 commits, HEAD `f70ab55`)
- Vistas de **Horario por sección y por docente**; ver otro docente es solo lectura; lista todos los docentes.
- **Asistencia a dos niveles**: el auxiliar registra la llegada a la I.E. (tarjeta de control) y el docente la asistencia a clase; el reporte de clase detecta quién faltó habiendo llegado. Columna de observaciones para incidencias. Se guarda quién tomó la asistencia y el reporte del auxiliar muestra solo sus registros. Nueva util `src/utils/attendanceLevels.js`.
- **Nivel de logro por competencia** editable en Calificaciones, persistido en `grades` (letra ↔ numérico), reflejado en el Registro Auxiliar; si no está asignado, muestra el promedio de evidencias.
- **Filtrado de datos por docente**: asistencia vía RPC (`get_attendance_for_students`, `merge_attendance`), behavior y documentos podados a los estudiantes asignados; `class_id` guarda el nombre, no el id.
- Portal de padres: deriva notas de `instrument_evaluations` por competencia, muestra nivel literal por actividad, calificaciones rápidas, evidencias cualitativas y todas las competencias aunque estén sin calificar; normaliza el DNI del apoderado a 8 dígitos.
- Varios fixes de chunks JS corruptos en caché (service worker v3, `immutable` en `/assets`), y orden de grados/secciones por nombre en el store.
- **Seguridad del login** (17-sep, HEAD): `api/login.js` valida usuario+password server-side; el password desaparece del estado, de localStorage y de los broadcasts; se elimina la validación offline. `updateUser` usa PATCH y ya no pisa el password si viene vacío.

---

## Sesión actual (7-oct-2026) — Evaluación grupal desde la tabla de Calificaciones

**Problema**: el modo "Grupos" de Aplicar Instrumento armaba los equipos con `prompt()` y un clic por alumno, y la composición se perdía al recargar.

**Decisión del usuario**: los equipos los arma cada docente a su manera → se descartó agregar `group` al alumno (sería un único valor compartido entre docentes). En su lugar, la selección de alumnos es contextual y vive en la tabla de Calificaciones.

**Implementado en `src/pages/Grades.jsx` — REVERTIDO el 7-oct-2026 a pedido del usuario ("deformaste la tabla")**.

Lo que se había hecho (todo revertido, `Grades.jsx` quedó byte a byte como HEAD, confirmado con `git status` limpio y el bundle volviendo a `Grades-CxMpKJh9.js` / 55.76 kB):
- Columna de checkbox antes del N°, con "seleccionar todos" en el header. Fila marcada en azul `#e8f0fe` (distinto del amarillo `#fef9c3` de la ruleta de azar). La selección se limpia al cambiar sección, bimestre o área.
- Barra de contexto sobre la tabla solo con selección activa, con conteo y botón "Limpiar".
- Clic en celda vacía: sin selección → flujo individual de siempre; con selección → modal en modo grupo con la misma nota para cada alumno, ids únicos `${stamp}-${i}` en `saveInstrumentEvaluation`.
- Se extrajo `findEvalFor(student, compId, inst)` para no duplicar la lógica de matching de celda.
- Los alumnos ya calificados en esa actividad se omiten y se avisa; no se sobrescriben.
- Checkbox "Aplicar solo a <alumno>" dentro del modal para desenrancar sin perder el bloque.
- **La selección se limpia tras una calificación masiva**, para que el siguiente clic no escriba N notas sin querer.
- **Calificación rápida**: el modal "Nueva Columna" ofrece "Calificar también a los N seleccionados" (marcado por defecto) y encadena el modal de nota AD/A/B/C.

**Por qué falló**: no se verificó en el navegador antes de entregar. El build y el lint pasan, pero la tabla de Calificaciones es densa yResponsive (scroll horizontal, sticky, `tableLayout: auto`, `colSpan`), y agregar una columna + envolver la tabla en un div extra deformó el layout. El proyecto no tiene tests ni Playwright, así que la única validación posible fue visual y no se hizo.

**Lección para la próxima**: en cambios de UI en tablas sensibles, pedir captura o revisión visual del usuario ANTES de dar el trabajo por terminado, aunque el build pase. Alternativa: agregar el selector de alumnos FUERA de la tabla (por ejemplo, una fila de filtros con un multiselect) para no tocar la estructura del `<table>`.

**Backup previo**: `%TEMP%\opencode\grupales_20261007_151619` (incluye el rework sin commitear de horarios). Ahí quedó la versión revertida, sirve de referencia.

**Sigue pendiente**: el panel "Grupos" de `Instruments.jsx:1039-1222` (armar equipos con `prompt()`) sigue como estaba, y el bug de que la nota grupal es una sola para todo el equipo.

**Nota**: se descubrió código muerto desde antes: `predefinedGroups` (`Instruments.jsx:270-278`) agrupa por `student.group`, campo que nadie escribe porque no está en la lista blanca de columnas de `students` (`StoreContext.jsx:866`). El importador original sí lo mapeaba (`backup.jsx:485`). Con la decisión actual queda sin uso.

---

## Sesiones recientes (sep 2026)

### 5. NUEVO PEDIDO: Aula Virtual "tipo Moodle" para actividades virtuales de estudiantes (en diseño, no implementado)
- Decisión del usuario (19-sep-2026): **no** instalar Moodle real; construir módulo liviano integrado en la app.
- **Login de estudiantes**: solo con DNI (reusar flujo actual de `ParentLogin` — sin cuentas nuevas; alumno elige su perfil tras digitar DNI de apoderado).
- **Alcance**: docente publica actividad (título, descripción, archivo opcional, fecha límite, por sección/área); estudiante la ve y entrega **texto y/o archivo**; el docente califica y la nota **cuenta como tipo de nota en el boletín**.
- **Mecánica propuesta**: tablas nuevas `virtual_activities` y `virtual_submissions` en Supabase; entregas con archivo vía Supabase Storage (ya usado en documentos); notificaciones push/in-app al publicar; seguir escala de calificación del boletín (AD/A/B/C).
- **Ojo al trabajar aquí**: `supabase-schema.sql` está enchufado al rework paralelo sin commitear → los cambios de BD nuevos deben ir en `scripts/migrate-virtual-activities.sql`, no ahí.

### 1. Seguridad del login terminada — commit `f70ab55` (push a main)
- Nuevo endpoint `api/login.js`: valida usuario+password directo contra Supabase server-side (sin exponer passwords).
- El password se eliminó del estado, de `localStorage` (`edu_users` se guarda saneado) y de los broadcasts.
- `login()` intenta `/api/login`; si falla estando online, consulta directa a Supabase con `eq('username').eq('password')` y select sin columna password. **Se eliminó la validación offline** (decisión de seguridad).
- `register`/`updateUser`: guardan/sincronizan usuarios saneados; updateUser no sobrescribe password si el campo queda vacío.
- `Users.jsx`: al editar, password inicia vacío y solo se exige para usuarios nuevos.
- `Chat.jsx`: select de users sin password.
- Archivos: `StoreContext.jsx`, `Users.jsx`, `Chat.jsx`, `api/login.js`. Build OK.
- **PENDIENTE**: configurar las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel (Project Settings > Environment Variables) para que la edge function `api/login.js` funcione. Mientras no estén, funciona el fallback de consulta directa a Supabase.

### 2. Fix crash en Ficha del Estudiante — commit `4c63efc` (push a main)
- `day.records[student.id]` crasheaba cuando los registros realtime llegaban como `null`, `undefined` o string (doble codificación JSON).
- Se agregó `normalizeRecords()` en `StoreContext.jsx` (~línea 518); `pruneRecordsForUser` siempre devuelve un objeto.

### 3. Fix error React #31 (objects as children) — commit `b726b5b` (push a main)
- La asistencia puede ser objeto `{ clase: {s,u,n} }` o `{ llega: ... }` (nuevo sistema `src/utils/attendanceLevels.js`), pero `StudentProfile.jsx` esperaba strings `'P'/'T'/'F'/'J'`.
- Se agregó el helper `entryStatus()` en `StudentProfile.jsx` (~línea 17) y se aplica en los 4 puntos (stats, stats por período, filtro de historial, render de historial).

### 4. Pendientes a corto plazo
- **Crear ~39 cuentas de docentes** en Supabase (hoy solo existen admin, fcanevaro, jmartel). **El usuario las creará manualmente** (con su `assignments`): la app ya soporta multi-docente por diseño (filtrado por `assignments` de clase+materia según rol).
- **`Dashboard.jsx:379-386`**: el conteo de asistencia puede fallar/malcontar con la estructura nueva de objetos (no crashea, pero revisar).
- **`.env` sigue sin agregar a `.gitignore`** (contiene credenciales reales y está en la raíz).
- **Rework paralelo sin commitear y FUERA de main** (no mezclar): `BoletaNotas.jsx`, `Schedule.jsx`, `supabase-schema.sql`, `CurriculumEditorModal.jsx`, `ScheduleGeneratorModal.jsx`, `scheduleGenerator.js`, `check-assignments.cjs`. Respaldos del StoreContext con rework en `$env:TEMP\opencode\StoreContext_working_{F,G}.jsx`.
- **Flujo de trabajo de commits**: backup del working → `git checkout --` → aplicar solo cambios autorizados → build → commit → push → restaurar working reaplicando cambios. Los builds prueban con el dossier y `npm run build`; el deploy es automático desde main (Vercel).

### Nota técnica
- `Attendance.jsx` ya usa los helpers `statusForEntry`/`markFor`/`noteFor` de `attendanceLevels.js`. No renderizar crudo `day.records[student.id]` como child de React: normalizar con `normalizeRecords`/`entryStatus` primero.

---

## Pendientes para la próxima sesión

### 1. Notificaciones Push - Configuración pendiente en producción

**SQL en Supabase** (ejecutar en SQL Editor):
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id TEXT PRIMARY KEY,
  user_name TEXT,
  subscription TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
```

**Variables de entorno en Vercel** (Project Settings > Environment Variables):
| Key | Value |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | `BFNna3jpj6RRifW3B2fliDs5nNO_sOV-R_lG7JgbPdU6npJIwuU4ugYycs9IqeG6FfC0YgGy-PF9HjhF0t6QBAE` |
| `VAPID_PRIVATE_KEY` | `-pHXSugee9Xe3ip22vQ-mf7aDSfboH1IbLe7O9uScM0` |

### 2. Funcionalidades implementadas (en orden)

1. **Fix**: Al restaurar sesión redirigir al dashboard (StoreContext.jsx)
2. **Ficha del Estudiante** (`/students/:id`) - Calificaciones, asistencia, eval. diagnóstica
3. **Calendario Escolar** (`/calendar`) - Vista mensual con eventos (feriados, reuniones, exámenes, etc.)
4. **Notificaciones in-app** - Campanita en sidebar con badge de no leídas
5. **PWA** - manifest.json, service worker, instalable en celular
6. **Notificaciones Push** - Vercel API + Web Push (pendiente configurar SQL y Vercel env vars)

### 3. Sesión actual (13 mayo 2026)

**Página de Boleta de Notas** (`/boleta`):
- Implementada con buscador autocomplete por nombre/DNI/grado
- Vista individual con tabla de competencias, 4 bimestres, promedios
- Botones "Generar PDF por Grado" debajo del buscador
- `html2pdf.js` reemplazado por `html2canvas` + `jsPDF` directo (página por página)

**BUG PENDIENTE**: El PDF se genera pero descarga vacío (blanco). Se probaron:
1. ❌ `left: -9999px` → html2canvas no captura fuera del viewport
2. ❌ `opacity: 0` → html2canvas igual no captura
3. ❌ Contenedor temporal visible + html2pdf wrapper → se ve el contenido en pantalla pero el PDF sale vacío
4. ❌ Página por página con html2canvas + jsPDF directo → aún no probado por el usuario

**Posible causa**: html2canvas podría tener problemas con el contenido inline largo o con los estilos en línea. Pendiente de depurar.

### 4. Funcionalidades implementadas (en orden)

1. **Fix**: Al restaurar sesión redirigir al dashboard (StoreContext.jsx)
2. **Ficha del Estudiante** (`/students/:id`) - Calificaciones, asistencia, eval. diagnóstica
3. **Calendario Escolar** (`/calendar`) - Vista mensual con eventos (feriados, reuniones, exámenes, etc.)
4. **Notificaciones in-app** - Campanita en sidebar con badge de no leídas
5. **PWA** - manifest.json, service worker, instalable en celular
6. **Notificaciones Push** - Vercel API + Web Push (pendiente configurar SQL y Vercel env vars)
7. **Boleta de Notas** (`/boleta`) - Búsqueda de alumno, tabla de notas por competencias/bimestres, botones de PDF por grado

### 5. Ideas pendientes (no implementadas)

- Portal de padres
- Tareas/asignaciones por curso y sección
- Registro de incidencias/disciplina
- Importación masiva de alumnos desde Excel
- Fotos de estudiantes
- **GENERADOR DE HORARIOS** (idea validada 04-set-2026 por el usuario): herramienta en la app que genere horarios automáticamente para varias secciones/docentes (hoy solo hay 1 docente). Requiere: tabla `curriculum` (horas semanales por grado/área), algoritmo de backtracking + heurística MRV sin librerías, vista previa reutilizando las vistas por sección/docente, validación de conflictos y botón "Aplicar" que escribe en `schedule` conservando bloques fijos `__ATENCION__`/`__TRABAJO__`. Pendiente definir con el usuario: horas reales por grado/área y restricciones especiales (dobles bloques, docentes de jornada parcial). El usuario la dejó "en el aire" y pidió que se la recuerde en el futuro próximo.
