import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    { id: 'c1', name: 'Resolución de problemas' },
    { id: 'c2', name: 'Razonamiento lógico' }
  ]},
  { id: 'cneb-com', name: 'Comunicación', competencies: [
    { id: 'c1', name: 'Comprensión lectora' },
    { id: 'c2', name: 'Expresión oral' }
  ]},
  { id: 'cneb-cta', name: 'Ciencia y Tecnología', competencies: [
    { id: 'c1', name: 'Investigación científica' },
    { id: 'c2', name: 'Uso de Tecnología' }
  ]},
  { id: 'cneb-per', name: 'Personal Social', competencies: [
    { id: 'c1', name: 'Identidad personal' },
    { id: 'c2', name: 'Relaciones interpersonales' }
  ]},
  { id: 'cneb-arte', name: 'Arte y Cultura', competencies: [
    { id: 'c1', name: 'Apreciación artística' },
    { id: 'c2', name: 'Expresión creativa' }
  ]}
];

const DEFAULT_CLASSES = [
  { id: '1a', name: '1° GRADO A', color: '#10b981' },
  { id: '1b', name: '1° GRADO B', color: '#3b82f6' },
  { id: '2a', name: '2° GRADO A', color: '#8b5cf6' },
  { id: '2b', name: '2° GRADO B', color: '#f59e0b' },
  { id: '3a', name: '3° GRADO A', color: '#ef4444' },
  { id: '3b', name: '3° GRADO B', color: '#06b6d4' },
  { id: '4a', name: '4° GRADO A', color: '#84cc16' },
  { id: '4b', name: '4° GRADO B', color: '#f97316' },
  { id: '5a', name: '5° GRADO A', color: '#ec4899' }
];

const DEFAULT_PERIOD_DATES = {
  '1': { start: '2026-03-01', end: '2026-05-15' },
  '2': { start: '2026-05-16', end: '2026-07-24' },
  '3': { start: '2026-08-10', end: '2026-10-16' },
  '4': { start: '2026-10-17', end: '2026-12-22' }
};

