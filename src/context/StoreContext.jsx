import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

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

const DEFAULT_CLASSES = [
  { id: '1', name: '1ro Secundaria - A' },
  { id: '2', name: '1ro Secundaria - B' }
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
    if (!isOnline || !data || data.length === 0) return;
    try {
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) console.error(`Supabase error upserting to ${table}:`, error);
    } catch (err) {
      console.error(`Sync exception for ${table}:`, err);
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

      if (usersData?.length > 0) setUsers(usersData);
      if (studentsData?.length > 0) setStudents(studentsData);
      if (subjectsData?.length > 0) {
        setSubjects(subjectsData.map(s => ({
          ...s,
          competencies: typeof s.competencies === 'string' ? JSON.parse(s.competencies) : (s.competencies || [])
        })));
      }
      if (classesData?.length > 0) setClasses(classesData);
      if (gradesData?.length > 0) {
        setGrades(gradesData.map(g => ({
          ...g, studentId: g.student_id || g.studentId, competencyId: g.competency_id || g.competencyId
        })));
      }
      if (attendanceData?.length > 0) setAttendance(attendanceData);
      if (instrumentsData?.length > 0) setInstruments(instrumentsData);
      if (evalData?.length > 0) {
        setInstrumentEvaluations(evalData.map(e => ({
          ...e, instrumentId: e.instrument_id || e.instrumentId, studentId: e.student_id || e.studentId
        })));
      }
      if (scheduleData?.length > 0) {
        setSchedule(scheduleData.map(s => ({
          ...s, classId: s.class_id || s.classId, subjectId: s.subject_id || s.subjectId
        })));
      }
      if (diagnosticData?.length > 0) {
        setDiagnosticEvaluations(diagnosticData.map(d => ({
          ...d, classId: d.class_id || d.classId, subjectId: d.subject_id || d.subjectId
        })));
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
        syncToSupabase('subjects', subjects.map(s => ({ ...s, competencies: JSON.stringify(s.competencies) }))),
        syncToSupabase('classes', classes),
        syncToSupabase('grades', grades.map((g, i) => ({ ...g, id: g.id || Date.now().toString()+i, student_id: g.studentId, competency_id: g.competencyId }))),
        syncToSupabase('attendance', attendance.map((a, i) => ({ ...a, id: a.id || Date.now().toString()+i, student_id: 'batch' }))),
        syncToSupabase('instruments', instruments.map((ins, i) => ({ ...ins, id: ins.id || Date.now().toString()+i }))),
        syncToSupabase('instrument_evaluations', instrumentEvaluations.map((e, i) => ({ ...e, id: e.id || Date.now().toString()+i, instrument_id: e.instrumentId, student_id: e.studentId }))),
        syncToSupabase('schedule', schedule.map((s, i) => ({ ...s, id: s.id || Date.now().toString()+i, class_id: s.classId, subject_id: s.subjectId }))),
        syncToSupabase('diagnostic_evaluations', diagnosticEvaluations.map((d, i) => ({ ...d, id: d.id || Date.now().toString()+i, class_id: d.classId, subject_id: d.subjectId }))),
        syncToSupabase('period_dates', Object.entries(periodDates).map(([id, dates]) => ({
          id, start_date: dates.start, end_date: dates.end
        })))
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
    const newUser = { id: Date.now().toString(), name, username, password, role, assignments: [] };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    syncToSupabase('users', [newUser]);
    return true;
  };

  const addStudent = (student) => {
    const newStudent = { ...student, id: Date.now().toString() };
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
    const newSubject = { id: Date.now().toString(), name, competencies: [] };
    setSubjects([...subjects, newSubject]);
    syncToSupabase('subjects', [{ ...newSubject, competencies: JSON.stringify(newSubject.competencies) }]);
  };
  const deleteSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
    deleteFromSupabase('subjects', id);
  };
  const addCompetency = (subjectId, competencyName) => {
    const defaultSubj = subjects.find(s => s.id === subjectId);
    if (!defaultSubj) return;
    const newComp = { id: Date.now().toString(), name: competencyName };
    const newSubj = { ...defaultSubj, competencies: [...(defaultSubj.competencies||[]), newComp] };
    setSubjects(subjects.map(s => s.id === subjectId ? newSubj : s));
    syncToSupabase('subjects', [{ ...newSubj, competencies: JSON.stringify(newSubj.competencies) }]);
  };
  const deleteCompetency = (subjectId, competencyId) => {
    const defaultSubj = subjects.find(s => s.id === subjectId);
    if (!defaultSubj) return;
    const newSubj = { ...defaultSubj, competencies: (defaultSubj.competencies||[]).filter(c => c.id !== competencyId) };
    setSubjects(subjects.map(s => s.id === subjectId ? newSubj : s));
    syncToSupabase('subjects', [{ ...newSubj, competencies: JSON.stringify(newSubj.competencies) }]);
  };
  
  const addClass = (name) => {
    const newClass = { id: Date.now().toString(), name };
    setClasses([...classes, newClass]);
    syncToSupabase('classes', [newClass]);
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
        currentClasses.push({ id: Date.now().toString() + '-' + index, name: gradeLevel });
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
        id: Date.now().toString() + '-' + index,
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
    
    if (classUpdateNeeded) {
      setClasses(currentClasses);
      syncToSupabase('classes', currentClasses);
    }
    
    setStudents([...students, ...processedStudents]);
    syncToSupabase('students', processedStudents);
  };

  const saveAttendanceDate = (dateStr, records) => {
    const existingIndex = attendance.findIndex(a => a.date === dateStr);
    let newRecord;
    if (existingIndex >= 0) {
      const newAtt = [...attendance];
      newRecord = { ...newAtt[existingIndex], records };
      if (!newRecord.id) newRecord.id = Date.now().toString();
      newAtt[existingIndex] = newRecord;
      setAttendance(newAtt);
    } else { 
      newRecord = { id: Date.now().toString(), student_id: 'batch', date: dateStr, records };
      setAttendance([...attendance, newRecord]); 
    }
    syncToSupabase('attendance', [{ ...newRecord, student_id: 'batch' }]);
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
      if (!newRecord.id) newRecord.id = Date.now().toString();
      newGrades[existingIndex] = newRecord;
      setGrades(newGrades);
    } else { 
      newRecord = { id: Date.now().toString(), studentId, subject: subjectName, competencyId, period, score, conclusion: conclusion || '' };
      setGrades([...grades, newRecord]); 
    }
    syncToSupabase('grades', [{ 
      ...newRecord, 
      student_id: newRecord.studentId, 
      competency_id: newRecord.competencyId 
    }]);
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
    const newInstrument = instrument.id ? instrument : { ...instrument, id: Date.now().toString() };
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
    const newEval = { ...evaluation, id: Date.now().toString(), date: new Date().toISOString() };
    setInstrumentEvaluations([...instrumentEvaluations, newEval]);
    syncToSupabase('instrument_evaluations', [{ ...newEval, instrument_id: newEval.instrumentId, student_id: newEval.studentId }]);
  };

  const saveScheduleItem = (item) => {
    const newItem = item.id ? item : { ...item, id: Date.now().toString() };
    if (item.id) setSchedule(schedule.map(s => s.id === item.id ? item : s));
    else setSchedule([...schedule, newItem]);
    syncToSupabase('schedule', [{ ...newItem, class_id: newItem.classId, subject_id: newItem.subjectId }]);
  };
  const deleteScheduleItem = (id) => {
    setSchedule(schedule.filter(s => s.id !== id));
    deleteFromSupabase('schedule', id);
  };
  const clearAllStudents = () => {
    setStudents([]);
    // Clearing all locally
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
      newEval = { ...evaluation, id: Date.now().toString(), createdAt: new Date().toISOString() };
      setDiagnosticEvaluations([...diagnosticEvaluations, newEval]); 
    }
    syncToSupabase('diagnostic_evaluations', [{ ...newEval, class_id: newEval.classId, subject_id: newEval.subjectId }]);
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
      addSubject, deleteSubject, addCompetency, deleteCompetency,
      addClass, deleteClass, updateUser, deleteUser,
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
