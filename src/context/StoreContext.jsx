import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const normalizeDocSections = (doc) => ({
  ...doc,
  sections: typeof doc.sections === 'string' ? JSON.parse(doc.sections) : (doc.sections || [])
});

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
  const realtimeChannelsRef = useRef([]);
  const broadcastChannelRef = useRef(null);

  const [users, setUsers] = useState(() => loadData('edu_users', []));
  const [currentUser, setCurrentUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState(() => loadData('edu_login_history', []));
  const [students, setStudents] = useState(() => loadData('edu_students', []));
  const [attendance, setAttendance] = useState(() =>
    loadData('edu_attendance', []).map(r => r.id ? r : { ...r, id: generateId() })
  );
  const [grades, setGrades] = useState(() => loadData('edu_grades', []));

  useEffect(() => {
    const savedUser = sessionStorage.getItem('edu_current_user_session') || localStorage.getItem('edu_current_user_session');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        sessionStorage.setItem('edu_current_user_session', JSON.stringify(user));
      } catch {
        sessionStorage.removeItem('edu_current_user_session');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    console.log('DEBUG useEffect: isOnline:', isOnline);
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
            { data: diagnosticData },
            { data: usersData },
            { data: planningDocsData },
            { data: learningSessionsData },
            { data: periodDatesData },
            { data: loginHistoryData },
            { data: eventsData },
            { data: behaviorData }
          ] = await Promise.all([
            supabase.from('students').select('*'),
            supabase.from('classes').select('*'),
            supabase.from('subjects').select('*'),
            supabase.from('grades').select('*'),
            supabase.from('attendance').select('*'),
            supabase.from('instruments').select('*'),
            supabase.from('instrument_evaluations').select('*'),
            supabase.from('schedule').select('*'),
            supabase.from('diagnostic_evaluations').select('*'),
            supabase.from('users').select('*'),
            supabase.from('planning_documents').select('*'),
            supabase.from('learning_sessions').select('*'),
            supabase.from('period_dates').select('*'),
            supabase.from('login_history').select('*').order('login_at', { ascending: false }),
            supabase.from('events').select('*'),
            supabase.from('behavior').select('*')
          ]);
          
      if (studentsData?.length > 0) {
        const normalizedStudents = studentsData.map(s => ({
          ...s,
          name: s.name,
          dni: s.dni,
          gradeLevel: s.grade_level || s.gradeLevel || s.grade || s.class_id,
          classId: s.class_id || s.classId,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate,
          address: s.address,
          phone: s.phone,
          photo_url: s.photo_url || s.photoUrl
        }));
        setStudents(normalizedStudents);
      }
      if (classesData?.length > 0) {
            console.log('Classes loaded:', classesData.length, classesData.map(c => c.id));
            setClasses(classesData);
          }
          if (usersData?.length > 0) setUsers(usersData);
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
            activityName: ev.activity_name || '',
            userId: ev.user_id,
            scores: typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores,
            criteria: typeof ev.criteria === 'string' ? JSON.parse(ev.criteria) : ev.criteria,
            instrumentType: ev.instrument_type
          })));
if (scheduleData?.length > 0) {
          const classMap = {};
          classesData?.forEach(c => { classMap[c.id] = c.color; });
          setSchedule(scheduleData.map(s => {
            let color = s.color || classMap[s.class_id] || '#10b981';
            if (s.class_id === '__ATENCION__') color = '#6366f1';
            if (s.class_id === '__TRABAJO__') color = '#8b5cf6';
            return {
              ...s,
              userId: s.user_id,
              classId: s.class_id,
              subjectId: s.subject_id,
              color
            };
          }));
          const schedulesNeedingColorUpdate = scheduleData.filter(s => !s.color && classMap[s.class_id]);
          if (isOnline && schedulesNeedingColorUpdate.length > 0) {
            try {
              await Promise.all(schedulesNeedingColorUpdate.map(s => 
                supabase.from('schedule').update({ color: classMap[s.class_id] }).eq('id', s.id)
              ));
            } catch (err) {
              console.error('Error updating schedule colors:', err);
            }
          }
        }
if (diagnosticData?.length > 0) setDiagnosticEvaluations(diagnosticData);
      if (planningDocsData?.length > 0) setPlanningDocuments(planningDocsData.map(d => normalizeDocSections({
        ...d,
        fileData: d.file_data || d.fileData,
        uploadedBy: d.uploaded_by,
        uploadedById: d.uploaded_by_id
      })));
      if (learningSessionsData?.length > 0) setLearningSessions(learningSessionsData.map(s => normalizeDocSections({
        ...s,
        uploadedBy: s.uploaded_by,
        uploadedById: s.uploaded_by_id
      })));
      if (periodDatesData?.length > 0) {
        const periodDatesMap = {};
        periodDatesData.forEach(p => {
          periodDatesMap[p.id] = {
            start: p.start_date,
            end: p.end_date
          };
        });
        setPeriodDates(periodDatesMap);
      }
      if (eventsData?.length > 0) setEvents(eventsData);
      else if (events.length > 0) await syncToSupabase('events', events, true);
      
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
    if (!isOnline || !supabase || typeof supabase.channel !== 'function') return;

    const handleUpsert = (setter, normalize) => (payload) => {
      if (payload.eventType === 'DELETE') {
        setter(prev => prev.filter(item => item.id !== payload.old.id));
      } else if (payload.new) {
        const normalized = normalize ? normalize(payload.new) : payload.new;
        setter(prev => {
          const exists = prev.find(item => item.id === normalized.id);
          if (exists) {
            return prev.map(item => item.id === normalized.id ? { ...item, ...normalized, _syncedAt: Date.now() } : item);
          }
          return [...prev, { ...normalized, _syncedAt: Date.now() }];
        });
      }
    };

    const channel = supabase.channel('db-changes');

    // -- Simple tables (passthrough) --
    const simple = [
      ['users', setUsers],
      ['classes', setClasses],
      ['attendance', setAttendance],
      ['diagnostic_evaluations', setDiagnosticEvaluations],
      ['behavior', setBehavior],
    ];
    simple.forEach(([table, setter]) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handleUpsert(setter));
    });

    // -- events --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleUpsert(setEvents));

    // -- instruments --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'instruments' }, handleUpsert(setInstruments, (d) => {
      try {
        return {
          ...d,
          instrumentId: d.instrument_id,
          subjectId: d.subject_id,
          classId: d.class_id,
          criteria: typeof d.criteria === 'string' ? JSON.parse(d.criteria) : (d.criteria || []),
        };
      } catch (err) {
        console.error('Error normalizing instrument from Realtime:', err, d);
        return d;
      }
    }));

    // -- students --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, handleUpsert(setStudents, (d) => ({
      ...d,
      gradeLevel: d.grade_level || d.gradeLevel || d.grade || d.class_id,
      classId: d.class_id || d.classId,
      guardianName: d.guardian_name || d.guardianName,
      guardianDni: d.guardian_dni || d.guardianDni,
      guardianPhone: d.guardian_phone || d.guardianPhone,
      birthDate: d.birth_date || d.birthDate,
      photo_url: d.photo_url || d.photoUrl,
    })));

    // -- subjects --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, handleUpsert(setSubjects, (d) => ({
      ...d,
      competencies: typeof d.competencies === 'string' ? JSON.parse(d.competencies) : (d.competencies || []),
    })));

    // -- grades --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, handleUpsert(setGrades, (d) => ({
      ...d,
      studentId: d.student_id,
      competencyId: d.competency_id,
    })));

    // -- instrument_evaluations --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'instrument_evaluations' }, handleUpsert(setInstrumentEvaluations, (d) => ({
      ...d,
      instrumentId: d.instrument_id,
      studentId: d.student_id,
      studentName: d.student_name,
      competencyId: d.competency_id,
      subjectId: d.subject_id,
      subjectName: d.subject_name,
      classId: d.class_id,
      maxPossible: d.max_possible,
      activityName: d.activity_name || '',
      userId: d.user_id,
      scores: typeof d.scores === 'string' ? JSON.parse(d.scores) : (d.scores || {}),
      criteria: typeof d.criteria === 'string' ? JSON.parse(d.criteria) : (d.criteria || []),
      instrumentType: d.instrument_type,
      createdAt: d.created_at,
    })));

    // -- schedule --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, handleUpsert(setSchedule, (d) => ({
      ...d,
      userId: d.user_id,
      classId: d.class_id,
      subjectId: d.subject_id,
    })));

    // -- planning_documents --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'planning_documents' }, handleUpsert(setPlanningDocuments, (d) => normalizeDocSections({
      ...d,
      fileData: d.file_data || d.fileData,
      uploadedBy: d.uploaded_by,
      uploadedById: d.uploaded_by_id,
    })));

    // -- learning_sessions --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'learning_sessions' }, handleUpsert(setLearningSessions, (d) => normalizeDocSections({
      ...d,
      uploadedBy: d.uploaded_by,
      uploadedById: d.uploaded_by_id,
    })));

    // -- login_history --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'login_history' }, handleUpsert(setLoginHistory, (d) => ({
      ...d,
      userId: d.user_id,
      userName: d.user_name,
      loginAt: d.login_at,
      logoutAt: d.logout_at,
    })));

    // -- period_dates (stored as object map not array) --
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'period_dates' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        setPeriodDates(prev => {
          const next = { ...prev };
          delete next[payload.old.id];
          return next;
        });
      } else if (payload.new) {
        setPeriodDates(prev => ({
          ...prev,
          [payload.new.id]: { start: payload.new.start_date, end: payload.new.end_date }
        }));
      }
    });

    channel.subscribe((status) => {
      console.log('Realtime db-changes status:', status);
    });
    realtimeChannelsRef.current.push(channel);
    broadcastChannelRef.current = null;
    const bc = supabase.channel('broadcast-sync');
    bc.on('broadcast', { event: 'sync' }, (payload) => {
      const msg = payload?.payload || payload;
      const { table, action, data } = msg;

      const handleUpsert = (setter) => {
        if (action === 'DELETE') {
          setter(prev => prev.filter(i => i.id !== data.id));
        } else if (action === 'INSERT' || action === 'UPDATE') {
          setter(prev => {
            const exists = prev.find(i => i.id === data.id);
            if (exists) return prev.map(i => i.id === data.id ? { ...i, ...data, _syncedAt: Date.now() } : i);
            return [...prev, { ...data, _syncedAt: Date.now() }];
          });
        }
      };

      switch (table) {
        case 'users': handleUpsert(setUsers); break;
        case 'students': handleUpsert(setStudents); break;
        case 'subjects': handleUpsert(setSubjects); break;
        case 'classes': handleUpsert(setClasses); break;
        case 'grades': handleUpsert(setGrades); break;
        case 'attendance': handleUpsert(setAttendance); break;
        case 'instruments': handleUpsert(setInstruments); break;
        case 'instrument_evaluations': handleUpsert(setInstrumentEvaluations); break;
        case 'schedule': handleUpsert(setSchedule); break;
        case 'diagnostic_evaluations': handleUpsert(setDiagnosticEvaluations); break;
        case 'planning_documents': handleUpsert(setPlanningDocuments); break;
        case 'learning_sessions': handleUpsert(setLearningSessions); break;
        case 'login_history': handleUpsert(setLoginHistory); break;
        case 'behavior': handleUpsert(setBehavior); break;
        case 'period_dates':
          if (action === 'DELETE') {
            setPeriodDates(prev => { const n = { ...prev }; delete n[data.id]; return n; });
          } else if (data._batch) {
            // Batch seed for events uses events table
          } else {
            setPeriodDates(prev => ({ ...prev, [data.id]: { start: data.start, end: data.end } }));
          }
          break;
        case 'events':
          if (action === 'DELETE') {
            setEvents(prev => prev.filter(i => i.id !== data.id));
          } else if (data._batch) {
            setEvents(prev => {
              const existingTitles = new Set(prev.map(e => e.title));
              const filtered = data._batch.filter(ev => !existingTitles.has(ev.title));
              return [...prev, ...filtered];
            });
          } else {
            handleUpsert(setEvents);
          }
          break;
        case 'notifications': handleUpsert(setNotifications); break;
      }
    });
    bc.subscribe((status) => {
      console.log('Broadcast channel status:', status);
      if (status === 'SUBSCRIBED') broadcastChannelRef.current = bc;
    });
    realtimeChannelsRef.current.push(bc);

    return () => {
      realtimeChannelsRef.current = realtimeChannelsRef.current.filter(ch => ch !== channel && ch !== bc);
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
      try { supabase.removeChannel(bc); } catch (e) { /* ignore */ }
      broadcastChannelRef.current = null;
    };
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
        { data: diagnosticData },
        { data: usersData },
        { data: planningDocsData },
        { data: learningSessionsData },
        { data: periodDatesData },
        { data: loginHistoryData },
        { data: eventsData },
        { data: behaviorData }
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('instruments').select('*'),
        supabase.from('instrument_evaluations').select('*'),
        supabase.from('schedule').select('*'),
        supabase.from('diagnostic_evaluations').select('*'),
        supabase.from('users').select('*'),
        supabase.from('planning_documents').select('*'),
        supabase.from('learning_sessions').select('*'),
        supabase.from('period_dates').select('*'),
        supabase.from('login_history').select('*').order('login_at', { ascending: false }),
        supabase.from('events').select('*'),
        supabase.from('behavior').select('*')
      ]);
      
if (studentsData?.length > 0) {
        const normalizedStudents = studentsData.map(s => ({
          ...s,
          name: s.name,
          dni: s.dni,
          gradeLevel: s.grade_level || s.gradeLevel || s.grade || s.class_id,
          classId: s.class_id || s.classId,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate,
          address: s.address,
          phone: s.phone,
          photo_url: s.photo_url || s.photoUrl
        }));
        setStudents(normalizedStudents);
      }
      if (classesData?.length > 0) {
        console.log('Classes loaded:', classesData.length, classesData.map(c => c.id));
        setClasses(classesData);
      }
      if (usersData?.length > 0) setUsers(usersData);
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
          activityName: ev.activity_name || '',
          userId: ev.user_id,
          scores: typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores,
          criteria: typeof ev.criteria === 'string' ? JSON.parse(ev.criteria) : ev.criteria,
          instrumentType: ev.instrument_type
        })));
      }
      if (scheduleData?.length > 0) {
        const classMap = {};
        classesData?.forEach(c => { classMap[c.id] = c.color; });
        setSchedule(scheduleData.map(s => {
          let color = s.color || classMap[s.class_id] || '#10b981';
          if (s.class_id === '__ATENCION__') color = '#6366f1';
          if (s.class_id === '__TRABAJO__') color = '#8b5cf6';
          return {
            ...s,
            userId: s.user_id,
            classId: s.class_id,
            subjectId: s.subject_id,
            color
          };
        }));
        const schedulesNeedingColorUpdate = scheduleData.filter(s => !s.color && classMap[s.class_id]);
        if (isOnline && schedulesNeedingColorUpdate.length > 0) {
          try {
            await Promise.all(schedulesNeedingColorUpdate.map(s => 
              supabase.from('schedule').update({ color: classMap[s.class_id] }).eq('id', s.id)
            ));
          } catch (err) {
            console.error('Error updating schedule colors:', err);
          }
        }
      }
      if (diagnosticData?.length > 0) setDiagnosticEvaluations(diagnosticData);
      if (planningDocsData?.length > 0) setPlanningDocuments(planningDocsData.map(d => normalizeDocSections({
        ...d,
        fileData: d.file_data || d.fileData,
        uploadedBy: d.uploaded_by,
        uploadedById: d.uploaded_by_id
      })));
      if (learningSessionsData?.length > 0) setLearningSessions(learningSessionsData.map(s => normalizeDocSections({
        ...s,
        uploadedBy: s.uploaded_by,
        uploadedById: s.uploaded_by_id
      })));
      if (periodDatesData?.length > 0) {
        const periodDatesMap = {};
        periodDatesData.forEach(p => {
          periodDatesMap[p.id] = {
            start: p.start_date,
            end: p.end_date
          };
        });
        setPeriodDates(periodDatesMap);
      }
      
      console.log('DEBUG: loginHistoryData raw:', loginHistoryData);
      console.log('DEBUG: loginHistoryData:', loginHistoryData?.length);
      if (loginHistoryData?.length > 0) {
        const remoteHistory = loginHistoryData.map(h => ({
          ...h,
          userId: h.user_id,
          userName: h.user_name,
          loginAt: h.login_at,
          logoutAt: h.logout_at
        }));
        console.log('DEBUG: remoteHistory:', remoteHistory);
        const localIds = new Set(loginHistory.map(l => l.id));
        const merged = [...loginHistory, ...remoteHistory.filter(r => !localIds.has(r.id))];
        merged.sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt));
        setLoginHistory(merged);
      }
      
      if (eventsData?.length > 0) setEvents(eventsData);
      else if (events.length > 0) await syncToSupabase('events', events, true);
      if (behaviorData?.length > 0) setBehavior(behaviorData);
      
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
  const [planningDocuments, setPlanningDocuments] = useState(() =>
    loadData('edu_planning_documents', []).map(normalizeDocSections)
  );
  const [learningSessions, setLearningSessions] = useState(() =>
    loadData('edu_learning_sessions', []).map(normalizeDocSections)
  );
  const [periodDates, setPeriodDates] = useState(() => loadData('edu_period_dates', DEFAULT_PERIOD_DATES));
  const [events, setEvents] = useState(() => loadData('edu_events', []));
  const [notifications, setNotifications] = useState(() => loadData('edu_notifications', []));
  const [behavior, setBehavior] = useState(() => loadData('edu_behavior', []));

  useEffect(() => { localStorage.setItem('edu_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('edu_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('edu_period_dates', JSON.stringify(periodDates)); }, [periodDates]);
  useEffect(() => { try { localStorage.setItem('edu_grades', JSON.stringify(grades)); } catch(e) { console.warn('localStorage edu_grades error:', e.message); } }, [grades]);
  useEffect(() => { try { localStorage.setItem('edu_subjects', JSON.stringify(subjects)); } catch(e) { console.warn('localStorage edu_subjects error:', e.message); } }, [subjects]);
  useEffect(() => { try { localStorage.setItem('edu_classes', JSON.stringify(classes)); } catch(e) { console.warn('localStorage edu_classes error:', e.message); } }, [classes]);
  useEffect(() => { try { localStorage.setItem('edu_users', JSON.stringify(users)); } catch(e) { console.warn('localStorage edu_users error:', e.message); } }, [users]);
  useEffect(() => { try { localStorage.setItem('edu_instruments', JSON.stringify(instruments)); } catch(e) { console.warn('localStorage edu_instruments error:', e.message); } }, [instruments]);
  useEffect(() => { try { localStorage.setItem('edu_instrument_evaluations', JSON.stringify(instrumentEvaluations)); } catch(e) { console.warn('localStorage edu_instrument_evaluations error:', e.message); } }, [instrumentEvaluations]);
  useEffect(() => { try { localStorage.setItem('edu_schedule', JSON.stringify(schedule)); } catch(e) { console.warn('localStorage edu_schedule error:', e.message); } }, [schedule]);
  useEffect(() => { try { localStorage.setItem('edu_diagnostic_evaluations', JSON.stringify(diagnosticEvaluations)); } catch(e) { console.warn('localStorage edu_diagnostic_evaluations error:', e.message); } }, [diagnosticEvaluations]);
  useEffect(() => { try { localStorage.setItem('edu_planning_documents', JSON.stringify(planningDocuments.map(({ fileData, ...rest }) => rest))); } catch(e) { console.warn('localStorage edu_planning_documents error:', e.message); } }, [planningDocuments]);
  useEffect(() => { try { localStorage.setItem('edu_learning_sessions', JSON.stringify(learningSessions.map(({ fileData, ...rest }) => rest))); } catch(e) { console.warn('localStorage edu_learning_sessions error:', e.message); } }, [learningSessions]);
  useEffect(() => { try { localStorage.setItem('edu_login_history', JSON.stringify(loginHistory)); } catch(e) { console.warn('localStorage edu_login_history error:', e.message); } }, [loginHistory]);
  useEffect(() => { try { localStorage.setItem('edu_events', JSON.stringify(events)); } catch(e) { console.warn('localStorage edu_events error:', e.message); } }, [events]);
  useEffect(() => { try { localStorage.setItem('edu_notifications', JSON.stringify(notifications)); } catch(e) { console.warn('localStorage edu_notifications error:', e.message); } }, [notifications]);
  useEffect(() => { try { localStorage.setItem('edu_behavior', JSON.stringify(behavior)); } catch(e) { console.warn('localStorage edu_behavior error:', e.message); } }, [behavior]);

  const toSnakeCase = useCallback((str) => str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`), []);

  const TABLE_COLUMNS = useMemo(() => ({
    users: ['id', 'username', 'password', 'name', 'role', 'created_at', 'updated_at'],
    students: ['id', 'name', 'dni', 'class_id', 'guardian_name', 'guardian_dni', 'guardian_phone', 'birth_date', 'created_at', 'updated_at', 'grade_level', 'photo_url'],
    subjects: ['id', 'name', 'competencies', 'created_at', 'updated_at'],
    classes: ['id', 'name', 'created_at', 'updated_at', 'color'],
    grades: ['id', 'student_id', 'subject', 'competency_id', 'period', 'score', 'conclusion', 'created_at', 'updated_at'],
    attendance: ['id', 'date', 'records', 'created_at'],
    instruments: ['id', 'name', 'type', 'subject_id', 'class_id', 'date', 'max_score', 'description', 'created_at', 'updated_at', 'title', 'criteria'],
    instrument_evaluations: ['id', 'instrument_id', 'student_id', 'score', 'max_possible', 'qualitative', 'competency_id', 'subject_id', 'subject_name', 'period', 'class_id', 'activity_name', 'observations', 'scores', 'date', 'created_at', 'updated_at', 'student_name', 'criteria', 'instrument_type'],
    schedule: ['id', 'class_id', 'subject_id', 'created_at', 'updated_at', 'user_id', 'day', 'time', 'color'],
    diagnostic_evaluations: ['id', 'class_id', 'subject_id', 'period', 'proficiency_level', 'student_results', 'observations', 'created_at', 'updated_at'],
    period_dates: ['id', 'start_date', 'end_date', 'updated_at'],
    planning_documents: ['id', 'title', 'description', 'sections', 'subject_id', 'period', 'grade_level', 'file_data', 'file_name', 'uploaded_by', 'uploaded_at', 'updated_at'],
    learning_sessions: ['id', 'title', 'description', 'sections', 'subject_id', 'period', 'grade_level', 'file_data', 'file_name', 'uploaded_by', 'uploaded_at', 'updated_at'],
    login_history: ['id', 'user_id', 'user_name', 'username', 'login_at', 'logout_at', 'duration', 'updated_at'],
    events: ['id', 'title', 'date', 'type', 'description', 'created_at', 'updated_at', 'createdAt'],
    behavior: ['id', 'student_id', 'student_name', 'class_id', 'type', 'description', 'date', 'user_id', 'user_name', 'created_at'],
  }), []);

  const prepareForSupabase = useCallback((item, table) => {
    const allowed = TABLE_COLUMNS[table];
    if (!allowed) return { ...item };
    const result = {};
    for (const key of Object.keys(item || {})) {
      if (key.startsWith('_')) continue;
      const snakeKey = toSnakeCase(key);
      if (!allowed.includes(snakeKey)) continue;
      const val = item[key];
      if (val === null || val === undefined) continue;
      if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof File)) {
        try { result[snakeKey] = JSON.stringify(val); } catch { result[snakeKey] = val; }
      } else {
        result[snakeKey] = val;
      }
    }
    // Fallbacks for required columns
    if (table === 'instruments' && !result.name && result.title) {
      result.name = result.title;
    }
    return result;
  }, [toSnakeCase, TABLE_COLUMNS]);

  const syncToSupabase = useCallback(async (table, data, skipBroadcast = false) => {
    if (!isOnline) return;
    const prepared = data.map(item => prepareForSupabase(item, table));
    if (prepared.length > 0) {
      console.log(`Syncing ${table}:`, prepared.length, 'rows, sample keys:', Object.keys(prepared[0]));
    }
    const { error } = await supabase.from(table).upsert(prepared, { onConflict: 'id' });
    if (error) {
      console.error(`Supabase error for ${table}:`, JSON.stringify(error));
      throw error;
    }
    if (!skipBroadcast) {
      for (const item of data) {
        sendBroadcast(table, 'INSERT', item);
      }
    }
  }, [isOnline, prepareForSupabase]);

  const deleteFromSupabase = useCallback(async (table, id) => {
    if (!isOnline) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      sendBroadcast(table, 'DELETE', { id });
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
    }
  }, [isOnline]);

  const sendBroadcast = useCallback((table, action, data) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: { table, action, data }
      });
    }
  }, []);

  const login = async (username, password) => {
    let loggedInUser = null;
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
          localStorage.setItem('edu_current_user_session', JSON.stringify(normalizedUser));
          loggedInUser = normalizedUser;
        }
      } catch (err) {
        console.error('Login error:', err);
      }
    }
    
    if (!loggedInUser) {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        setCurrentUser(user);
        sessionStorage.setItem('edu_current_user_session', JSON.stringify(user));
        localStorage.setItem('edu_current_user_session', JSON.stringify(user));
        loggedInUser = user;
      }
    }
    
    if (loggedInUser) {
      const entry = {
        id: generateId(),
        userId: loggedInUser.id,
        userName: loggedInUser.name,
        username: loggedInUser.username,
        loginAt: new Date().toISOString(),
        logoutAt: null,
        duration: null
      };
      const entryForSupabase = {
        ...entry,
        user_id: entry.userId,
        user_name: entry.userName,
        login_at: entry.loginAt,
        logout_at: entry.logoutAt
      };
      delete entryForSupabase.userId;
      delete entryForSupabase.userName;
      delete entryForSupabase.loginAt;
      delete entryForSupabase.logoutAt;
      setLoginHistory(prev => [entry, ...prev]);
      sessionStorage.setItem('edu_current_login_entry', entry.id);
      syncToSupabase('login_history', [entryForSupabase]);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      const logoutAt = new Date().toISOString();
      const entryId = sessionStorage.getItem('edu_current_login_entry');
      if (entryId) {
        setLoginHistory(prev => prev.map(entry => {
          if (entry.id === entryId) {
            const loginTime = new Date(entry.loginAt).getTime();
            const logoutTime = new Date(logoutAt).getTime();
            const durationMs = logoutTime - loginTime;
            const duration = Math.round(durationMs / 60000);
            const updated = { ...entry, logoutAt, duration };
            const updatedForSupabase = {
              ...updated,
              user_id: updated.userId,
              user_name: updated.userName,
              login_at: updated.loginAt,
              logout_at: updated.logoutAt
            };
            delete updatedForSupabase.userId;
            delete updatedForSupabase.userName;
            delete updatedForSupabase.loginAt;
            delete updatedForSupabase.logoutAt;
            if (isOnline) {
              syncToSupabase('login_history', [updatedForSupabase]);
            }
            return updated;
          }
          return entry;
        }));
        sessionStorage.removeItem('edu_current_login_entry');
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('edu_current_user');
    localStorage.removeItem('edu_current_user_v2');
    sessionStorage.removeItem('edu_current_user_session');
    localStorage.removeItem('edu_current_user_session');
  };

  const addStudent = (student) => {
    const newStudent = { ...student, id: generateId(), createdAt: new Date().toISOString() };
    setStudents(prev => [...prev, newStudent]);
    syncToSupabase('students', [newStudent]);
    return newStudent;
  };

  const updateStudent = (id, updates) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    syncToSupabase('students', [{ id, ...updates }]);
  };

  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('students', id);
  };

  const importStudentsBulk = async (data) => {
    const newStudents = data.map(s => ({ ...s, id: generateId(), createdAt: new Date().toISOString() }));
    setStudents(prev => [...prev, ...newStudents]);
    await syncToSupabase('students', newStudents, true);
    return newStudents.length;
  };

  const addSubject = (subject) => {
    const newSubject = { ...subject, id: generateId() };
    setSubjects(prev => [...prev, newSubject]);
    syncToSupabase('subjects', [newSubject]);
  };

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('subjects', id);
  };

  const addCompetency = (subjectId, competency) => {
    const newCompetency = { ...competency, id: generateId() };
    setSubjects(prev => {
      const updated = prev.map(s =>
        s.id === subjectId ? { ...s, competencies: [...(s.competencies || []), newCompetency] } : s
      );
      const subject = updated.find(s => s.id === subjectId);
      if (subject) syncToSupabase('subjects', [subject]);
      return updated;
    });
  };

  const deleteCompetency = (subjectId, competencyId) => {
    setSubjects(prev => {
      const updated = prev.map(s =>
        s.id === subjectId ? { ...s, competencies: s.competencies.filter(c => c.id !== competencyId) } : s
      );
      const subject = updated.find(s => s.id === subjectId);
      if (subject) syncToSupabase('subjects', [subject]);
      return updated;
    });
  };

  const addClass = (cls) => {
    const newClass = { ...cls, id: generateId() };
    setClasses(prev => [...prev, newClass]);
    syncToSupabase('classes', [newClass]);
  };

  const deleteClass = (id) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    deleteFromSupabase('classes', id);
  };

  const updateClassColor = (id, color) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, color } : c));
    if (isOnline) {
      supabase.from('classes').update({ color }).eq('id', id).catch(() => {});
    }
  };

  const reassignClassColors = () => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
    setClasses(prev => {
      const updated = prev.map((c, i) => ({ ...c, color: colors[i % colors.length] }));
      syncToSupabase('classes', updated);
      return updated;
    });
  };

  const updateUser = (id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    syncToSupabase('users', [{ id, ...updates }]);
  };

  const deleteUser = async (id) => {
    if (users.length <= 1) return false;
    
    setUsers(prev => prev.filter(u => u.id !== id));
    setSchedule(prev => prev.filter(s => s.userId !== id));
    setInstrumentEvaluations(prev => prev.filter(e => e.userId !== id));
    setInstruments(prev => prev.filter(i => i.userId !== id));
    setPlanningDocuments(prev => prev.filter(d => d.uploadedById !== id));
    setLearningSessions(prev => prev.filter(l => l.uploadedById !== id));
    
    if (currentUser?.id === id) setCurrentUser(null);
    
    deleteFromSupabase('users', id);
    
    if (isOnline) {
      try {
        await supabase.from('schedule').delete().eq('user_id', id);
        await supabase.from('instruments').delete().eq('user_id', id);
        await supabase.from('instrument_evaluations').delete().eq('user_id', id);
        await supabase.from('planning_documents').delete().eq('uploaded_by_id', id);
        await supabase.from('learning_sessions').delete().eq('uploaded_by_id', id);
      } catch (err) {
        console.error('Error deleting user related data from Supabase:', err);
      }
    }
    
    return true;
  };

  const register = (name, username, password) => {
    if (users.find(u => u.username === username)) return false;
    const newUser = { 
      id: generateId(), 
      name, 
      username, 
      password, 
      role: 'teacher',
      assignments: [],
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    syncToSupabase('users', [newUser]);
    return newUser;
  };

  const saveAttendanceDate = (date, records = {}) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.date === date);
      if (existing) {
        const updated = prev.map(a => a.date === date ? { ...a, records } : a);
        syncToSupabase('attendance', [updated.find(a => a.date === date)]);
        return updated;
      }
      const newRecord = { id: generateId(), date, records };
      syncToSupabase('attendance', [newRecord]);
      return [...prev, newRecord];
    });
  };

  const deleteAttendanceDate = (date) => {
    setAttendance(prev => {
      const record = prev.find(a => a.date === date);
      if (record?.id) deleteFromSupabase('attendance', record.id);
      return prev.filter(a => a.date !== date);
    });
  };

  const saveGrade = (studentId, subject, competencyId, period, score, conclusion) => {
    setGrades(prev => {
      const existing = prev.find(g =>
        g.studentId === studentId && g.subject === subject && g.competencyId === competencyId && g.period === period
      );
      if (existing) {
        const updated = { ...existing, score, conclusion };
        syncToSupabase('grades', [updated]);
        return prev.map(g =>
          (g.studentId === studentId && g.subject === subject && g.competencyId === competencyId && g.period === period)
            ? updated
            : g
        );
      }
      const newGrade = { id: generateId(), studentId, subject, competencyId, period, score, conclusion };
      syncToSupabase('grades', [newGrade]);
      return [...prev, newGrade];
    });
  };

  const calculateQualitativeGrade = (score, max = 20) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'AD';
    if (percentage >= 75) return 'A';
    if (percentage >= 60) return 'B';
    return 'C';
  };

  const addInstrument = async (instrument) => {
    const newInstrument = { ...instrument, id: generateId(), userId: instrument.userId };
    setInstruments(prev => [...prev, newInstrument]);
    try {
      await syncToSupabase('instruments', [newInstrument]);
    } catch (err) {
      console.error('Error syncing instrument to Supabase:', err);
    }
    return newInstrument;
  };

  const updateInstrument = async (id, updates) => {
    setInstruments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try {
      await syncToSupabase('instruments', [{ id, ...updates }]);
    } catch (err) {
      console.error('Error syncing instrument update to Supabase:', err);
    }
  };

  const deleteInstrument = (id) => {
    setInstruments(prev => prev.filter(i => i.id !== id));
    deleteFromSupabase('instruments', id);
  };

  const saveQuickGrade = async ({ studentId, studentName, subjectId, subjectName, competencyId, period, classId, score, activityName, date, note }) => {
    const qualitative = score;
    const newEval = {
      id: generateId(),
      instrumentId: 'quick',
      studentId, studentName, subjectId, subjectName,
      competencyId: competencyId || '__all__',
      period, classId,
      score: null, maxPossible: 20, qualitative,
      activityName, instrumentType: 'quick',
      userId: currentUser?.id,
      date: date || new Date().toISOString().split('T')[0],
      scores: note ? { __note__: note } : {},
      criteria: [],
      createdAt: new Date().toISOString()
    };
    setInstrumentEvaluations(prev => {
      const exists = prev.find(e => e.id === newEval.id);
      if (exists) {
        return prev.map(e => e.id === newEval.id ? { ...e, ...newEval } : e);
      }
      return [...prev, newEval];
    });
    if (isOnline) {
      try {
        await supabase.from('instrument_evaluations').upsert({
          id: newEval.id, instrument_id: 'quick',
          student_id: studentId, student_name: studentName,
          subject_id: subjectId, subject_name: subjectName,
          competency_id: newEval.competencyId,
          period, class_id: classId, score: null, max_possible: 20,
          qualitative, activity_name: activityName,
          instrument_type: 'quick', user_id: currentUser?.id,
          date: newEval.date, scores: newEval.scores, criteria: [],
          created_at: newEval.createdAt
        }, { onConflict: 'id' });
        sendBroadcast('instrument_evaluations', 'INSERT', newEval);
      } catch (err) { console.error('Error syncing quick grade:', err); }
    }
    return newEval;
  };

  const deleteInstrumentEvaluation = (id) => {
    setInstrumentEvaluations(prev => prev.filter(e => e.id !== id));
    deleteFromSupabase('instrument_evaluations', id);
  };

  const saveInstrumentEvaluation = async (evaluation) => {
    const newEvaluation = { ...evaluation, id: evaluation.id || generateId(), createdAt: new Date().toISOString() };
    console.log('Saving evaluation locally:', newEvaluation.id, '| isOnline:', isOnline);
    setInstrumentEvaluations(prev => {
      const exists = prev.find(e => e.id === newEvaluation.id);
      if (exists) {
        return prev.map(e => e.id === newEvaluation.id ? { ...e, ...newEvaluation } : e);
      }
      return [...prev, newEvaluation];
    });
    
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
          user_id: newEvaluation.userId,
          scores: typeof newEvaluation.scores === 'object' ? JSON.stringify(newEvaluation.scores) : newEvaluation.scores,
          criteria: typeof newEvaluation.criteria === 'object' ? JSON.stringify(newEvaluation.criteria) : newEvaluation.criteria,
          date: newEvaluation.date || new Date().toISOString().split('T')[0]
        };
        const { error } = await supabase.from('instrument_evaluations').upsert(supabaseData, { onConflict: 'id' });
        if (error) {
          console.error('Error saving evaluation to Supabase:', error, error.details);
        } else {
          console.log('Evaluation saved to Supabase:', newEvaluation.id);
          sendBroadcast('instrument_evaluations', 'INSERT', newEvaluation);
        }
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    }
  };

  const saveScheduleItem = async (item) => {
    let classColor = '#10b981';
    if (item.classId === '__ATENCION__') {
      classColor = '#6366f1';
    } else if (item.classId === '__TRABAJO__') {
      classColor = '#8b5cf6';
    } else if (item.classId) {
      const targetClass = classes.find(c => c.id === item.classId);
      if (targetClass?.color) {
        classColor = targetClass.color;
      } else {
        try {
          const { data: classData } = await supabase.from('classes').select('color').eq('id', item.classId).single();
          if (classData?.color) classColor = classData.color;
        } catch (e) {}
      }
    }
    const newItem = { ...item, id: item.id || generateId(), color: classColor };
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
      sendBroadcast('schedule', 'INSERT', newItem);
    }
    return newItem;
  };

  const deleteScheduleItem = (id) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('schedule', id);
  };

  const recordParentLogin = (dni) => {
    const parentName = students.find(s => s.guardianDni === dni || s.guardian_dni === dni)?.guardianName || `Padre (DNI: ${dni})`;
    const entry = {
      id: generateId(),
      userId: dni,
      userName: parentName,
      username: dni,
      role: 'parent',
      loginAt: new Date().toISOString(),
      logoutAt: null,
      duration: null
    };
    const entryForSupabase = {
      id: entry.id,
      user_id: entry.userId,
      user_name: entry.userName,
      username: entry.username,
      role: entry.role,
      login_at: entry.loginAt,
      logout_at: entry.logoutAt
    };
    setLoginHistory(prev => [entry, ...prev]);
    syncToSupabase('login_history', [entryForSupabase]);
    sessionStorage.setItem('edu_current_login_entry', entry.id);
  };

  const updatePeriodDates = (periodId, dates) => {
    setPeriodDates(prev => {
      const updated = { ...prev, [periodId]: dates };
      syncToSupabase('period_dates', [{ id: periodId, start_date: dates.start, end_date: dates.end }]);
      return updated;
    });
  };

  const saveDiagnosticEvaluation = (evaluation) => {
    const newEvaluation = { ...evaluation, id: generateId(), createdAt: new Date().toISOString() };
    setDiagnosticEvaluations(prev => [...prev, newEvaluation]);
    syncToSupabase('diagnostic_evaluations', [newEvaluation]);
    return newEvaluation;
  };

  const getDiagnosticEvaluation = (studentId, subjectId) => {
    return diagnosticEvaluations.find(e => e.studentId === studentId && e.subjectId === subjectId);
  };

  const deleteDiagnosticEvaluation = (id) => {
    setDiagnosticEvaluations(prev => prev.filter(e => e.id !== id));
    deleteFromSupabase('diagnostic_evaluations', id);
  };

  const addPlanningDocument = async (doc) => {
    const newDoc = { ...doc, id: generateId(), uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Usuario', uploadedById: currentUser?.id };
    setPlanningDocuments(prev => [...prev, newDoc]);
    
    const adminUsers = users.filter(u => u.role === 'admin' || u.username === 'admin');
    adminUsers.forEach(admin => {
      if (admin.id !== currentUser?.id) {
        addNotification(
          'Nuevo documento de planificación',
          `${currentUser?.name || 'Un docente'} subió: ${newDoc.title}`,
          'planning'
        );
      }
    });

    if (isOnline) {
      try {
        const supabaseDoc = {
          id: newDoc.id,
          title: newDoc.title,
          description: newDoc.description,
          sections: newDoc.sections || [],
          subject_id: newDoc.subjectId,
          period: newDoc.period,
          grade_level: newDoc.gradeLevel,
          file_data: newDoc.fileData,
          file_name: newDoc.fileName,
          uploaded_by: newDoc.uploadedBy,
          uploaded_at: newDoc.uploadedAt
        };
        await syncToSupabase('planning_documents', [supabaseDoc]);
      } catch (err) {
        console.error('Error syncing planning doc to Supabase:', err);
      }
    }
  };

  const deletePlanningDocument = (id) => {
    setPlanningDocuments(prev => prev.filter(d => d.id !== id));
    deleteFromSupabase('planning_documents', id);
  };

  const addLearningSession = async (session) => {
    const newSession = { ...session, id: generateId(), createdAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Admin', uploadedById: currentUser?.id };
    setLearningSessions(prev => [...prev, newSession]);
    
    if (isOnline) {
      try {
        const supabaseSession = {
          id: newSession.id,
          title: newSession.title,
          description: newSession.description,
          sections: newSession.sections || [],
          subject_id: newSession.subjectId,
          period: newSession.period,
          grade_level: newSession.gradeLevel,
          file_data: newSession.fileData,
          file_name: newSession.fileName,
          uploaded_by: newSession.uploadedBy,
          uploaded_at: newSession.uploadedAt
        };
        await syncToSupabase('learning_sessions', [supabaseSession]);
      } catch (err) {
        console.error('Error syncing learning session to Supabase:', err);
      }
    }
  };

  const deleteLearningSession = (id) => {
    setLearningSessions(prev => prev.filter(d => d.id !== id));
    deleteFromSupabase('learning_sessions', id);
  };

  const cleanupOrphanedData = async () => {
    const removed = { schedule: 0, instruments: 0, evaluations: 0, documents: 0, sessions: 0 };
    
    if (!isOnline) {
      alert('Sin conexión a internet');
      return removed;
    }
    
    try {
      const { data: allUsers } = await supabase.from('users').select('id');
      const validUserIds = allUsers?.map(u => u.id) || [];
      
      if (validUserIds.length === 0) {
        alert('No hay usuarios en la base de datos');
        return removed;
      }
      
      const currentSchedules = schedule.filter(s => validUserIds.includes(s.userId));
      const orphanedScheduleIds = schedule.filter(s => !validUserIds.includes(s.userId)).map(s => s.id);
      setSchedule(currentSchedules);
      removed.schedule = orphanedScheduleIds.length;
      
      if (orphanedScheduleIds.length > 0) {
        await Promise.all(
          orphanedScheduleIds.map(id => supabase.from('schedule').delete().eq('id', id))
        );
      }
      
      const validInstruments = instruments.filter(i => {
        const isValid = i.userId ? validUserIds.includes(i.userId) : true;
        if (!isValid) removed.instruments++;
        return isValid;
      });
      setInstruments(validInstruments);
      
      const validEvaluations = instrumentEvaluations.filter(e => {
        const isValid = e.userId ? validUserIds.includes(e.userId) : true;
        if (!isValid) removed.evaluations++;
        return isValid;
      });
      setInstrumentEvaluations(validEvaluations);
      
      const { data: allDocs } = await supabase.from('planning_documents').select('uploaded_by');
      const validDocIds = allDocs?.map(d => d.uploaded_by).filter(Boolean) || [];
      const validDocs = planningDocuments.filter(d => {
        const isValid = d.uploadedById ? validDocIds.includes(d.uploadedById) : true;
        if (!isValid) removed.documents++;
        return isValid;
      });
      setPlanningDocuments(validDocs);
      
      const { data: allSessions } = await supabase.from('learning_sessions').select('uploaded_by');
      const validSessionIds = allSessions?.map(l => l.uploaded_by).filter(Boolean) || [];
      const validSessions = learningSessions.filter(l => {
        const isValid = l.uploadedById ? validSessionIds.includes(l.uploadedById) : true;
        if (!isValid) removed.sessions++;
        return isValid;
      });
      setLearningSessions(validSessions);
      
    } catch (err) {
      console.error('Error in cleanupOrphanedData:', err);
    }
    
    return removed;
  };

  const syncToSupabaseManual = useCallback(async () => {
    if (!isOnline) return;
    const tables = [
      { name: 'users', data: users },
      { name: 'students', data: students },
      { name: 'subjects', data: subjects },
      { name: 'classes', data: classes },
      { name: 'grades', data: grades },
      { name: 'attendance', data: attendance },
      { name: 'instruments', data: instruments },
      { name: 'instrument_evaluations', data: instrumentEvaluations },
      { name: 'schedule', data: schedule },
      { name: 'diagnostic_evaluations', data: diagnosticEvaluations },
      { name: 'period_dates', data: Object.entries(periodDates).map(([id, dates]) => ({ id, start_date: dates.start, end_date: dates.end })) },
      { name: 'planning_documents', data: planningDocuments },
      { name: 'login_history', data: loginHistory },
      { name: 'events', data: events },
      { name: 'behavior', data: behavior },
    ];
    const results = await Promise.allSettled(
      tables.map(t =>
        syncToSupabase(t.name, t.data, true)
          .then(() => ({ table: t.name, status: 'ok' }))
          .catch(err => ({ table: t.name, status: 'error', error: err.message }))
      )
    );
    const errors = results.map(r => r.value).filter(v => v?.status === 'error');
    if (errors.length > 0) {
      errors.forEach(e => console.error(`Error sync ${e.table}:`, e.error));
      const rlsHint = errors.some(e => e.error?.includes?.('row-level security'))
        ? '\n\n(Sugerencia: ve a Supabase Dashboard → Authentication → Policies y deshabilita RLS en las tablas que fallan)'
        : '';
      alert(`Error en:\n${errors.map(e => `- ${e.table}: ${e.error}`).join('\n')}${rlsHint}`);
    } else {
      alert(`✓ Todos los datos sincronizados (${tables.length} tablas)`);
    }
  }, [isOnline, users, students, subjects, classes, grades, attendance, instruments, instrumentEvaluations, schedule, diagnosticEvaluations, periodDates, events, loginHistory, planningDocuments, behavior, syncToSupabase]);

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

  const clearAllInstruments = async () => {
    setInstruments([]);
    setInstrumentEvaluations([]);
    localStorage.removeItem('edu_instruments');
    localStorage.removeItem('edu_instrument_evaluations');
    if (isOnline) {
      const { error: instError } = await supabase.from('instruments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error: evalError } = await supabase.from('instrument_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (instError || evalError) console.error('Error clearing from Supabase:', instError, evalError);
    }
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

  const addEvent = async (event) => {
    const newEvent = { ...event, id: generateId(), created_at: new Date().toISOString() };
    setEvents(prev => [...prev, newEvent]);
    try {
      await syncToSupabase('events', [newEvent]);
    } catch (err) {
      console.error('Error syncing event to Supabase:', err);
    }
    if (currentUser?.role === 'admin' || currentUser?.username === 'admin') {
      const dateStr = new Date(event.date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
      addNotification('Nuevo evento', `${event.title} - ${dateStr}`, 'event_created');
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '📅 Nuevo evento', message: `${event.title} - ${dateStr}`, url: '/calendar' })
      }).catch(() => {});
    }
    return newEvent;
  };

  const updateEvent = async (id, updates) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      await syncToSupabase('events', [{ id, ...updates }]);
    } catch (err) {
      console.error('Error syncing event update to Supabase:', err);
    }
  };

  const deleteEvent = async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    deleteFromSupabase('events', id);
  };

  const seedEvents = async (eventsToSeed) => {
    const newEvents = eventsToSeed.map(ev => ({ ...ev, id: generateId(), created_at: new Date().toISOString() }));
    setEvents(prev => {
      const existingTitles = new Set(prev.map(e => e.title));
      const filtered = newEvents.filter(ev => !existingTitles.has(ev.title));
      return [...prev, ...filtered];
    });
    try {
      await syncToSupabase('events', newEvents, true);
      sendBroadcast('events', 'INSERT', { _batch: newEvents });
    } catch (err) {
      console.error('Error seeding events:', err);
    }
  };

  const markNotificationRead = (notificationId) => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n =>
      n.id === notificationId && !n.readBy.includes(currentUser.id)
        ? { ...n, readBy: [...n.readBy, currentUser.id] }
        : n
    ));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const addBehaviorRecord = (record) => {
    const newRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setBehavior(prev => [...prev, newRecord]);
    syncToSupabase('behavior', [newRecord]);
    return newRecord;
  };

  const deleteBehaviorRecord = (id) => {
    setBehavior(prev => prev.filter(r => r.id !== id));
    deleteFromSupabase('behavior', id);
  };

  const addNotification = (title, message, type = 'chat_message') => {
    const notification = {
      id: generateId(),
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    setNotifications(prev => [notification, ...prev]);
    sendBroadcast('notifications', 'INSERT', notification);
    return notification;
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
      users, currentUser, login, logout, loginHistory,
      students, subjects, attendance, grades, classes,
      instruments, instrumentEvaluations, diagnosticEvaluations,
      addStudent, updateStudent, deleteStudent, importStudentsBulk, clearAllStudents,
      clearAllAttendance, clearAllGrades, clearAllInstruments, clearAllData,
      addSubject, deleteSubject, addCompetency, deleteCompetency,
      addClass, deleteClass, updateClassColor, reassignClassColors, updateUser, deleteUser, cleanupOrphanedData, register,
      saveAttendanceDate, deleteAttendanceDate, saveGrade,
      calculateQualitativeGrade, addInstrument, updateInstrument, deleteInstrument, deleteInstrumentEvaluation, saveInstrumentEvaluation, saveQuickGrade,
      schedule, saveScheduleItem, deleteScheduleItem,
      periodDates, updatePeriodDates,
      saveDiagnosticEvaluation, getDiagnosticEvaluation, deleteDiagnosticEvaluation,
      planningDocuments, addPlanningDocument, deletePlanningDocument,
      learningSessions, addLearningSession, deleteLearningSession,
      events, addEvent, updateEvent, deleteEvent, seedEvents,
      notifications, markNotificationRead, addNotification, deleteNotification,
      behavior, addBehaviorRecord, deleteBehaviorRecord, recordParentLogin,
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