-- Migración: habilitar sync incremental para attendance y behavior
-- Agrega la columna updated_at y un trigger que la actualiza en cada edición.
-- Ejecutar en el SQL Editor de Supabase.

-- 1) Columna updated_at
alter table public.attendance
add column if not exists updated_at timestamptz default now();

alter table public.behavior
add column if not exists updated_at timestamptz default now();

-- 2) Backfill: filas existentes sin updated_at usan su created_at (o ahora)
update public.attendance set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

update public.behavior set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

-- 3) Trigger para actualizar updated_at en cada UPDATE
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function public.set_updated_at();

drop trigger if exists behavior_set_updated_at on public.behavior;
create trigger behavior_set_updated_at
before update on public.behavior
for each row execute function public.set_updated_at();