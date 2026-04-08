import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const DEFAULT_SUBJECTS = [
  { id: 'cneb-mat', name: 'Matemática', competencies: [
    { id: 'mat-c1', name: 'Resuelve problemas de cantidad' },
    { id: 'mat-c2', name: 'Resuelve problemas de regularidad, equivalencia y cambio' },
    { id: 'mat-c3', name: 'Resuelve problemas de forma, movimiento y localización' },
    { id: 'mat-c4', name: 'Resuelve problemas de gestión de datos e incertidumbre' }
  ]},
  { id: 'cneb-com', name: 'Comunicación', competencies: [
    { id: 'com-c1', name: 'Se comunica oralmente en su lengua materna' },
    { id: 'com-c2', name: 'Lee diversos tipos de textos escritos en su lengua materna' },
    { id: 'com-c3', name: 'Escribe diversos tipos de textos en su lengua materna' }
  ]},
  { id: 'cneb-dpcc', name: 'Desarrollo Personal, Ciudadanía y Cívica', competencies: [
    { id: 'dpcc-c1', name: 'Construye su identidad' },
    { id: 'dpcc-c2', name: 'Convive y participa democráticamente en la búsqueda del bien común' }
  ]},
  { id: 'cneb-cs', name: 'Ciencias Sociales', competencies: [
    { id: 'cs-c1', name: 'Construye interpretaciones históricas' },
    { id: 'cs-c2', name: 'Gestiona responsablemente el espacio y el ambiente' },
    { id: 'cs-c3', name: 'Gestiona responsablemente los recursos económicos' }
  ]},
  { id: 'cneb-ct', name: 'Ciencia y Tecnología', competencies: [
    { id: 'ct-c1', name: 'Indaga mediante métodos científicos para construir conocimientos' },
    { id: 'ct-c2', name: 'Explica el mundo físico basándose en conocimientos sobre los seres vivos' },
    { id: 'ct-c3', name: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno' }
  ]},
  { id: 'cneb-ef', name: 'Educación Física', competencies: [
    { id: 'ef-c1', name: 'Se desenvuelve de manera autónoma a través de su motricidad' },
    { id: 'ef-c2', name: 'Asume una vida saludable' },
    { id: 'ef-c3', name: 'Interactúa a través de sus habilidades sociomotrices' }
  ]},
  { id: 'cneb-er', name: 'Educación Religiosa', competencies: [
    { id: 'er-c1', name: 'Construye su identidad como persona humana, amada por Dios' },
    { id: 'er-c2', name: 'Asume la experiencia del encuentro personal y comunitario con Dios' }
  ]},
  { id: 'cneb-ac', name: 'Arte y Cultura', competencies: [
    { id: 'ac-c1', name: 'Aprecia de manera crítica manifestaciones artístico-culturales' },
    { id: 'ac-c2', name: 'Crea proyectos desde los lenguajes artísticos' }
  ]},
  { id: 'cneb-ingles', name: 'Inglés como Lengua Extranjera', competencies: [
    { id: 'ing-c1', name: 'Se comunica oralmente en inglés como lengua extranjera' },
    { id: 'ing-c2', name: 'Lee diversos tipos de textos en inglés como lengua extranjera' },
    { id: 'ing-c3', name: 'Escribe diversos tipos de textos en inglés como lengua extranjera' }
  ]},
  { id: 'cneb-ept', name: 'Educación para el Trabajo', competencies: [
    { id: 'ept-c1', name: 'Gestiona proyectos de emprendimiento económico o social' }
  ]},
  { id: 'cneb-cas', name: 'Castellano como Segunda Lengua', competencies: [
    { id: 'cas-c1', name: 'Se comunica oralmente en castellano como segunda lengua' },
    { id: 'cas-c2', name: 'Lee diversos tipos de textos escritos en castellano como segunda lengua' },
    { id: 'cas-c3', name: 'Escribe diversos tipos de textos en castellano como segunda lengua' }
  ]}
];

const CLASS_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#EAB308',
  '#F97316', '#A855F7', '#EC4899', '#14B8A6',
  '#8B5CF6', '#F43F5E', '#06B6D4', '#84CC16',
  '#D946EF', '#6366F1', '#0EA5E9', '#A3E635',
  '#FB923C', '#E879F9', '#2DD4BF', '#F472B6'
];

const DEFAULT_CLASSES = [
  { id: '1', name: '1ro Secundaria - A', color: '#10b981' },
  { id: '2', name: '1ro Secundaria - B', color: '#3b82f6' }
];

const DEFAULT_PERIOD_DATES = {
  '1': { start: '2026-03-01', end: '2026-05-15' },
  '2': { start: '2026-05-16', end: '2026-07-24' },
  '3': { start: '2026-08-10', end: '2026-10-16' },
  '4': { start: '2026-10-17', end: '2026-12-22' }
};

