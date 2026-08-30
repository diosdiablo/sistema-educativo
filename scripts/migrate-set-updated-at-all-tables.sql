-- Migración: trigger set_updated_at en TODAS las tablas con updated_at
-- Para que las ediciones se propaguen en el login incremental.
-- Ejecutar en el SQL Editor de Supabase.

-- Función compartida (idempotente, ya existe si corriste la anterior)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'students', 'subjects', 'classes', 'grades',
    'instruments', 'instrument_evaluations', 'schedule', 'diagnostic_evaluations',
    'period_dates', 'planning_documents', 'events', 'learning_sessions',
    'push_subscriptions', 'login_history'
  ] loop
    -- Backfill: filas con updated_at nulo usan ahora (sin depender de created_at)
    execute format('update public.%I set updated_at = now() where updated_at is null', t);
    -- Trigger
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end $$;