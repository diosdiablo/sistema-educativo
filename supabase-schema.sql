-- ============================================
-- SCHEMA SQL PARA SISTEMA EDUCATIVO
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  assignments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migración: cambiar assignments de TEXT[] a JSONB
DO $$BEGIN
  ALTER TABLE users ALTER COLUMN assignments TYPE JSONB USING assignments::jsonb;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dni TEXT,
  class_id TEXT NOT NULL,
  grade_level TEXT,
  guardian_name TEXT,
  guardian_dni TEXT,
  guardian_phone TEXT,
  birth_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cursos/materias
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  competencies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clases/grados
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna color si no existe (migración)
DO $$BEGIN
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Tabla de asistencia (por fecha, no por estudiante)
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  records JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  competency_id TEXT,
  period TEXT NOT NULL,
  score NUMERIC,
  conclusion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de instrumentos de evaluación
CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  subject_id TEXT,
  class_id TEXT,
  date TEXT,
  max_score NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de evaluaciones de instrumentos
CREATE TABLE IF NOT EXISTS instrument_evaluations (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  score NUMERIC,
  max_possible NUMERIC,
  qualitative TEXT,
  competency_id TEXT,
  subject_id TEXT,
  subject_name TEXT,
  period TEXT,
  class_id TEXT,
  activity_name TEXT,
  observations TEXT,
  scores JSONB DEFAULT '{}',
  criteria JSONB DEFAULT '[]',
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS schedule (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas faltantes si la tabla ya existe (migración)
DO $$BEGIN
  ALTER TABLE schedule ADD COLUMN IF NOT EXISTS user_id TEXT;
  ALTER TABLE schedule ADD COLUMN IF NOT EXISTS day TEXT;
  ALTER TABLE schedule ADD COLUMN IF NOT EXISTS time TEXT;
  ALTER TABLE schedule ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Tabla de evaluaciones diagnósticas
CREATE TABLE IF NOT EXISTS diagnostic_evaluations (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  period TEXT NOT NULL,
  proficiency_level TEXT,
  student_results JSONB DEFAULT '[]',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de períodos
CREATE TABLE IF NOT EXISTS period_dates (
  id TEXT PRIMARY KEY,
  start_date TEXT,
  end_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_dates ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso total (en desarrollo)
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for grades" ON grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for instruments" ON instruments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for instrument_evaluations" ON instrument_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for schedule" ON schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for diagnostic_evaluations" ON diagnostic_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for period_dates" ON period_dates FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- MIGRACIONES ADICIONALES (ejecutar si ya existen las tablas)
-- ══════════════════════════════════════════════════════════════

-- Agregar columna color a classes si no existe
DO $$BEGIN
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Agregar columna student_name a instrument_evaluations si no existe
DO $$BEGIN
  ALTER TABLE instrument_evaluations ADD COLUMN IF NOT EXISTS student_name TEXT;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Agregar columna criteria a instrument_evaluations si no existe
DO $$BEGIN
  ALTER TABLE instrument_evaluations ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '[]';
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