export const StoreProvider = ({ children }) => {
  const [isOnline] = useState(!!import.meta.env.VITE_SUPABASE_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('checking');

  const [users, setUsers] = useState(() => loadData('edu_users', []));
  const [currentUser, setCurrentUser] = useState(() => loadData('edu_current_user', null));
  const [students, setStudents] = useState(() => loadData('edu_students', []));
  const [attendance, setAttendance] = useState(() => loadData('edu_attendance', []));
  const [grades, setGrades] = useState(() => loadData('edu_grades', []));
  const [subjects, setSubjects] = useState(() => {
    const loaded = loadData('edu_subjects', DEFAULT_SUBJECTS);
    if (loaded.length < 5) return DEFAULT_SUBJECTS;
    return loaded;
  });
  const [classes, setClasses] = useState(() => loadData('edu_classes', DEFAULT_CLASSES));
  const [instruments, setInstruments] = useState(() => loadData('edu_instruments', []));
  const [instrumentEvaluations, setInstrumentEvaluations] = useState(() => loadData('edu_instrument_evaluations', []));
  const [schedule, setSchedule] = useState(() => loadData('edu_schedule', []));
  const [diagnosticEvaluations, setDiagnosticEvaluations] = useState(() => loadData('edu_diagnostic_evaluations', []));
  const [periodDates, setPeriodDates] = useState(() => loadData('edu_period_dates', DEFAULT_PERIOD_DATES));

  const syncToSupabase = useCallback(async (table, data) => {
    console.log(`[Sync] Attempting to sync ${table} with ${Array.isArray(data) ? data.length : 1} records`);
    if (!isOnline || !data) {
      console.warn(`[Sync] Skipping sync - isOnline: ${isOnline}, hasData: ${!!data}`);
      return;
    }
    
    const dataArray = Array.isArray(data) ? data : [data];
    if (dataArray.length === 0) return;
    
    let mappedData;
    try {
      switch (table) {
        case 'students':
          mappedData = dataArray.map(s => ({ 
            id: s.id, 
            name: s.name || '', 
            dni: s.dni || null, 
            class_id: s.gradeLevel || s.class_id || 'Sin asignar', 
            guardian_name: s.guardianName || s.guardian_name || null, 
            guardian_dni: s.guardianDni || s.guardian_dni || null, 
            guardian_phone: s.guardianPhone || s.guardian_phone || null, 
            birth_date: s.birthDate || s.birth_date || null 
          }));
          console.log('[Sync] Mapped students:', mappedData.slice(0, 2));
          break;
          
        case 'attendance':
          mappedData = dataArray.map(a => ({ 
            id: a.id, 
            date: a.date, 
            records: typeof a.records === 'object' ? a.records : (JSON.parse(a.records || '{}'))
          }));
          break;
          
        case 'grades':
          mappedData = dataArray.map(g => ({ 
            id: g.id, 
            student_id: g.studentId || g.student_id || '', 
            subject: g.subject || '', 
            competency_id: g.competencyId || g.competency_id || null, 
            period: g.period || '1', 
            score: g.score ?? null, 
            conclusion: g.conclusion || null 
          }));
          break;
          
        case 'subjects':
          mappedData = dataArray.map(s => ({ 
            id: s.id, 
            name: s.name || '', 
            competencies: s.competencies || [] 
          }));
          break;
          
        case 'classes':
          mappedData = dataArray.map(c => ({ 
            id: c.id, 
            name: c.name || '',
            color: c.color || null 
          }));
          break;
          
        case 'instruments':
          mappedData = dataArray.map(i => ({ 
            id: i.id, 
            name: i.name || '', 
            title: i.title || i.name || '',
            type: i.type || null, 
            subject_id: i.subjectId || i.subject_id || null, 
            class_id: i.classId || i.class_id || null, 
            date: i.date || null, 
            max_score: i.maxScore || i.max_score || null, 
            description: i.description || null,
            criteria: typeof i.criteria === 'string' ? i.criteria : JSON.stringify(i.criteria || [])
          }));
          break;
          
        case 'instrument_evaluations':
          mappedData = dataArray.map(e => ({ 
            id: e.id, 
            instrument_id: e.instrumentId || e.instrument_id || '', 
            student_id: e.studentId || e.student_id || '', 
            student_name: e.studentName || null, 
            score: e.score ?? e.finalScore ?? null, 
            max_possible: e.maxPossible || e.max_possible || null, 
            qualitative: e.qualitative || null, 
            competency_id: e.competencyId || e.competency_id || null, 
            subject_id: e.subjectId || e.subject_id || null, 
            subject_name: e.subjectName || null, 
            period: e.period || null, 
            class_id: e.classId || e.class_id || null, 
            activity_name: e.activityName || null, 
            observations: e.observations || null, 
            scores: typeof e.scores === 'string' ? e.scores : JSON.stringify(e.scores || {}), 
            criteria: typeof e.criteria === 'string' ? e.criteria : JSON.stringify(e.criteria || []), 
            date: e.date || null
          }));
          break;
          
        case 'schedule':
          mappedData = dataArray.map(s => ({ 
            id: s.id,
            user_id: s.userId || '',
            class_id: s.classId || s.class_id || '', 
            subject_id: s.subjectId || s.subject_id || '', 
            day: s.day || '',
            time: s.time || '',
            color: s.color || '#10b981'
          }));
          break;
          
        case 'diagnostic_evaluations':
          mappedData = dataArray.map(d => ({ 
            id: d.id, 
            class_id: d.classId || d.class_id || '', 
            subject_id: d.subjectId || d.subject_id || '', 
            period: d.period || '1', 
            proficiency_level: d.proficiencyLevel || d.proficiency_level || null, 
            student_results: d.studentResults || d.student_results || [], 
            observations: d.observations || null 
          }));
          break;
          
        case 'period_dates':
          mappedData = dataArray.map(p => ({ 
            id: p.id, 
            start_date: p.start_date || p.start || null, 
            end_date: p.end_date || p.end || null 
          }));
          break;
          
        case 'users':
          mappedData = dataArray.map(u => ({ 
            id: u.id, 
            name: u.name || '', 
            username: u.username || '', 
            password: u.password || '', 
            role: u.role || 'user', 
            assignments: u.assignments || [] 
          }));
          break;
          
        default:
          mappedData = dataArray;
      }

      console.log(`[Sync] Upserting to ${table}:`, mappedData.length, 'records');
      const { error } = await supabase.from(table).upsert(mappedData, { onConflict: 'id' });
      if (error) {
        console.error(`[Sync] Supabase ERROR upserting to ${table}:`, error);
        alert(`Error al guardar en Supabase (${table}): ${error.message}`);
      } else {
        console.log(`[Sync] Success syncing ${table}`);
      }
    } catch (err) {
      console.error(`[Sync] Exception for ${table}:`, err);
      alert(`Error de conexión al guardar ${table}`);
    }
  }, [isOnline]);

  const deleteFromSupabase = useCallback(async (table, id) => {
    if (!isOnline || !id) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.error(`Supabase error deleting from ${table}:`, error);
    } catch (err) {
      console.error(`Delete exception for ${table}:`, err);
    }
  }, [isOnline]);

  const fetchFromSupabase = useCallback(async (table) => {
    if (!isOnline) return null;
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn(`Failed to fetch ${table}:`, err);
      return null;
    }
  }, [isOnline]);

  const mergeData = (localData, cloudData, idField = 'id') => {
    if (!cloudData || !localData) return cloudData || localData || [];
    const merged = new Map();
    (cloudData || []).forEach(item => merged.set(item[idField], item));
    (localData || []).forEach(item => {
      if (!merged.has(item[idField])) merged.set(item[idField], item);
    });
    return Array.from(merged.values());
  };

  const initialSync = useCallback(async () => {
    if (!isOnline) {
      setIsLoading(false);
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    try {
      const [
        usersData, studentsData, subjectsData, classesData, gradesData,
        attendanceData, instrumentsData, evalData, scheduleData,
        diagnosticData, periodData
      ] = await Promise.all([
        fetchFromSupabase('users'),
        fetchFromSupabase('students'),
        fetchFromSupabase('subjects'),
        fetchFromSupabase('classes'),
        fetchFromSupabase('grades'),
        fetchFromSupabase('attendance'),
        fetchFromSupabase('instruments'),
        fetchFromSupabase('instrument_evaluations'),
        fetchFromSupabase('schedule'),
        fetchFromSupabase('diagnostic_evaluations'),
        fetchFromSupabase('period_dates')
      ]);

      if (usersData?.length > 0) setUsers(mergeData(loadData('edu_users', []), usersData));
      if (studentsData?.length > 0) {
        const cloudStudents = studentsData.map(s => ({
          ...s,
          gradeLevel: s.class_id || s.grade_level || s.gradeLevel,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate
        }));
        setStudents(mergeData(loadData('edu_students', []), cloudStudents));
      }
      if (subjectsData?.length > 0) {
        const cloudSubjects = subjectsData.map(s => ({
          ...s,
          competencies: typeof s.competencies === 'string' ? JSON.parse(s.competencies) : (s.competencies || [])
        }));
        setSubjects(mergeData(loadData('edu_subjects', DEFAULT_SUBJECTS), cloudSubjects));
      }
      let allClasses = [];
      if (classesData?.length > 0) {
        allClasses = classesData.map((c, i) => ({
          ...c,
          color: CLASS_COLORS[i % CLASS_COLORS.length]
        }));
      } else {
        allClasses = loadData('edu_classes', DEFAULT_CLASSES).map((c, i) => ({
          ...c,
          color: CLASS_COLORS[i % CLASS_COLORS.length]
        }));
      }
      setClasses(allClasses);
      if (gradesData?.length > 0) {
        const cloudGrades = gradesData.map(g => ({
          ...g, studentId: g.student_id || g.studentId, competencyId: g.competency_id || g.competencyId
        }));
        setGrades(mergeData(loadData('edu_grades', []), cloudGrades));
      }
      if (attendanceData?.length > 0) {
        const cloudAttendance = attendanceData.map(a => ({
          ...a,
          records: typeof a.records === 'string' ? JSON.parse(a.records) : (a.records || {})
        }));
        setAttendance(mergeData(loadData('edu_attendance', []), cloudAttendance));
      }
      if (instrumentsData?.length > 0) {
        const cloudInstruments = instrumentsData.map(i => ({
          ...i,
          title: i.title || i.name || '',
          criteria: typeof i.criteria === 'string' ? JSON.parse(i.criteria) : (i.criteria || [])
        }));
        setInstruments(mergeData(loadData('edu_instruments', []), cloudInstruments));
      }
      if (evalData?.length > 0) {
        const cloudEvals = evalData.map(e => {
          console.log('[FETCH] Eval from Supabase:', e);
          let parsedCriteria = [];
          if (e.criteria) {
            if (typeof e.criteria === 'string') {
              try { parsedCriteria = JSON.parse(e.criteria); } catch { parsedCriteria = []; }
            } else if (Array.isArray(e.criteria)) {
              parsedCriteria = e.criteria;
            }
          }
          let parsedScores = {};
          if (e.scores) {
            if (typeof e.scores === 'string') {
              try { parsedScores = JSON.parse(e.scores); } catch { parsedScores = {}; }
            } else if (typeof e.scores === 'object') {
              parsedScores = e.scores;
            }
          }
          return {
            ...e, 
            instrumentId: e.instrument_id || e.instrumentId, 
            studentId: e.student_id || e.studentId,
            studentName: e.student_name || e.studentName,
            instrumentType: e.instrument_type || null,
            activityName: e.activity_name || e.activityName || '',
            subjectId: e.subject_id || e.subjectId || null,
            subjectName: e.subject_name || e.subjectName || '',
            competencyId: e.competency_id || e.competencyId || null,
            competencyName: e.competency_name || e.competencyName || '',
            scores: parsedScores,
            criteria: parsedCriteria,
            instrumentTitle: e.instrument_title || e.instrumentTitle || ''
          };
        });
        console.log('[FETCH] Evaluaciones desde Supabase:', cloudEvals.length);
        setInstrumentEvaluations(mergeData(loadData('edu_instrument_evaluations', []), cloudEvals));
      }
      if (scheduleData?.length > 0) {
        const cloudSchedule = scheduleData.map(s => ({
          ...s, 
          classId: s.class_id || s.classId, 
          subjectId: s.subject_id || s.subjectId,
          userId: s.user_id || s.userId || '',
          day: s.day || '',
          time: s.time || '',
          color: s.color || '#10b981'
        }));
        setSchedule(mergeData(loadData('edu_schedule', []), cloudSchedule));
      }
      if (diagnosticData?.length > 0) {
        const cloudDiags = diagnosticData.map(d => ({
          ...d, classId: d.class_id || d.classId, subjectId: d.subject_id || d.subjectId
        }));
        setDiagnosticEvaluations(mergeData(loadData('edu_diagnostic_evaluations', []), cloudDiags));
      }
      if (periodData?.length > 0) {
        const pDates = { ...DEFAULT_PERIOD_DATES };
        periodData.forEach(p => { pDates[p.id] = { start: p.start_date, end: p.end_date }; });
        setPeriodDates(pDates);
      }
      setSyncStatus('online');
    } catch (err) {
      console.error('Initial sync error:', err);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromSupabase, isOnline]);

  useEffect(() => {
    initialSync();
  }, [initialSync]);

  useEffect(() => { localStorage.setItem('edu_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('edu_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('edu_period_dates', JSON.stringify(periodDates)); }, [periodDates]);
  useEffect(() => { localStorage.setItem('edu_grades', JSON.stringify(grades)); }, [grades]);
  useEffect(() => { localStorage.setItem('edu_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('edu_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('edu_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('edu_instruments', JSON.stringify(instruments)); }, [instruments]);
  useEffect(() => { localStorage.setItem('edu_instrument_evaluations', JSON.stringify(instrumentEvaluations)); }, [instrumentEvaluations]);
  useEffect(() => { localStorage.setItem('edu_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('edu_diagnostic_evaluations', JSON.stringify(diagnosticEvaluations)); }, [diagnosticEvaluations]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('edu_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('edu_current_user');
  }, [currentUser]);

  const syncToSupabaseManual = useCallback(async () => {
    if (!isOnline) return;
    try {
      await Promise.all([
        syncToSupabase('users', users),
        syncToSupabase('students', students),
        syncToSupabase('subjects', subjects),
        syncToSupabase('classes', classes),
        syncToSupabase('grades', grades),
        syncToSupabase('attendance', attendance),
        syncToSupabase('instruments', instruments),
        syncToSupabase('instrument_evaluations', instrumentEvaluations),
        syncToSupabase('schedule', schedule),
        syncToSupabase('diagnostic_evaluations', diagnosticEvaluations),
        syncToSupabase('period_dates', Object.entries(periodDates).map(([id, dates]) => ({ id, start_date: dates.start, end_date: dates.end })))
      ]);
      alert('Datos sincronizados a la nube');
    } catch (err) {
      console.error('Sync error:', err);
      alert('Error al sincronizar');
    }
  }, [isOnline, users, students, subjects, classes, grades, attendance, instruments, instrumentEvaluations, schedule, diagnosticEvaluations, periodDates, syncToSupabase]);

  const autoBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { users, students, attendance, grades, classes, subjects, instruments, instrumentEvaluations, schedule, diagnosticEvaluations }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_sistema_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const register = (name, username, password) => {
    if (users.find(u => u.username === username)) return false;
    const role = users.length === 0 ? 'admin' : 'teacher';
    const newUser = { id: generateId(), name, username, password, role, assignments: [] };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    syncToSupabase('users', [newUser]);
    return true;
  };

  const addStudent = (student) => {
    const newStudent = { ...student, id: generateId() };
    setStudents([...students, newStudent]);
    syncToSupabase('students', [newStudent]);
  };
  const updateStudent = (id, data) => {
    const updated = students.find(s => s.id === id);
    if (!updated) return;
    const newStudent = { ...updated, ...data };
    setStudents(students.map(s => s.id === id ? newStudent : s));
    syncToSupabase('students', [newStudent]);
  };
  const deleteStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    deleteFromSupabase('students', id);
  };
  
  const addSubject = (name) => {
    const newSubject = { id: generateId(), name, competencies: [] };
    setSubjects([...subjects, newSubject]);
    syncToSupabase('subjects', [newSubject]);
  };
  const deleteSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
    deleteFromSupabase('subjects', id);
  };
  const addCompetency = (subjectId, competencyName) => {
    const defaultSubj = subjects.find(s => s.id === subjectId);
    if (!defaultSubj) return;
    const newComp = { id: generateId(), name: competencyName };
    const newSubj = { ...defaultSubj, competencies: [...(defaultSubj.competencies||[]), newComp] };
    setSubjects(subjects.map(s => s.id === subjectId ? newSubj : s));
    syncToSupabase('subjects', [newSubj]);
  };
  const deleteCompetency = (subjectId, competencyId) => {
    const defaultSubj = subjects.find(s => s.id === subjectId);
    if (!defaultSubj) return;
    const newSubj = { ...defaultSubj, competencies: (defaultSubj.competencies||[]).filter(c => c.id !== competencyId) };
    setSubjects(subjects.map(s => s.id === subjectId ? newSubj : s));
    syncToSupabase('subjects', [newSubj]);
  };
  
  const addClass = (name) => {
    const usedColors = new Set(classes.map(c => c.color));
    const availableColor = CLASS_COLORS.find(c => !usedColors.has(c)) || CLASS_COLORS[classes.length % CLASS_COLORS.length];
    const newClass = { id: generateId(), name, color: availableColor };
    setClasses([...classes, newClass]);
    syncToSupabase('classes', [newClass]);
  };

  const updateClassColor = (id, color) => {
    const updated = classes.map(c => c.id === id ? { ...c, color } : c);
    setClasses(updated);
    syncToSupabase('classes', updated);
  };

  const reassignClassColors = () => {
    const updated = classes.map((c, i) => ({ ...c, color: CLASS_COLORS[i % CLASS_COLORS.length] }));
    setClasses(updated);
    syncToSupabase('classes', updated);
  };
  const deleteClass = (id) => {
    setClasses(classes.filter(c => c.id !== id));
    deleteFromSupabase('classes', id);
  };
  const updateUser = (id, data) => {
    const updated = users.find(u => u.id === id);
    if (!updated) return;
    const newUser = { ...updated, ...data };
    setUsers(users.map(u => u.id === id ? newUser : u));
    if (currentUser?.id === id) setCurrentUser(newUser);
    syncToSupabase('users', [newUser]);
  };
  const deleteUser = (id) => {
    if (users.length <= 1) return false;
    setUsers(users.filter(u => u.id !== id));
    if (currentUser?.id === id) setCurrentUser(null);
    deleteFromSupabase('users', id);
    return true;
  };
  const logout = () => setCurrentUser(null);

  const importStudentsBulk = (rawAoaData) => {
    const currentClasses = [...classes];
    let classUpdateNeeded = false;
    let headerRowIndex = -1;
    let maxScore = 0;
    
    // ... [existing detection logic] ...
    const nameKeywords = ['APELLIDOS Y NOMBRES', 'ESTUDIANTE', 'NOMBRE', 'NAME', 'ALUMNO', 'ALUMNO(A)', 'FULL NAME'];
    const sectionKeywords = ['GRADO', 'SECCIÓN', 'SECCION', 'AULA', 'GRADE', 'SECTION'];
    const idKeywords = ['DNI', 'N°', 'NRO', 'NÚMERO', 'ORDEN', 'ID', 'DOCUMENTO'];
    const guardianNameKeywords = ['ASOCIADO', 'APODERADO', 'NOMBRE DEL APODERADO', 'PADRE/MADRE', 'REPRESENTANTE'];
    const guardianDniKeywords = ['DNI APODERADO', 'DNI DEL APODERADO', 'ID APODERADO'];
    const guardianPhoneKeywords = ['TELÉFONO APODERADO', 'TELÉFONO DEL APODERADO', 'CELULAR APODERADO', 'CELULAR DEL APODERADO'];
    const birthDateKeywords = ['FECHA DE NACIMIENTO DEL ESTUDIANTE', 'FECHA DE NACIMIENTO', 'NACIMIENTO', 'BIRTH DATE', 'F. NAC', 'F.NACIMIENTO'];

    for (let i = 0; i < Math.min(rawAoaData.length, 20); i++) {
      const row = rawAoaData[i];
      if (!Array.isArray(row)) continue;
      let currentScore = 0;
      row.forEach(cell => {
        if (!cell || typeof cell !== 'string') return;
        const upperCell = cell.toUpperCase().trim();
        if (nameKeywords.some(k => upperCell === k)) currentScore += 10;
        else if (nameKeywords.some(k => upperCell.includes(k))) currentScore += 2;
        if (idKeywords.some(k => upperCell === k)) currentScore += 5;
        if (sectionKeywords.some(k => upperCell.includes(k))) currentScore += 2;
      });
      if (currentScore > maxScore && currentScore >= 7) { maxScore = currentScore; headerRowIndex = i; }
    }

    if (headerRowIndex === -1) { alert("No se pudo identificar una tabla de estudiantes clara en el Excel."); return; }

    const rawHeaders = rawAoaData[headerRowIndex];
    const headers = [];
    const headerCounts = {};
    
    rawHeaders.forEach(h => {
      let head = String(h || '').toUpperCase().trim();
      if (!head) { headers.push(''); return; }
      if (headerCounts[head]) { headerCounts[head]++; headers.push(`${head}_${headerCounts[head]}`); }
      else { headerCounts[head] = 1; headers.push(head); }
    });

    let defaultGradeLevel = 'Sin Asignar';
    for (let i = 0; i < headerRowIndex; i++) {
      const row = rawAoaData[i];
      const text = row.join(' ').trim();
      if (text.length > 5 && (text.includes('°') || text.includes(' GRADO') || text.includes(' SECU'))) {
        defaultGradeLevel = text.replace(/LISTA DE ESTUDIANTES|TUTOR:.*$/gi, '').trim().split('-')[0].trim();
        break;
      }
    }

    const studentsToProcess = rawAoaData.slice(headerRowIndex + 1);
    const processedStudents = [];

    studentsToProcess.forEach((row, index) => {
      if (!row || row.length < 2) return;
      const data = {};
      headers.forEach((h, hIdx) => { if (h && row[hIdx] !== undefined) data[h] = row[hIdx]; });

      const getVal = (keywords) => {
        const foundKey = Object.keys(data).find(k => keywords.some(kw => k.toUpperCase().includes(kw.toUpperCase().trim()) || kw.toUpperCase().trim().includes(k.toUpperCase())));
        return foundKey ? data[foundKey] : '';
      };

      let name = getVal(nameKeywords).toString().trim();
      let dni = getVal(idKeywords).toString().replace(/\D/g, '').slice(0, 8);
      
      if (!name || name.toUpperCase().includes('TOTAL') || name.length < 3) return;

      let gradeLevel = getVal(sectionKeywords) || defaultGradeLevel;
      if (gradeLevel !== 'Sin Asignar' && !currentClasses.some(c => c.name === gradeLevel)) {
        currentClasses.push({ id: generateId(), name: gradeLevel });
        classUpdateNeeded = true;
      }

      let guardianName = getVal(guardianNameKeywords).toString().trim();
      let guardianDni = getVal(guardianDniKeywords).toString().replace(/\D/g, '').slice(0, 8);
      let guardianPhone = getVal(guardianPhoneKeywords).toString().trim();
      let birthDateRaw = getVal(birthDateKeywords);
      let birthDate = '';

      if (birthDateRaw) {
        if (typeof birthDateRaw === 'number' && birthDateRaw > 10000) {
          const date = new Date(Math.round((birthDateRaw - 25569) * 86400 * 1000));
          birthDate = date.toLocaleDateString('es-ES');
        } else { birthDate = birthDateRaw.toString().trim(); }
      }

      processedStudents.push({
        ...data,
        id: generateId(),
        dni: (data['DNI'] || '').toString().replace(/\D/g, '').slice(0, 8),
        name: name.toString().trim(),
        gradeLevel: gradeLevel.toString().trim(),
        group: (data['GRUPO'] || data['EQUIPO'] || '').toString().trim(),
        address: (data['DIRECCIÓN'] || data['DIRECCION'] || '').toString().trim(),
        phone: (data['CELULAR'] || data['TELÉFONO'] || data['TELEFONO'] || '').toString().trim(),
        birthDate,
        guardianName: guardianName.toString().trim(),
        guardianDni,
        guardianPhone
      });
    });

    if (processedStudents.length === 0) { alert("Se detectaron encabezados pero no se encontraron filas de estudiantes válidas."); return; }
    
    // Filtrar duplicados: evitar estudiantes con mismo DNI o mismo nombre+grado
    const existingStudents = new Set([
      ...students.map(s => s.dni?.toLowerCase()),
      ...students.map(s => `${s.name?.toLowerCase()}_${s.gradeLevel?.toLowerCase()}`)
    ]);
    
    const newStudents = processedStudents.filter(s => {
      const dni = s.dni?.toLowerCase();
      const nameGrade = `${s.name?.toLowerCase()}_${s.gradeLevel?.toLowerCase()}`;
      return !existingStudents.has(dni) && !existingStudents.has(nameGrade);
    });
    
    const skipped = processedStudents.length - newStudents.length;
    if (skipped > 0) {
      console.log(`[Import] Se omitieron ${skipped} estudiantes duplicados`);
    }
    
    if (newStudents.length === 0) {
      alert("Todos los estudiantes del archivo ya existen en el sistema.");
      return;
    }
    
    if (classUpdateNeeded) {
      setClasses(currentClasses);
      syncToSupabase('classes', currentClasses);
    }
    
    setStudents([...students, ...newStudents]);
    syncToSupabase('students', newStudents);
    alert(`Se importaron ${newStudents.length} estudiantes correctamente.`);
  };

  const saveAttendanceDate = (dateStr, records) => {
    const existingIndex = attendance.findIndex(a => a.date === dateStr);
    const recordId = `att_${dateStr}`;
    let newRecord;
    if (existingIndex >= 0) {
      const newAtt = [...attendance];
      newRecord = { ...newAtt[existingIndex], id: recordId, date: dateStr, records };
      newAtt[existingIndex] = newRecord;
      setAttendance(newAtt);
    } else { 
      newRecord = { id: recordId, date: dateStr, records };
      setAttendance(prev => [...prev.filter(a => a.date !== dateStr), newRecord]); 
    }
    syncToSupabase('attendance', [newRecord]);
  };

  const saveGrade = (studentId, subjectName, competencyId, period, score, conclusion = null) => {
    const existingIndex = grades.findIndex(g => g.studentId === studentId && g.subject === subjectName && g.competencyId === competencyId && g.period === period);
    let newRecord;
    if (existingIndex >= 0) {
      const newGrades = [...grades];
      newRecord = { 
        ...newGrades[existingIndex], 
        score, 
        conclusion: conclusion !== null ? conclusion : (newGrades[existingIndex].conclusion || '') 
      };
      if (!newRecord.id) newRecord.id = generateId();
      newGrades[existingIndex] = newRecord;
      setGrades(newGrades);
    } else { 
      newRecord = { id: generateId(), studentId, subject: subjectName, competencyId, period, score, conclusion: conclusion || '' };
      setGrades([...grades, newRecord]); 
    }
    syncToSupabase('grades', [newRecord]);
  };

  const updatePeriodDates = (id, dates) => {
    setPeriodDates(prev => ({ ...prev, [id]: dates }));
    syncToSupabase('period_dates', [{ id, start_date: dates.start, end_date: dates.end }]);
  };
  
  const calculateQualitativeGrade = (score, maxScore) => {
    if (maxScore === 0) return 'C';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'AD';
    if (percentage >= 70) return 'A';
    if (percentage >= 50) return 'B';
    return 'C';
  };

  const addInstrument = (instrument) => {
    const newInstrument = instrument.id ? instrument : { ...instrument, id: generateId() };
    setInstruments([...instruments, newInstrument]);
    syncToSupabase('instruments', [newInstrument]);
  };
  const updateInstrument = (id, updates) => {
    const updated = instruments.find(i => i.id === id);
    if (!updated) return;
    const newInstrument = { ...updated, ...updates };
    setInstruments(instruments.map(i => i.id === id ? newInstrument : i));
    syncToSupabase('instruments', [newInstrument]);
  };
  const deleteInstrument = (id) => {
    setInstruments(instruments.filter(i => i.id !== id));
    deleteFromSupabase('instruments', id);
  };
  const deleteInstrumentEvaluation = (id) => {
    setInstrumentEvaluations(instrumentEvaluations.filter(e => e.id !== id));
    deleteFromSupabase('instrument_evaluations', id);
  };
  const saveInstrumentEvaluation = (evaluation) => {
    const newEval = { ...evaluation, id: generateId(), date: new Date().toISOString() };
    console.log('[SAVE] Nueva evaluación:', newEval);
    console.log('[SAVE] studentName:', newEval.studentName);
    console.log('[SAVE] criteria:', newEval.criteria);
    setInstrumentEvaluations([...instrumentEvaluations, newEval]);
    syncToSupabase('instrument_evaluations', [newEval]);
  };

  const saveScheduleItem = (item) => {
    const classColor = classes.find(c => c.id === item.classId)?.color || '#10b981';
    const itemWithColor = { ...item, color: classColor };
    const newItem = item.id ? itemWithColor : { ...itemWithColor, id: generateId() };
    if (item.id) setSchedule(schedule.map(s => s.id === item.id ? newItem : s));
    else setSchedule([...schedule, newItem]);
    syncToSupabase('schedule', [newItem]);
  };
  const deleteScheduleItem = (id) => {
    setSchedule(schedule.filter(s => s.id !== id));
    deleteFromSupabase('schedule', id);
  };
  const clearAllStudents = async () => {
    setStudents([]);
    if (isOnline) {
      const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.error('Error clearing students from Supabase:', error);
    }
  };

  const clearAllAttendance = async () => {
    setAttendance([]);
    if (isOnline) {
      const { error } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.error('Error clearing attendance from Supabase:', error);
    }
  };

  const clearAllGrades = async () => {
    setGrades([]);
    if (isOnline) {
      const { error } = await supabase.from('grades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.error('Error clearing grades from Supabase:', error);
    }
  };

  const clearAllInstruments = async () => {
    setInstruments([]);
    setInstrumentEvaluations([]);
    if (isOnline) {
      await Promise.all([
        supabase.from('instruments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('instrument_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);
    }
  };

  const clearAllData = async () => {
    if (isOnline) {
      await Promise.all([
        supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('grades').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('instruments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('instrument_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('diagnostic_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);
    }
    setStudents([]);
    setAttendance([]);
    setGrades([]);
    setInstruments([]);
    setInstrumentEvaluations([]);
    setDiagnosticEvaluations([]);
  };

  const saveDiagnosticEvaluation = (evaluation) => {
    const existingIndex = diagnosticEvaluations.findIndex(e => e.classId === evaluation.classId && e.subjectId === evaluation.subjectId && e.period === evaluation.period);
    let newEval;
    if (existingIndex >= 0) {
      const newEvals = [...diagnosticEvaluations];
      newEval = { ...evaluation, id: diagnosticEvaluations[existingIndex].id, updatedAt: new Date().toISOString() };
      newEvals[existingIndex] = newEval;
      setDiagnosticEvaluations(newEvals);
    } else { 
      newEval = { ...evaluation, id: generateId(), createdAt: new Date().toISOString() };
      setDiagnosticEvaluations([...diagnosticEvaluations, newEval]); 
    }
    syncToSupabase('diagnostic_evaluations', [newEval]);
  };
  const getDiagnosticEvaluation = (classId, subjectId, period) => diagnosticEvaluations.find(e => e.classId === classId && e.subjectId === subjectId && e.period === period);
  const deleteDiagnosticEvaluation = (id) => {
    setDiagnosticEvaluations(diagnosticEvaluations.filter(e => e.id !== id));
    deleteFromSupabase('diagnostic_evaluations', id);
  };

  return (
    <StoreContext.Provider value={{
      isOnline, isLoading, syncStatus,
      users, currentUser, login, register, logout,
      students, subjects, attendance, grades, classes,
      instruments, instrumentEvaluations, diagnosticEvaluations,
      addStudent, updateStudent, deleteStudent, importStudentsBulk, clearAllStudents,
      clearAllAttendance, clearAllGrades, clearAllInstruments, clearAllData,
      addSubject, deleteSubject, addCompetency, deleteCompetency,
      addClass, deleteClass, updateClassColor, reassignClassColors, updateUser, deleteUser,
      saveAttendanceDate, saveGrade,
      calculateQualitativeGrade, addInstrument, updateInstrument, deleteInstrument, deleteInstrumentEvaluation, saveInstrumentEvaluation,
      schedule, saveScheduleItem, deleteScheduleItem,
      periodDates, updatePeriodDates,
      saveDiagnosticEvaluation, getDiagnosticEvaluation, deleteDiagnosticEvaluation,
      setUsers, setStudents, setAttendance, setGrades, setClasses, setSubjects,
      setInstruments, setInstrumentEvaluations, setSchedule, setDiagnosticEvaluations, setCurrentUser,
      autoBackup, syncToSupabaseManual, fetchFromSupabase,
      isAdmin: currentUser?.role === 'admin' || currentUser?.username === 'admin'
    }}>
      {children}
    </StoreContext.Provider>
  );
};
