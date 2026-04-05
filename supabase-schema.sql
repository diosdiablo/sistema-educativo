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
  assignments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dni TEXT,
  class_id TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
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
  score NUMERIC,
  observations TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS schedule (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
