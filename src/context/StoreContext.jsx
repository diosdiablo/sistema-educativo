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
  const [isOnline, setIsOnline] = useState(!!import.meta.env.VITE_SUPABASE_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('local');

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
    if (!isOnline) return;
    try {
      const { error } = await supabase.from(table).upsert(data);
      if (error) console.warn(`Sync error for ${table}:`, error);
    } catch (err) {
      console.warn(`Failed to sync ${table}:`, err);
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

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      
      if (isOnline) {
        const [usersData, studentsData, subjectsData, classesData, gradesData, attendanceData,
               instrumentsData, evaluationsData, scheduleData, diagnosticData, periodsData] = await Promise.all([
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

        if (usersData && usersData.length > 0) {
          setUsers(usersData.map(u => ({ ...u, assignments: u.assignments || [] })));
          localStorage.setItem('edu_users', JSON.stringify(usersData));
        }
        if (studentsData && studentsData.length > 0) {
          setStudents(studentsData);
          localStorage.setItem('edu_students', JSON.stringify(studentsData));
        }
        if (subjectsData && subjectsData.length > 0) {
          setSubjects(subjectsData.map(s => ({
            ...s,
            competencies: typeof s.competencies === 'string' ? JSON.parse(s.competencies) : (s.competencies || [])
          })));
          localStorage.setItem('edu_subjects', JSON.stringify(subjectsData));
        }
        if (classesData && classesData.length > 0) {
          setClasses(classesData);
          localStorage.setItem('edu_classes', JSON.stringify(classesData));
        }
        if (gradesData && gradesData.length > 0) setGrades(gradesData);
        if (attendanceData && attendanceData.length > 0) setAttendance(attendanceData);
        if (instrumentsData && instrumentsData.length > 0) setInstruments(instrumentsData);
        if (evaluationsData && evaluationsData.length > 0) setInstrumentEvaluations(evaluationsData);
        if (scheduleData && scheduleData.length > 0) setSchedule(scheduleData);
        if (diagnosticData && diagnosticData.length > 0) setDiagnosticEvaluations(diagnosticData);
        if (periodsData && periodsData.length > 0) {
          const periodsObj = {};
          periodsData.forEach(p => { periodsObj[p.id] = { start: p.start_date, end: p.end_date }; });
          setPeriodDates(periodsObj);
        }

        setSyncStatus('online');
      }
      
      setIsLoading(false);
    };

    initData();
  }, [isOnline, fetchFromSupabase]);

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
  useEffect(() => {
    if (currentUser) localStorage.setItem('edu_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('edu_current_user');
  }, [currentUser]);

  useEffect(() => { syncToSupabase('users', users); }, [users, syncToSupabase]);
  useEffect(() => { syncToSupabase('students', students); }, [students, syncToSupabase]);
  useEffect(() => { syncToSupabase('subjects', subjects.map(s => ({ ...s, competencies: JSON.stringify(s.competencies) }))); }, [subjects, syncToSupabase]);
  useEffect(() => { syncToSupabase('classes', classes); }, [classes, syncToSupabase]);
  useEffect(() => { syncToSupabase('grades', grades); }, [grades, syncToSupabase]);
  useEffect(() => { syncToSupabase('attendance', attendance); }, [attendance, syncToSupabase]);
  useEffect(() => { syncToSupabase('instruments', instruments); }, [instruments, syncToSupabase]);
  useEffect(() => { syncToSupabase('instrument_evaluations', instrumentEvaluations); }, [instrumentEvaluations, syncToSupabase]);
  useEffect(() => { syncToSupabase('schedule', schedule); }, [schedule, syncToSupabase]);
  useEffect(() => { syncToSupabase('diagnostic_evaluations', diagnosticEvaluations); }, [diagnosticEvaluations, syncToSupabase]);
  useEffect(() => {
    const periodsData = Object.entries(periodDates).map(([id, dates]) => ({
      id,
      start_date: dates.start,
      end_date: dates.end
    }));
    syncToSupabase('period_dates', periodsData);
  }, [periodDates, syncToSupabase]);

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
    return true;
  };

  const addStudent = (student) => setStudents([...students, { ...student, id: Date.now().toString() }]);
  const updateStudent = (id, data) => setStudents(students.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteStudent = (id) => setStudents(students.filter(s => s.id !== id));
  const addSubject = (name) => setSubjects([...subjects, { id: Date.now().toString(), name, competencies: [] }]);
  const deleteSubject = (id) => setSubjects(subjects.filter(s => s.id !== id));
  const addCompetency = (subjectId, competencyName) => {
    setSubjects(subjects.map(s => s.id === subjectId ? { ...s, competencies: [...(s.competencies||[]), { id: Date.now().toString(), name: competencyName }] } : s));
  };
  const deleteCompetency = (subjectId, competencyId) => {
    setSubjects(subjects.map(s => s.id === subjectId ? { ...s, competencies: (s.competencies||[]).filter(c => c.id !== competencyId) } : s));
  };
  const addClass = (name) => setClasses([...classes, { id: Date.now().toString(), name }]);
  const deleteClass = (id) => setClasses(classes.filter(c => c.id !== id));
  const updateUser = (id, data) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser?.id === id) setCurrentUser({ ...currentUser, ...data });
  };
  const deleteUser = (id) => {
    if (users.length <= 1) return false;
    setUsers(users.filter(u => u.id !== id));
    if (currentUser?.id === id) setCurrentUser(null);
    return true;
  };
  const logout = () => setCurrentUser(null);

  const importStudentsBulk = (rawAoaData) => {
    const currentClasses = [...classes];
    let classUpdateNeeded = false;
    let headerRowIndex = -1;
    let maxScore = 0;
    
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
    if (classUpdateNeeded) setClasses(currentClasses);
    setStudents([...students, ...processedStudents]);
  };

  const saveAttendanceDate = (dateStr, records) => {
    const existing = attendance.findIndex(a => a.date === dateStr);
    if (existing >= 0) {
      const newAtt = [...attendance];
      newAtt[existing].records = records;
      setAttendance(newAtt);
    } else { setAttendance([...attendance, { date: dateStr, records }]); }
  };

  const saveGrade = (studentId, subjectName, competencyId, period, score, conclusion = null) => {
    const existingIndex = grades.findIndex(g => g.studentId === studentId && g.subject === subjectName && g.competencyId === competencyId && g.period === period);
    if (existingIndex >= 0) {
      const newGrades = [...grades];
      const existingGrade = newGrades[existingIndex];
      newGrades[existingIndex] = { ...existingGrade, score, conclusion: conclusion !== null ? conclusion : (existingGrade.conclusion || '') };
      setGrades(newGrades);
    } else { setGrades([...grades, { studentId, subject: subjectName, competencyId, period, score, conclusion: conclusion || '' }]); }
  };

  const updatePeriodDates = (id, dates) => setPeriodDates(prev => ({ ...prev, [id]: dates }));
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
  };
  const updateInstrument = (id, updates) => setInstruments(instruments.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteInstrument = (id) => setInstruments(instruments.filter(i => i.id !== id));
  const deleteInstrumentEvaluation = (id) => setInstrumentEvaluations(instrumentEvaluations.filter(e => e.id !== id));
  const saveInstrumentEvaluation = (evaluation) => setInstrumentEvaluations([...instrumentEvaluations, { ...evaluation, id: Date.now().toString(), date: new Date().toISOString() }]);

  const saveScheduleItem = (item) => {
    if (item.id) setSchedule(schedule.map(s => s.id === item.id ? item : s));
    else setSchedule([...schedule, { ...item, id: Date.now().toString() }]);
  };
  const deleteScheduleItem = (id) => setSchedule(schedule.filter(s => s.id !== id));
  const clearAllStudents = () => setStudents([]);

  const saveDiagnosticEvaluation = (evaluation) => {
    const existingIndex = diagnosticEvaluations.findIndex(e => e.classId === evaluation.classId && e.subjectId === evaluation.subjectId && e.period === evaluation.period);
    if (existingIndex >= 0) {
      const newEvals = [...diagnosticEvaluations];
      newEvals[existingIndex] = { ...evaluation, id: diagnosticEvaluations[existingIndex].id, updatedAt: new Date().toISOString() };
      setDiagnosticEvaluations(newEvals);
    } else { setDiagnosticEvaluations([...diagnosticEvaluations, { ...evaluation, id: Date.now().toString(), createdAt: new Date().toISOString() }]); }
  };
  const getDiagnosticEvaluation = (classId, subjectId, period) => diagnosticEvaluations.find(e => e.classId === classId && e.subjectId === subjectId && e.period === period);
  const deleteDiagnosticEvaluation = (id) => setDiagnosticEvaluations(diagnosticEvaluations.filter(e => e.id !== id));

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
      autoBackup,
      isAdmin: currentUser?.role === 'admin' || currentUser?.username === 'admin'
    }}>
      {children}
    </StoreContext.Provider>
  );
};
