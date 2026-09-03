-- Migración: limpiar instrument_evaluations
-- 1. Eliminar columna observations (nunca se usa)
DO $$BEGIN
  ALTER TABLE instrument_evaluations DROP COLUMN IF EXISTS observations;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- 2. Asegurar que user_id existe (ya debería existir)
DO $$BEGIN
  ALTER TABLE instrument_evaluations ADD COLUMN IF NOT EXISTS user_id TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
