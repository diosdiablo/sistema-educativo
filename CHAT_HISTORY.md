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

### 3. Ideas pendientes (no implementadas)

- Portal de padres
- Tareas/asignaciones por curso y sección
- Registro de incidencias/disciplina
- Importación masiva de alumnos desde Excel
- Fotos de estudiantes
- Boleta de notas en PDF