export const StoreProvider = ({ children }) => {
  const [isOnline] = useState(() => {
    const online = !!import.meta.env.VITE_SUPABASE_URL;
    console.log('isOnline:', online, '| VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    return online;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('checking');

  const [users, setUsers] = useState(() => loadData('edu_users', []));
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState(() => loadData('edu_students', []));
  const [attendance, setAttendance] = useState(() => loadData('edu_attendance', []));
  const [grades, setGrades] = useState(() => loadData('edu_grades', []));

  useEffect(() => {
    const savedUser = sessionStorage.getItem('edu_current_user_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('edu_current_user_session');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOnline) {
      const loadData = async () => {
        setSyncStatus('syncing');
        try {
          const [
            { data: studentsData },
            { data: classesData },
            { data: subjectsData },
            { data: gradesData },
            { data: attendanceData },
            { data: instrumentsData },
            { data: instrumentEvalsData },
            { data: scheduleData },
            { data: diagnosticData }
          ] = await Promise.all([
            supabase.from('students').select('*'),
            supabase.from('classes').select('*'),
            supabase.from('subjects').select('*'),
            supabase.from('grades').select('*'),
            supabase.from('attendance').select('*'),
            supabase.from('instruments').select('*'),
            supabase.from('instrument_evaluations').select('*'),
            supabase.from('schedule').select('*'),
            supabase.from('diagnostic_evaluations').select('*')
          ]);
          
      if (studentsData?.length > 0) {
        const normalizedStudents = studentsData.map(s => ({
          ...s,
          name: s.name,
          dni: s.dni,
          gradeLevel: s.grade_level || s.gradeLevel || s.grade,
          classId: s.class_id || s.classId,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate,
          address: s.address,
          phone: s.phone
        }));
        setStudents(normalizedStudents);
      }
          if (classesData?.length > 0) {
            console.log('Classes loaded:', classesData.length, classesData.map(c => c.id));
            setClasses(classesData);
          }
          if (subjectsData?.length > 0) setSubjects(subjectsData.map(s => ({
            ...s,
            competencies: typeof s.competencies === 'string' ? JSON.parse(s.competencies) : (s.competencies || [])
          })));
          if (gradesData?.length > 0) setGrades(gradesData.map(g => ({
            ...g,
            studentId: g.student_id,
            competencyId: g.competency_id
          })));
          if (attendanceData?.length > 0) setAttendance(attendanceData);
          if (instrumentsData?.length > 0) setInstruments(instrumentsData.map(i => ({
            ...i,
            instrumentId: i.instrument_id,
            subjectId: i.subject_id,
            classId: i.class_id,
            criteria: typeof i.criteria === 'string' ? JSON.parse(i.criteria) : (i.criteria || [])
          })));
          if (instrumentEvalsData?.length > 0) setInstrumentEvaluations(instrumentEvalsData.map(ev => ({
            ...ev,
            instrumentId: ev.instrument_id,
            studentId: ev.student_id,
            competencyId: ev.competency_id,
            subjectId: ev.subject_id,
            classId: ev.class_id,
            maxPossible: ev.max_possible,
            studentName: ev.student_name || 'Estudiante',
            subjectName: ev.subject_name || '',
            competencyName: ev.competency_name || '',
            instrumentTitle: ev.instrument_title || '',
            activityName: ev.activity_name || '',
            scores: typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores,
            criteria: typeof ev.criteria === 'string' ? JSON.parse(ev.criteria) : ev.criteria,
            instrumentType: ev.instrument_type
          })));
          if (scheduleData?.length > 0) setSchedule(scheduleData.map(s => ({
            ...s,
            userId: s.user_id,
            classId: s.class_id,
            subjectId: s.subject_id
          })));
          if (diagnosticData?.length > 0) setDiagnosticEvaluations(diagnosticData);
          
          console.log('Loaded:', studentsData?.length, 'students');
          setSyncStatus('synced');
        } catch (err) {
          console.error('Fetch error:', err);
          setSyncStatus('error');
        }
      };
      loadData();
    }
  }, [isOnline]);

  useEffect(() => {
    console.log('Current user changed:', currentUser?.name, 'assignments:', currentUser?.assignments);
  }, [currentUser]);

  const fetchFromSupabase = async () => {
    if (!isOnline) return;
    setSyncStatus('syncing');
    try {
      const [
        { data: studentsData },
        { data: classesData },
        { data: subjectsData },
        { data: gradesData },
        { data: attendanceData },
        { data: instrumentsData },
        { data: instrumentEvalsData },
        { data: scheduleData },
        { data: diagnosticData }
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('instruments').select('*'),
        supabase.from('instrument_evaluations').select('*'),
        supabase.from('schedule').select('*'),
        supabase.from('diagnostic_evaluations').select('*')
      ]);
      
      if (studentsData?.length > 0) {
        const normalizedStudents = studentsData.map(s => ({
          ...s,
          name: s.name,
          dni: s.dni,
          gradeLevel: s.grade_level || s.gradeLevel || s.grade,
          classId: s.class_id || s.classId,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate,
          address: s.address,
          phone: s.phone
        }));
        setStudents(normalizedStudents);
      }
      if (classesData?.length > 0) {
        console.log('Classes loaded:', classesData.length, classesData.map(c => c.id));
        setClasses(classesData);
      }
      if (subjectsData?.length > 0) setSubjects(subjectsData.map(s => ({
        ...s,
        competencies: typeof s.competencies === 'string' ? JSON.parse(s.competencies) : (s.competencies || [])
      })));
      if (gradesData?.length > 0) setGrades(gradesData.map(g => ({
        ...g,
        studentId: g.student_id,
        competencyId: g.competency_id
      })));
      if (attendanceData?.length > 0) setAttendance(attendanceData);
      if (instrumentsData?.length > 0) setInstruments(instrumentsData.map(i => ({
        ...i,
        instrumentId: i.instrument_id,
        subjectId: i.subject_id,
        classId: i.class_id,
        criteria: typeof i.criteria === 'string' ? JSON.parse(i.criteria) : (i.criteria || [])
      })));
          if (instrumentEvalsData?.length > 0) {
        console.log('Loading', instrumentEvalsData.length, 'instrument evaluations from Supabase');
        setInstrumentEvaluations(instrumentEvalsData.map(ev => ({
          ...ev,
          instrumentId: ev.instrument_id,
          studentId: ev.student_id,
          competencyId: ev.competency_id,
          subjectId: ev.subject_id,
          classId: ev.class_id,
          maxPossible: ev.max_possible,
          studentName: ev.student_name || 'Estudiante',
          subjectName: ev.subject_name || '',
          competencyName: ev.competency_name || '',
          instrumentTitle: ev.instrument_title || '',
          activityName: ev.activity_name || '',
          scores: typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores,
          criteria: typeof ev.criteria === 'string' ? JSON.parse(ev.criteria) : ev.criteria,
          instrumentType: ev.instrument_type
        })));
      }
      if (scheduleData?.length > 0) setSchedule(scheduleData.map(s => ({
        ...s,
        userId: s.user_id,
        classId: s.class_id,
        subjectId: s.subject_id
      })));
      if (diagnosticData?.length > 0) setDiagnosticEvaluations(diagnosticData);
      
      console.log('Loaded:', studentsData?.length, 'students');
      setSyncStatus('synced');
    } catch (err) {
      console.error('Fetch error:', err);
      setSyncStatus('error');
    }
  };

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
  const [planningDocuments, setPlanningDocuments] = useState(() => loadData('edu_planning_documents', []));
  const [learningSessions, setLearningSessions] = useState(() => loadData('edu_learning_sessions', []));
  const [periodDates, setPeriodDates] = useState(() => loadData('edu_period_dates', DEFAULT_PERIOD_DATES));

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
  useEffect(() => { localStorage.setItem('edu_planning_documents', JSON.stringify(planningDocuments)); }, [planningDocuments]);
  useEffect(() => { localStorage.setItem('edu_learning_sessions', JSON.stringify(learningSessions)); }, [learningSessions]);

  const syncToSupabase = useCallback(async (table, data) => {
    if (!isOnline) return;
    try {
      const { error } = await supabase.from(table).upsert(data.map(item => ({
        ...item,
        updated_at: new Date().toISOString()
      })), { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      console.error(`Error syncing ${table}:`, err);
    }
  }, [isOnline]);

  const deleteFromSupabase = useCallback(async (table, id) => {
    if (!isOnline) return;
    try {
      await supabase.from(table).delete().eq('id', id);
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
    }
  }, [isOnline]);

  const login = async (username, password) => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();
        
        if (data) {
          console.log('User logged in:', data.name, 'role:', data.role, 'assignments:', data.assignments);
          const normalizedUser = {
            ...data,
            assignments: Array.isArray(data.assignments) 
              ? data.assignments.map(a => ({
                  ...a,
                  subjectId: a.subject_id || a.subjectId,
                  classId: a.class_id || a.classId
                }))
              : []
          };
          setCurrentUser(normalizedUser);
          sessionStorage.setItem('edu_current_user_session', JSON.stringify(normalizedUser));
          return true;
        }
      } catch (err) {
        console.error('Login error:', err);
      }
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_current_user');
    localStorage.removeItem('edu_current_user_v2');
    sessionStorage.removeItem('edu_current_user_session');
  };

  const addStudent = (student) => {
    const newStudent = { ...student, id: generateId(), createdAt: new Date().toISOString() };
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const updateStudent = (id, updates) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('students', id);
  };

  const importStudentsBulk = (data) => {
    const newStudents = data.map(s => ({ ...s, id: generateId(), createdAt: new Date().toISOString() }));
    setStudents(prev => [...prev, ...newStudents]);
    return newStudents.length;
  };

  const addSubject = (subject) => {
    const newSubject = { ...subject, id: generateId() };
    setSubjects(prev => [...prev, newSubject]);
  };

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addCompetency = (subjectId, competency) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, competencies: [...(s.competencies || []), { ...competency, id: generateId() }] };
      }
      return s;
    }));
  };

  const deleteCompetency = (subjectId, competencyId) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, competencies: s.competencies.filter(c => c.id !== competencyId) };
      }
      return s;
    }));
  };

  const addClass = (cls) => {
    const newClass = { ...cls, id: generateId() };
    setClasses(prev => [...prev, newClass]);
  };

  const deleteClass = (id) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const updateClassColor = (id, color) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, color } : c));
  };

  const reassignClassColors = () => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
    setClasses(prev => prev.map((c, i) => ({ ...c, color: colors[i % colors.length] })));
  };

  const updateUser = (id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (id) => {
    if (users.length <= 1) return false;
    setUsers(prev => prev.filter(u => u.id !== id));
    setSchedule(prev => prev.filter(s => s.userId !== id));
    setInstrumentEvaluations(prev => prev.filter(e => e.userId !== id));
    if (currentUser?.id === id) setCurrentUser(null);
    deleteFromSupabase('users', id);
    syncToSupabase('schedule', schedule.filter(s => s.userId !== id));
    syncToSupabase('instrument_evaluations', instrumentEvaluations.filter(e => e.userId !== id));
    return true;
  };

  const saveAttendanceDate = (date) => {
    setAttendance(prev => {
      if (prev.find(a => a.date === date)) return prev;
      return [...prev, { date, records: [] }];
    });
  };

  const saveGrade = (studentId, subject, competencyId, period, score, conclusion) => {
    setGrades(prev => {
      const existing = prev.find(g =>
        g.studentId === studentId && g.subject === subject && g.competencyId === competencyId && g.period === period
      );
      if (existing) {
        return prev.map(g =>
          (g.studentId === studentId && g.subject === subject && g.competencyId === competencyId && g.period === period)
            ? { ...g, score, conclusion }
            : g
        );
      }
      return [...prev, { id: generateId(), studentId, subject, competencyId, period, score, conclusion }];
    });
  };

  const calculateQualitativeGrade = (score, max = 20) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'AD';
    if (percentage >= 75) return 'A';
    if (percentage >= 60) return 'B';
    return 'C';
  };

  const addInstrument = (instrument) => {
    const newInstrument = { ...instrument, id: generateId() };
    setInstruments(prev => [...prev, newInstrument]);
    return newInstrument;
  };

  const updateInstrument = (id, updates) => {
    setInstruments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteInstrument = (id) => {
    setInstruments(prev => prev.filter(i => i.id !== id));
    deleteFromSupabase('instruments', id);
  };

  const deleteInstrumentEvaluation = (id) => {
    setInstrumentEvaluations(prev => prev.filter(e => e.id !== id));
    deleteFromSupabase('instrument_evaluations', id);
  };

  const saveInstrumentEvaluation = async (evaluation) => {
    const newEvaluation = { ...evaluation, id: evaluation.id || generateId(), createdAt: new Date().toISOString() };
    console.log('Saving evaluation locally:', newEvaluation.id, '| isOnline:', isOnline);
    setInstrumentEvaluations(prev => [...prev, newEvaluation]);
    
    if (isOnline) {
      try {
        const supabaseData = {
          id: newEvaluation.id,
          instrument_id: newEvaluation.instrumentId,
          student_id: newEvaluation.studentId,
          competency_id: newEvaluation.competencyId,
          subject_id: newEvaluation.subjectId,
          class_id: newEvaluation.classId,
          score: newEvaluation.score,
          max_possible: newEvaluation.maxPossible,
          qualitative: newEvaluation.qualitative,
          period: newEvaluation.period,
          activity_name: newEvaluation.activityName,
          instrument_type: newEvaluation.instrumentType,
          scores: typeof newEvaluation.scores === 'object' ? JSON.stringify(newEvaluation.scores) : newEvaluation.scores,
          criteria: typeof newEvaluation.criteria === 'object' ? JSON.stringify(newEvaluation.criteria) : newEvaluation.criteria,
          date: newEvaluation.date || new Date().toISOString().split('T')[0]
        };
        const { error } = await supabase.from('instrument_evaluations').upsert(supabaseData, { onConflict: 'id' });
        if (error) {
          console.error('Error saving evaluation to Supabase:', error);
        } else {
          console.log('Evaluation saved to Supabase:', newEvaluation.id);
        }
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    }
  };

  const saveScheduleItem = async (item) => {
    const newItem = { ...item, id: item.id || generateId() };
    setSchedule(prev => {
      if (prev.find(s => s.id === newItem.id)) {
        return prev.map(s => s.id === newItem.id ? newItem : s);
      }
      return [...prev, newItem];
    });
    if (isOnline) {
      const supabaseItem = {
        id: newItem.id,
        user_id: newItem.userId,
        class_id: newItem.classId,
        subject_id: newItem.subjectId,
        day: newItem.day,
        time: newItem.time,
        color: newItem.color
      };
      await supabase.from('schedule').upsert(supabaseItem, { onConflict: 'id' });
    }
    return newItem;
  };

  const deleteScheduleItem = (id) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('schedule', id);
  };

  const updatePeriodDates = (periodId, dates) => {
    setPeriodDates(prev => ({ ...prev, [periodId]: dates }));
  };

  const saveDiagnosticEvaluation = (evaluation) => {
    const newEvaluation = { ...evaluation, id: generateId(), createdAt: new Date().toISOString() };
    setDiagnosticEvaluations(prev => [...prev, newEvaluation]);
    return newEvaluation;
  };

  const getDiagnosticEvaluation = (studentId, subjectId) => {
    return diagnosticEvaluations.find(e => e.studentId === studentId && e.subjectId === subjectId);
  };

  const deleteDiagnosticEvaluation = (id) => {
    setDiagnosticEvaluations(prev => prev.filter(e => e.id !== id));
    deleteFromSupabase('diagnostic_evaluations', id);
  };

  const addPlanningDocument = (doc) => {
    const newDoc = { ...doc, id: generateId(), uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Admin' };
    setPlanningDocuments(prev => [...prev, { ...newDoc, fileData: null, fileSize: doc.fileData?.length || 0 }]);
  };

  const deletePlanningDocument = (id) => {
    setPlanningDocuments(prev => prev.filter(d => d.id !== id));
    deleteFromSupabase('planning_documents', id);
  };

  const addLearningSession = (session) => {
    const newSession = { ...session, id: generateId(), createdAt: new Date().toISOString() };
    setLearningSessions(prev => [...prev, newSession]);
  };

  const deleteLearningSession = (id) => {
    setLearningSessions(prev => prev.filter(d => d.id !== id));
    deleteFromSupabase('learning_sessions', id);
  };

  const cleanupOrphanedSchedule = () => {
    const validUserIds = users.map(u => u.id);
    const validClassIds = classes.map(c => c.id);
    const validSubjectIds = subjects.map(s => s.id);
    const validSchedule = schedule.filter(s => validUserIds.includes(s.userId) && validClassIds.includes(s.classId) && validSubjectIds.includes(s.subjectId));
    const removed = schedule.length - validSchedule.length;
    setSchedule(validSchedule);
    return removed;
  };

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
        syncToSupabase('period_dates', Object.entries(periodDates).map(([id, dates]) => ({ id, start_date: dates.start, end_date: dates.end }))),
        syncToSupabase('planning_documents', planningDocuments)
      ]);
      alert('Datos sincronizados a la nube');
    } catch (err) {
      console.error('Sync error:', err);
      alert('Error al sincronizar');
    }
  }, [isOnline, users, students, subjects, classes, grades, attendance, instruments, instrumentEvaluations, schedule, diagnosticEvaluations, periodDates, syncToSupabase]);

  const clearAllGrades = () => {
    setGrades([]);
    localStorage.removeItem('edu_grades');
  };

  const clearAllAttendance = () => {
    setAttendance([]);
    localStorage.removeItem('edu_attendance');
  };

  const clearAllStudents = () => {
    setStudents([]);
    setGrades([]);
    setAttendance([]);
    localStorage.removeItem('edu_students');
    localStorage.removeItem('edu_grades');
    localStorage.removeItem('edu_attendance');
  };

  const clearAllInstruments = () => {
    setInstruments([]);
    setInstrumentEvaluations([]);
    localStorage.removeItem('edu_instruments');
    localStorage.removeItem('edu_instrument_evaluations');
  };

  const clearAllData = () => {
    setStudents([]);
    setGrades([]);
    setAttendance([]);
    setClasses(DEFAULT_CLASSES);
    setSubjects(DEFAULT_SUBJECTS);
    setUsers([]);
    setSchedule([]);
    setInstrumentEvaluations([]);
    setInstruments([]);
    setDiagnosticEvaluations([]);
    setPlanningDocuments([]);
    setLearningSessions([]);
    localStorage.clear();
  };

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

  const mergeData = (local, cloud) => {
    const map = new Map();
    local.forEach(item => map.set(item.id, item));
    cloud.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  return (
    <StoreContext.Provider value={{
      isOnline, isLoading, syncStatus,
      users, currentUser, login, logout,
      students, subjects, attendance, grades, classes,
      instruments, instrumentEvaluations, diagnosticEvaluations,
      addStudent, updateStudent, deleteStudent, importStudentsBulk, clearAllStudents,
      clearAllAttendance, clearAllGrades, clearAllInstruments, clearAllData,
      addSubject, deleteSubject, addCompetency, deleteCompetency,
      addClass, deleteClass, updateClassColor, reassignClassColors, updateUser, deleteUser, cleanupOrphanedSchedule,
      saveAttendanceDate, saveGrade,
      calculateQualitativeGrade, addInstrument, updateInstrument, deleteInstrument, deleteInstrumentEvaluation, saveInstrumentEvaluation,
      schedule, saveScheduleItem, deleteScheduleItem,
      periodDates, updatePeriodDates,
      saveDiagnosticEvaluation, getDiagnosticEvaluation, deleteDiagnosticEvaluation,
      planningDocuments, addPlanningDocument, deletePlanningDocument,
      learningSessions, addLearningSession, deleteLearningSession,
      setUsers, setStudents, setAttendance, setGrades, setClasses, setSubjects,
      setInstruments, setInstrumentEvaluations, setSchedule, setDiagnosticEvaluations, setCurrentUser,
      autoBackup, syncToSupabaseManual, fetchFromSupabase,
      isAdmin: currentUser?.role === 'admin' || currentUser?.username === 'admin'
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreProvider;