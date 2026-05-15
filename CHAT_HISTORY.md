# Historial de Chat - Sistema Educativo

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
