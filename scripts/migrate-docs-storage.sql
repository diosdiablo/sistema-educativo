-- Migración: mover PDFs de Postgres a Supabase Storage
-- Ejecutar en el SQL Editor de Supabase (dashboard).
-- Crea el bucket 'documentos' y agrega la columna storage_path a ambos tablas.

-- 1) Bucket de Storage
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

-- 2) Políticas para el bucket (acceso desde la app con la anon key)
create policy "documentos public read"
on storage.objects for select
using (bucket_id = 'documentos');

create policy "documentos public insert"
on storage.objects for insert
with check (bucket_id = 'documentos');

create policy "documentos public update"
on storage.objects for update
using (bucket_id = 'documentos');

create policy "documentos public delete"
on storage.objects for delete
using (bucket_id = 'documentos');

-- 3) Columna storage_path
alter table public.planning_documents
add column if not exists storage_path text;

alter table public.learning_sessions
add column if not exists storage_path text;