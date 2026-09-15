-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN: FILTRADO DE ASISTENCIA POR DOCENTE (RPC server-side)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- (o: psql -f scripts/migrate-attendance-rpc.sql)
-- Fecha: 2026-09-14
--
-- Qué hace:
--  1. get_attendance_for_students(p_student_ids)
--     Devuelve SOLO los registros de los estudiantes del docente,
--     evitando transferir los registros de toda la I.E.
--  2. merge_attendance(p_id, p_date, p_records)
--     Fusiona los registros del docente con los ya existentes para
--     esa fecha, SIN pisar los registros de otros docentes.
-- ══════════════════════════════════════════════════════════════

-- 0) Asegurar columna updated_at en attendance (usada por delta sync y RPC)
DO $$BEGIN
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- 1) Lectura podada
CREATE OR REPLACE FUNCTION get_attendance_for_students(p_student_ids TEXT[])
RETURNS TABLE(id TEXT, date TEXT, records JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  r attendance%ROWTYPE;
  pruned JSONB;
BEGIN
  FOR r IN SELECT * FROM attendance ORDER BY date LOOP
    id := r.id;
    date := r.date;
    created_at := r.created_at;
    updated_at := r.updated_at;
    IF p_student_ids IS NOT NULL AND array_length(p_student_ids, 1) > 0 THEN
      SELECT coalesce(jsonb_object_agg(k, v), '{}'::jsonb) INTO pruned
      FROM jsonb_each(r.records) AS kv(k, v)
      WHERE kv.k = ANY(p_student_ids);
      records := pruned;
    ELSE
      records := r.records;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 2) Escritura con fusión (merge), nunca pisa registros ajenos
CREATE OR REPLACE FUNCTION merge_attendance(p_id TEXT, p_date TEXT, p_records JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO attendance (id, date, records, created_at, updated_at)
  VALUES (p_id, p_date, p_records, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET records = attendance.records || EXCLUDED.records,
        updated_at = now();
END;
$$;

-- Verificación (opcional):
-- SELECT id, date, jsonb_object_keys(records) AS estudiante
-- FROM get_attendance_for_students(ARRAY['<student_id_de_prueba>']);