import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { 
  ClipboardCheck, Plus, Trash2, Play, 
  CheckSquare, BarChart2, Grid, ChevronLeft, 
  PlusCircle, Save, User, Activity, CheckCircle2,
  Dices, Users, Eye, BookOpen, FileText, MessageSquare, Star,
  X, FileSearch, Edit2, CheckCircle as CheckCircleIcon, UserCheck
} from 'lucide-react';

// ─── Definición de tipos DCNEB ──────────────────────────────────────────────
const INSTRUMENT_TYPES = [
  {
    id: 'checklist',
    label: 'Lista de Cotejo',
    icon: CheckSquare,
    color: '#10b981',
    description: 'Registra si el estudiante logra o no cada indicador (Sí / No)',
    scoring: 'binary'   // logrado / no logrado
  },
  {
    id: 'scale',
    label: 'Escala de Valoración',
    icon: BarChart2,
    color: '#3b82f6',
    description: 'Mide el grado de logro con una escala AD / A / B / C por indicador',
    scoring: 'qualitative'
  },
  {
    id: 'rubric',
    label: 'Rúbrica de Evaluación',
    icon: Grid,
    color: '#8b5cf6',
    description: 'Describe niveles de desempeño detallados por cada criterio',
    scoring: 'qualitative'
  },
  {
    id: 'observation',
    label: 'Ficha de Observación',
    icon: Eye,
    color: '#f59e0b',
    description: 'Registra conductas y actitudes con frecuencias (Siempre / A veces / Nunca)',
    scoring: 'frequency'  // 3 / 2 / 1
  },
  {
    id: 'written',
    label: 'Prueba Escrita',
    icon: FileText,
    color: '#ef4444',
    description: 'Evalúa con puntaje numérico (vigesimal 0–20) convertido a escala cualitativa',
    scoring: 'numeric'    // 0-20 → AD/A/B/C
  },
  {
    id: 'selfeval',
    label: 'Ficha de Autoevaluación',
    icon: Star,
    color: '#ec4899',
    description: 'El propio estudiante reflexiona sobre su aprendizaje usando criterios establecidos',
    scoring: 'qualitative'
  },
  {
    id: 'portfolio',
    label: 'Portafolio',
    icon: BookOpen,
    color: '#14b8a6',
    description: 'Colección de evidencias del proceso de aprendizaje evaluadas holísticamente',
    scoring: 'direct'     // asignación directa AD/A/B/C
  },
  {
    id: 'anecdotal',
    label: 'Registro Anecdótico',
    icon: MessageSquare,
    color: '#6366f1',
    description: 'Registra hechos o situaciones significativas observadas durante el aprendizaje',
    scoring: 'direct'
  },
];

const typeMap = Object.fromEntries(INSTRUMENT_TYPES.map(t => [t.id, t]));

const BadgeTheme = { AD: 'badge-ad', A: 'badge-a', B: 'badge-b', C: 'badge-c' };
const GRADE_LABEL = { AD: 'Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };

// ─── Helpers de puntuación ───────────────────────────────────────────────────
const calcScore = (type, scores, criteria) => {
  const scoring = typeMap[type]?.scoring;
  if (scoring === 'binary') {
    const score = Object.values(scores).filter(v => v === true).length;
    const max = criteria.length;
    return { score, max };
  }
  if (scoring === 'qualitative') {
    const score = Object.values(scores).reduce((a, b) => a + Number(b || 0), 0);
    const max = criteria.length * 4;
    return { score, max };
  }
  if (scoring === 'frequency') {
    const score = Object.values(scores).reduce((a, b) => a + Number(b || 0), 0);
    const max = criteria.length * 3;
    return { score, max };
  }
  if (scoring === 'numeric') {
    // single vigesimal score
    const score = Number(scores['__numeric__'] || 0);
    return { score, max: 20 };
  }
  if (scoring === 'direct') {
    // direct qualitative assignment
    return { score: null, max: null, direct: scores['__direct__'] || null };
  }
  return { score: 0, max: 0 };
};

const numToQualitative = (score, max) => {
  if (max === 0) return 'C';
  const pct = (score / max) * 100;
  if (pct >= 87.5) return 'AD';
  if (pct >= 62.5) return 'A';
  if (pct >= 37.5) return 'B';
  return 'C';
};

// ────────────────────────────────────────────────────────────────────────────

export default function Instruments() {
  const { 
    instruments, instrumentEvaluations, students, classes, subjects = [],
    addInstrument, updateInstrument, deleteInstrument, deleteInstrumentEvaluation, saveInstrumentEvaluation,
    currentUser, isAdmin
  } = useStore();

  const [view, setView] = useState('list'); // 'list' | 'create' | 'apply'
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [applyingInstrument, setApplyingInstrument] = useState(null);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetToList = () => {
    setView('list');
    setEditingInstrument(null);
    setApplyingInstrument(null);
    setTempGroups([]);
  };

  useEffect(() => {
    resetToList();
  }, [refreshKey]);
  
  // ── Create form state ──
  const [instrumentType, setInstrumentType] = useState('checklist');
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState([{ id: '1', text: '' }]);

  // ── Apply state ──
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [activityName, setActivityName] = useState('');
  const [evaluationScores, setEvaluationScores] = useState({});
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [applyMode, setApplyMode] = useState('individual');
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(null);
  const [tempGroups, setTempGroups] = useState([]);
  const [randomStudent, setRandomStudent] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [savedGroupMembers, setSavedGroupMembers] = useState(new Set());
  const [studentNamesFromSupabase, setStudentNamesFromSupabase] = useState({});
  const [studentsByName, setStudentsByName] = useState({});

  // Cargar nombres de estudiantes desde Supabase para evaluaciones sin nombre
  useEffect(() => {
    const loadStudentNames = async () => {
      // Primero buscar por ID
      const evalsWithoutName = instrumentEvaluations.filter(ev => !ev.studentName && !ev.student_name && ev.studentId);
      if (evalsWithoutName.length > 0) {
        const studentIds = [...new Set(evalsWithoutName.map(ev => ev.studentId))];
        const { data } = await supabase.from('students').select('id, name').in('id', studentIds);
        
        if (data) {
          const namesMap = {};
          const byNameMap = {};
          data.forEach(s => { 
            namesMap[s.id] = s.name;
            byNameMap[s.name] = s;
          });
          setStudentNamesFromSupabase(prev => ({ ...prev, ...namesMap }));
          setStudentsByName(prev => ({ ...prev, ...byNameMap }));
        }
      }
      
      // También crear mapa de todos los estudiantes por nombre
      const byNameMap = {};
      students.forEach(s => { byNameMap[s.name] = s; });
      setStudentsByName(prev => ({ ...prev, ...byNameMap }));
    };
    loadStudentNames();
  }, [instrumentEvaluations, students]);

  const availableSubjects = useMemo(() => {
    if (isAdmin || !currentUser?.assignments || currentUser.assignments.length === 0) {
      return subjects;
    }
    const subjectIds = [...new Set(currentUser.assignments.map(a => a.subjectId))];
    return subjects.filter(s => subjectIds.includes(s.id));
  }, [isAdmin, currentUser, subjects]);

  const selectedSubjectObj = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const availableCompetencies = useMemo(() => selectedSubjectObj?.competencies || [], [selectedSubjectObj]);
  useEffect(() => { setSelectedCompetencyId(''); }, [selectedSubjectId]);
  useEffect(() => { setSelectedStudent(''); setSelectedGroupIdx(null); }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanSelected = selectedClass.trim().toLowerCase();
    return students.filter(s => {
      const cleanGrade = (s.gradeLevel || '').trim().toLowerCase();
      const cleanClass = (s.classId || '').trim().toLowerCase();
      return cleanGrade === cleanSelected || cleanClass === cleanSelected;
    });
  }, [students, selectedClass]);
  
  const predefinedGroups = useMemo(() => {
    const map = {};
    filteredStudents.forEach(s => {
      const g = s.group || 'Sin Grupo';
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return Object.entries(map).map(([name, members]) => ({ name, members }));
  }, [filteredStudents]);

  const allAssignedStudentIds = useMemo(() => {
    const ids = new Set();
    tempGroups.forEach(g => g.members.forEach(m => ids.add(m.id)));
    return ids;
  }, [tempGroups]);

  const availableStudentsForGroups = useMemo(() => {
    return filteredStudents.filter(s => !allAssignedStudentIds.has(s.id));
  }, [filteredStudents, allAssignedStudentIds]);

  const pickRandom = () => {
    const availableStudents = filteredStudents.filter(s => !savedGroupMembers.has(s.id));
    if (!availableStudents.length) return;
    setIsPicking(true);
    let count = 0;
    const interval = setInterval(() => {
      const r = availableStudents[Math.floor(Math.random() * availableStudents.length)];
      setRandomStudent(r);
      if (++count > 10) { clearInterval(interval); setIsPicking(false); setSelectedStudent(r.id); }
    }, 100);
  };

  const resetForm = () => { setTitle(''); setInstrumentType('checklist'); setCriteria([{ id: '1', text: '' }]); };

  const handleSaveInstrument = () => {
    if (!title) { alert('Escribe el título del instrumento.'); return; }
    const typeInfo = typeMap[instrumentType];
    // Numeric and direct types don't need criteria with text (just 1 row)
    if (!['numeric', 'direct', 'anecdotal', 'portfolio'].includes(instrumentType) && criteria.some(c => !c.text)) {
      alert('Completa todos los criterios.'); return;
    }
    
    if (editingInstrument) {
      updateInstrument(editingInstrument.id, { title, type: instrumentType, criteria });
    } else {
      addInstrument({ title, type: instrumentType, criteria, userId: currentUser?.id });
    }
    
    setView('list');
    setEditingInstrument(null);
    resetForm();
  };

  const handleCancelApply = () => {
    setView('list');
    setApplyingInstrument(null);
    setTempGroups([]);
  };

  const handleEditInstrument = (ins) => {
    setEditingInstrument(ins);
    setTitle(ins.title || '');
    setInstrumentType(ins.type || 'checklist');
    const normalizedCriteria = ins.criteria && ins.criteria.length > 0 
      ? ins.criteria.map(c => ({
          ...c,
          descriptors: c.descriptors || { AD: '', A: '', B: '', C: '' }
        }))
      : [{ id: '1', text: '', descriptors: { AD: '', A: '', B: '', C: '' } }];
    setCriteria(normalizedCriteria);
    setView('create');
  };

  const handleStartApply = (ins) => {
    setApplyingInstrument(ins);
    setEvaluationScores({});
    setActivityName('');
    setSelectedClass('');
    setSelectedStudent('');
    setSelectedSubjectId('');
    setSelectedCompetencyId('');
    setSelectedPeriod('1');
    setApplyMode('individual');
    setSelectedGroupIdx(null);
    setTempGroups([]);
    setSavedGroupMembers(new Set());
    setView('apply');
  };

  const handleSaveEvaluation = () => {
    if (applyMode === 'individual' && !selectedStudent) { alert('Selecciona un estudiante.'); return; }
    if (applyMode === 'groups' && selectedGroupIdx === null) { alert('Selecciona un grupo.'); return; }
    if (!activityName) { alert('Describe la actividad.'); return; }
    if (!selectedSubjectId || !selectedCompetencyId) {
      alert('Debes seleccionar la Materia y la Competencia que evalúa este instrumento.'); return;
    }

    const { score, max, direct } = calcScore(applyingInstrument.type, evaluationScores, applyingInstrument.criteria);
    const qualitative = direct ?? numToQualitative(score, max);

    const buildEvaluationData = (student) => {
      const evalData = {
        instrumentId: applyingInstrument.id,
        instrumentTitle: applyingInstrument.title || applyingInstrument.name || '',
        instrumentType: applyingInstrument.type,
        criteria: applyingInstrument.criteria || [],
        activityName,
        scores: { ...evaluationScores },
        score,
        maxPossible: max,
        qualitative,
        subjectId: selectedSubjectId,
        subjectName: selectedSubjectObj?.name || '',
        competencyId: selectedCompetencyId,
        competencyName: availableCompetencies.find(c => c.id === selectedCompetencyId)?.name || '',
        period: selectedPeriod,
        classId: classes.find(c => c.name === selectedClass)?.id || '',
        studentId: student.id,
        studentName: student.name,
        userId: currentUser?.id
      };
      console.log('[SAVE] Evaluando:', student.name, '| score:', score, '| qualitative:', qualitative, '| scores:', JSON.stringify(evalData.scores));
      return evalData;
    };

    if (applyMode === 'individual') {
      const s = students.find(s => s.id === selectedStudent);
      saveInstrumentEvaluation(buildEvaluationData(s));
      setSavedGroupMembers(prev => new Set([...prev, selectedStudent]));
    } else if (selectedGroupIdx !== null && tempGroups[selectedGroupIdx]?.members.length > 0) {
      const membersToSave = tempGroups[selectedGroupIdx].members;
      console.log('[SAVE GROUP] Guardando evaluaciones para grupo:', tempGroups[selectedGroupIdx].name, '| miembros:', membersToSave.length);
      console.log('[SAVE GROUP] Members:', JSON.stringify(membersToSave));
      
      membersToSave.forEach((member, idx) => {
        console.log('[SAVE GROUP] Processing member:', idx, member);
        const evalData = buildEvaluationData(member);
        console.log('[SAVE GROUP] EvalData:', JSON.stringify({ studentId: evalData.studentId, studentName: evalData.studentName, score: evalData.score }));
        saveInstrumentEvaluation(evalData);
      });
      const newMemberIds = new Set(membersToSave.map(m => m.id));
      setSavedGroupMembers(prev => new Set([...prev, ...newMemberIds]));
    } else {
      alert('Debes seleccionar un estudiante o un grupo.');
      return;
    }

    const resetScores = () => {
      setEvaluationScores({});
      document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    };

    if (applyMode === 'individual' && window.confirm('¿Evaluar otro estudiante con la misma configuración?')) {
      setSelectedStudent('');
      resetScores();
    } else if (applyMode === 'groups') {
      const groupName = tempGroups[selectedGroupIdx]?.name;
      const memberCount = tempGroups[selectedGroupIdx]?.members.length || 0;
      
      const allGroupMemberIds = new Set();
      tempGroups.forEach(g => g.members.forEach(m => allGroupMemberIds.add(m.id)));
      const remainingStudents = filteredStudents.length - allGroupMemberIds.size;
      
      if (remainingStudents > 0) {
        if (window.confirm(`Evaluación guardada para el grupo "${groupName}" con ${memberCount} estudiante(s).\n\nQuedan ${remainingStudents} estudiante(s) sin evaluar.\n\n¿Evaluar otro grupo?`)) {
          setSelectedGroupIdx(null);
          resetScores();
        } else {
          setView('list');
          setApplyingInstrument(null);
          setTempGroups([]);
          setSavedGroupMembers(new Set());
        }
      } else {
        if (window.confirm(`Evaluación guardada para el grupo "${groupName}" con ${memberCount} estudiante(s).\n\n¡Todos los estudiantes han sido evaluados!`)) {
          setView('list');
          setApplyingInstrument(null);
          setTempGroups([]);
          setSavedGroupMembers(new Set());
        } else {
          setView('list');
          setApplyingInstrument(null);
          setTempGroups([]);
          setSavedGroupMembers(new Set());
        }
      }
    } else {
      setView('list');
      setApplyingInstrument(null);
      setTempGroups([]);
      setSavedGroupMembers(new Set());
    }
  };

  // ═══════════════════════════════════════════
  //  VIEW: CREATE
  // ═══════════════════════════════════════════
  if (view === 'create') {
    const currentTypeDef = typeMap[instrumentType] || INSTRUMENT_TYPES[0];
    const needsCriteria = !['numeric', 'portfolio', 'anecdotal'].includes(instrumentType);

    return (
      <div className="animate-fade-in">
        {/* Header moderno con botón de volver */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          color: 'white'
        }}>
          <div style={{
            position: 'absolute',
            top: '-30%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          
          <button 
            onClick={() => { setView('list'); setEditingInstrument(null); resetForm(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            <ChevronLeft size={20} /> Volver a Instrumentos
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                {editingInstrument ? 'Editar Instrumento' : 'Crear Instrumento de Evaluación'}
              </h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Define los criterios y tipo según el DCNEB</p>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'grid', gap: '2rem' }}>

            {/* Título */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>
                Título del Instrumento
              </label>
              <input 
                className="input-field" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej. Exposición oral sobre la Independencia del Perú"
                style={{
                  padding: '1rem',
                  fontSize: '1rem',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Selector de tipo */}
            <div>
              <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>
                Tipo de Instrumento 
                <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.85rem', marginLeft: '8px' }}>(DCNEB)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {INSTRUMENT_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = instrumentType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setInstrumentType(t.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                        padding: '1.25rem 1rem', borderRadius: '14px', textAlign: 'left',
                        border: `2px solid ${active ? t.color : '#e2e8f0'}`,
                        background: active ? `${t.color}12` : '#f8fafc',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: active ? `0 4px 12px ${t.color}30` : 'none'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: active ? `${t.color}20` : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={20} color={active ? t.color : '#94a3b8'} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? t.color : '#334155' }}>{t.label}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Criterios — solo si el tipo los requiere */}
            {needsCriteria && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${currentTypeDef.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckSquare size={18} color={currentTypeDef.color} />
                    </span>
                    Indicadores / Criterios
                    <span style={{ fontSize: '0.78rem', color: currentTypeDef.color, background: `${currentTypeDef.color}15`, padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                      {instrumentType === 'observation' ? 'Siempre / A veces / Nunca' :
                       instrumentType === 'checklist' ? 'Logrado / No Logrado' : 'AD / A / B / C'}
                    </span>
                  </h3>
                  <button onClick={() => setCriteria([...criteria, { id: Date.now().toString(), text: '', descriptors: { AD: '', A: '', B: '', C: '' } }])} 
                    style={{ 
                      color: '#8b5cf6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#f5f3ff',
                      border: '1px solid #8b5cf630',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                    <PlusCircle size={18} /> Añadir Criterio
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {criteria.map((c, idx) => (
                    <div key={c.id} style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: currentTypeDef.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>{idx + 1}</div>
                        <input
                          className="input-field" style={{ flex: 1, borderColor: '#e2e8f0' }} value={c.text}
                          onChange={e => { const n = [...criteria]; n[idx].text = e.target.value; setCriteria(n); }}
                          placeholder="Describe el indicador o criterio..."
                        />
                        <button onClick={() => { if (criteria.length > 1) { if (window.confirm('¿Eliminar?')) setCriteria(criteria.filter(x => x.id !== c.id)); } else alert('Mínimo 1 criterio.'); }} 
                          style={{ 
                            color: '#ef4444', 
                            background: '#fef2f2',
                            border: '1px solid #ef444420',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {/* Descriptores de rúbrica */}
                      {instrumentType === 'rubric' && (
                        <div style={{ marginLeft: '38px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '0.75rem' }}>
                          {['AD', 'A', 'B', 'C'].map(level => (
                            <div key={level}>
                              <label style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: level === 'AD' ? '#10b981' : level === 'A' ? '#3b82f6' : level === 'B' ? '#f59e0b' : '#ef4444', 
                                display: 'block', 
                                marginBottom: '6px',
                                textAlign: 'center'
                              }}>
                                {level === 'AD' ? '⭐ Destacado' : level === 'A' ? '✅ Logrado' : level === 'B' ? '🔄 En Proceso' : '🔸 En Inicio'}
                              </label>
                              <textarea
                                className="input-field"
                                rows={2}
                                style={{ 
                                  fontSize: '0.72rem', 
                                  resize: 'none',
                                  borderColor: level === 'AD' ? '#10b98130' : level === 'A' ? '#3b82f630' : level === 'B' ? '#f59e0b30' : '#ef444430',
                                  background: level === 'AD' ? '#10b98108' : level === 'A' ? '#3b82f608' : level === 'B' ? '#f59e0b08' : '#ef444408'
                                }}
                                value={c.descriptors?.[level] || ''}
                                onChange={e => {
                                  const n = [...criteria];
                                  if (!n[idx].descriptors) n[idx].descriptors = { AD: '', A: '', B: '', C: '' };
                                  n[idx].descriptors[level] = e.target.value;
                                  setCriteria(n);
                                }}
                                placeholder={`Descriptor ${level}...`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prueba escrita — no necesita lista de criterios */}
            {instrumentType === 'numeric' && (
              <div style={{ 
                background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)', 
                border: '1px solid #ef444420', 
                borderRadius: '12px', 
                padding: '1.25rem', 
                fontSize: '0.9rem', 
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#ef444415',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={20} color="#ef4444" />
                </div>
                <div>
                  <strong>Prueba Escrita:</strong> Al aplicar esta prueba ingresarás un puntaje de <strong>0 a 20</strong> que se convertirá automáticamente a la escala cualitativa AD / A / B / C.
                </div>
              </div>
            )}

            {/* Portafolio / Registro anecdótico */}
            {(instrumentType === 'portfolio' || instrumentType === 'anecdotal') && (
              <div style={{ 
                background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)', 
                border: '1px solid #6366f120', 
                borderRadius: '12px', 
                padding: '1.25rem', 
                fontSize: '0.9rem', 
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#6366f115',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {instrumentType === 'portfolio' ? <BookOpen size={20} color="#6366f1" /> : <MessageSquare size={20} color="#6366f1" />}
                </div>
                <div>
                  {instrumentType === 'portfolio'
                    ? <><strong>Portafolio:</strong> Se evalúa holísticamente. Al aplicarlo asignarás directamente una calificación AD / A / B / C.</>
                    : <><strong>Registro Anecdótico:</strong> Describe situaciones significativas. Al aplicarlo asignarás directamente AD / A / B / C con una nota descriptiva.</>}
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ 
              marginTop: '1rem', 
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: 'fit-content'
            }} onClick={handleSaveInstrument}>
              <Save size={20} /> {editingInstrument ? 'Actualizar Instrumento' : 'Guardar Instrumento'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  VIEW: APPLY
  // ═══════════════════════════════════════════
  if (view === 'apply' && applyingInstrument) {
    const typeDef = typeMap[applyingInstrument.type] || INSTRUMENT_TYPES[0];
    const scoring = typeDef.scoring;

    return (
      <div className="animate-fade-in">
        {/* Header moderno */}
        <div style={{
          background: `linear-gradient(135deg, ${typeDef.color} 0%, ${typeDef.color}dd 100%)`,
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          color: 'white'
        }}>
          <div style={{
            position: 'absolute',
            top: '-30%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          
          <button 
            onClick={handleCancelApply} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '0.6rem 1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginBottom: '1rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <ChevronLeft size={18} /> Volver a Instrumentos
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                Aplicar: <span style={{ color: 'white' }}>{applyingInstrument.title}</span>
              </h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>{typeDef.label}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '2rem' }}>
          {/* ── Panel lateral ── */}
          <div className="card shadow-glass" style={{ height: 'fit-content', borderTop: `4px solid ${typeDef.color}` }}>
            <h3 style={{ marginBottom: '1.5rem', color: typeDef.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Estudiante y Contexto
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Modo individual / grupal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button onClick={() => setApplyMode('individual')} style={{ 
                  fontSize: '0.8rem', padding: '0.5rem',
                  borderRadius: '8px',
                  border: applyMode === 'individual' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: applyMode === 'individual' ? 'var(--accent-primary)15' : 'transparent',
                  color: applyMode === 'individual' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <User size={14} /> Individual
                </button>
                <button onClick={() => setApplyMode('groups')} style={{ 
                  fontSize: '0.8rem', padding: '0.5rem',
                  borderRadius: '8px',
                  border: applyMode === 'groups' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: applyMode === 'groups' ? 'var(--accent-primary)15' : 'transparent',
                  color: applyMode === 'groups' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <Users size={14} /> Grupos
                </button>
              </div>

              {/* Actividad */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Actividad evaluada</label>
                <input className="input-field" value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="Ej. Análisis de texto..." />
              </div>

              {/* Vinculación curricular */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.72rem', color: typeDef.color, fontWeight: 700, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📌 Vincular a competencia
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Materia</label>
                    <select className="input-field" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                      <option value="">-- Selecciona --</option>
                      {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Competencia</label>
                    <select className="input-field" value={selectedCompetencyId} onChange={e => setSelectedCompetencyId(e.target.value)} disabled={availableCompetencies.length === 0}>
                      <option value="">-- Selecciona --</option>
                      {availableCompetencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Bimestre</label>
                    <select className="input-field" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                      {['1','2','3','4'].map(p => <option key={p} value={p}>Bimestre {p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección y estudiante */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Sección</label>
                  <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    <option value="">-- Selecciona --</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Estudiante individual */}
              {applyMode === 'individual' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Estudiante</label>
                    <button onClick={pickRandom} style={{ fontSize: '0.72rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Dices size={13} /> Sorteo
                    </button>
                  </div>
                  {(() => {
                    const availableStudents = filteredStudents.filter(s => !savedGroupMembers.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
                    if (availableStudents.length === 0) {
                      return (
                        <div style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <p style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.5rem' }}>Todos los estudiantes de esta sección ya fueron evaluados</p>
                          <button 
                            onClick={() => setSavedGroupMembers(new Set())}
                            style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Reiniciar evaluación
                          </button>
                        </div>
                      );
                    }
                    return (
                      <select className="input-field" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                        <option value="">-- Selecciona --</option>
                        {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    );
                  })()}
                  {isPicking && randomStudent && !savedGroupMembers.has(randomStudent.id) && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: 600 }}>🎲 {randomStudent.name}</p>
                  )}
                </div>
              )}

              {/* Grupos */}
              {applyMode === 'groups' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Grupos para esta actividad</label>
                    <button 
                      onClick={() => {
                        const name = prompt('Nombre del grupo:');
                        if (name) {
                          setTempGroups(prev => [...prev, { id: Date.now().toString(), name, members: [] }]);
                        }
                      }}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.3rem 0.5rem',
                        background: 'var(--accent-primary)15',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '6px',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      + Nuevo Grupo
                    </button>
                  </div>
                  
                  {tempGroups.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                      Crea grupos para esta evaluación. Selecciona estudiantes de la lista.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {tempGroups.map((g, idx) => (
                        <div key={g.id} style={{ 
                          marginBottom: '0.75rem',
                          border: selectedGroupIdx === idx ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          background: selectedGroupIdx === idx ? 'var(--accent-primary)08' : 'transparent'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <button 
                              onClick={() => setSelectedGroupIdx(idx)}
                              style={{ 
                                background: 'none', border: 'none', 
                                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                color: selectedGroupIdx === idx ? 'var(--accent-primary)' : 'var(--text-primary)'
                              }}
                            >
                              {g.name} ({g.members.length})
                            </button>
                            <button 
                              onClick={() => setTempGroups(prev => prev.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', fontSize: '0.75rem' }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {g.members.length === 0 ? (
                              <span>Sin estudiantes</span>
                            ) : (
                              g.members.map((m, mi) => (
                                <span 
                                  key={m.id} 
                                  style={{ 
                                    background: 'var(--accent-primary)15', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {m.name}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTempGroups(prev => prev.map((gr, gi) => 
                                        gi === idx 
                                          ? { ...gr, members: gr.members.filter((_, mi2) => mi2 !== mi) }
                                          : gr
                                      ));
                                    }}
                                    style={{ 
                                      background: 'none', border: 'none', 
                                      cursor: 'pointer', color: 'var(--danger-color)',
                                      padding: '0', lineHeight: 1, fontSize: '0.8rem'
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selector de estudiantes para añadir a grupos */}
                  {selectedGroupIdx !== null && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Añadir estudiantes a "{tempGroups[selectedGroupIdx]?.name}":
                      </label>
                      
                      {/* Info de estudiantes ya asignados */}
                      {allAssignedStudentIds.size > 0 && (
                        <div style={{ 
                          padding: '0.5rem', 
                          background: 'rgba(245,158,11,0.1)', 
                          border: '1px solid rgba(245,158,11,0.3)',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          fontSize: '0.72rem'
                        }}>
                          <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '0.25rem' }}>
                            ⚠️ {allAssignedStudentIds.size} estudiante(s) ya asignado(s) a otros grupos:
                          </div>
                          <div style={{ color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {Array.from(allAssignedStudentIds).map(id => {
                              const student = filteredStudents.find(s => s.id === id);
                              return student ? (
                                <span key={id} style={{ 
                                  background: 'rgba(245,158,11,0.15)', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontSize: '0.68rem'
                                }}>
                                  {student.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                        {availableStudentsForGroups.length === 0 ? (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {tempGroups.every(g => g.members.length > 0) 
                              ? '✓ Todos los estudiantes ya fueron añadidos a algún grupo' 
                              : 'Este grupo ya tiene todos los estudiantes'}
                          </p>
                        ) : (
                          availableStudentsForGroups.map(s => (
                            <div 
                              key={s.id}
                              onClick={() => {
                                setTempGroups(prev => prev.map((g, i) => 
                                  i === selectedGroupIdx 
                                    ? { ...g, members: [...g.members, { id: s.id, name: s.name }] }
                                    : g
                                ));
                              }}
                              style={{ 
                                padding: '0.3rem 0.5rem', 
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ color: 'var(--accent-primary)' }}>+</span> {s.name}
                            </div>
                          ))
                        )}
                      </div>
                      {availableStudentsForGroups.length > 0 && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--success-color)', marginTop: '0.3rem', textAlign: 'center' }}>
                          {availableStudentsForGroups.length} estudiante(s) disponible(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Panel de criterios ── */}
          <div className="card shadow-glass">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={20} color={typeDef.color} /> Evaluación
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* PRUEBA ESCRITA — input numérico */}
              {scoring === 'numeric' && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Puntaje obtenido (0 – 20)</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="number" min="0" max="20"
                      className="input-field" style={{ width: '100px', fontSize: '2rem', textAlign: 'center', fontWeight: 700 }}
                      value={evaluationScores['__numeric__'] ?? ''}
                      onChange={e => setEvaluationScores({ __numeric__: Math.min(20, Math.max(0, Number(e.target.value))) })}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ 20 puntos → AD / A / B / C</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    ≥ 17.5 → AD · ≥ 12.5 → A · ≥ 7.5 → B · &lt; 7.5 → C
                  </div>
                </div>
              )}

              {/* PORTAFOLIO / ANECDÓTICO — asignación directa */}
              {scoring === 'direct' && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Calificación directa</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {['AD','A','B','C'].map(g => (
                      <button key={g}
                        className={`nav-item ${evaluationScores['__direct__'] === g ? 'active' : ''}`}
                        onClick={() => setEvaluationScores({ __direct__: g })}
                        style={{ flexDirection: 'column', gap: '4px', textAlign: 'center', padding: '1rem', border: evaluationScores['__direct__'] === g ? `2px solid ${typeDef.color}` : '2px solid transparent' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.3rem' }}>{g}</span>
                        <span style={{ fontSize: '0.7rem' }}>{GRADE_LABEL[g]}</span>
                      </button>
                    ))}
                  </div>
                  {applyingInstrument.type === 'anecdotal' && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Descripción del hecho observado</label>
                      <textarea className="input-field" rows={3} style={{ resize: 'vertical' }}
                        value={evaluationScores['__note__'] || ''}
                        onChange={e => setEvaluationScores({ ...evaluationScores, __note__: e.target.value })}
                        placeholder="Describe brevemente el hecho o situación significativa observada..." />
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE COTEJO — Logrado / No Logrado */}
              {scoring === 'binary' && applyingInstrument.criteria && applyingInstrument.criteria.map((c, idx) => (
                <div key={c.id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{idx + 1}. {c.text}</p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className={`nav-item ${evaluationScores[c.id] === true ? 'active' : ''}`}
                      onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: true })}
                      style={{ flex: 1, justifyContent: 'center', border: evaluationScores[c.id] === true ? '2px solid #10b981' : '2px solid transparent' }}>
                      ✅ Logrado
                    </button>
                    <button className={`nav-item ${evaluationScores[c.id] === false ? 'active' : ''}`}
                      onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: false })}
                      style={{ flex: 1, justifyContent: 'center', border: evaluationScores[c.id] === false ? '2px solid #ef4444' : '2px solid transparent' }}>
                      ❌ No Logrado
                    </button>
                  </div>
                </div>
              ))}

              {/* FICHA DE OBSERVACIÓN — Siempre / A veces / Nunca */}
              {scoring === 'frequency' && applyingInstrument.criteria && applyingInstrument.criteria.map((c, idx) => (
                <div key={c.id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{idx + 1}. {c.text}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[{ v: 3, l: 'Siempre', emoji: '🟢' }, { v: 2, l: 'A veces', emoji: '🟡' }, { v: 1, l: 'Nunca', emoji: '🔴' }].map(opt => (
                      <button key={opt.v}
                        className={`nav-item ${evaluationScores[c.id] == opt.v ? 'active' : ''}`}
                        onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: opt.v })}
                        style={{ flexDirection: 'column', gap: '4px', textAlign: 'center', padding: '0.7rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{opt.emoji}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{opt.l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* ESCALA DE VALORACIÓN / AUTOEVALUACIÓN — botones AD/A/B/C compactos */}
              {scoring === 'qualitative' && applyingInstrument.type !== 'rubric' && applyingInstrument.criteria && applyingInstrument.criteria.map((c, idx) => (
                <div key={c.id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{idx + 1}. {c.text}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {[{ v: 4, g: 'AD', l: 'Destacado', color: '#10b981' }, { v: 3, g: 'A', l: 'Logrado', color: '#3b82f6' }, { v: 2, g: 'B', l: 'En Proceso', color: '#f59e0b' }, { v: 1, g: 'C', l: 'En Inicio', color: '#ef4444' }].map(level => {
                      const selected = evaluationScores[c.id] == level.v;
                      return (
                        <button key={level.v}
                          onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: level.v })}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                            border: `2px solid ${selected ? level.color : 'var(--border-color)'}`,
                            background: selected ? `${level.color}20` : 'transparent'
                          }}>
                          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: selected ? level.color : 'var(--text-primary)' }}>{level.g}</span>
                          <span style={{ fontSize: '0.68rem', color: selected ? level.color : 'var(--text-secondary)' }}>{level.l}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* RÚBRICA — tabla horizontal con encabezados de color */}
              {scoring === 'qualitative' && applyingInstrument.type === 'rubric' && (() => {
                const LEVELS = [
                  { v: 4, g: 'AD', l: 'Destacado',   color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
                  { v: 3, g: 'A',  l: 'Logrado',      color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
                  { v: 2, g: 'B',  l: 'En Proceso',   color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
                  { v: 1, g: 'C',  l: 'En Inicio',    color: '#ef4444', bg: 'rgba(239,68,68,0.10)'  },
                ];
                return (
                  <div style={{ overflowX: 'auto' }}>
                    {/* Encabezado de la tabla */}
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                      <div style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Criterio
                      </div>
                      {LEVELS.map(lv => (
                        <div key={lv.v} style={{
                          padding: '0.6rem 0.75rem', borderRadius: '10px 10px 0 0',
                          background: lv.bg, border: `1px solid ${lv.color}40`,
                          borderBottom: 'none', textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: lv.color }}>{lv.g}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: lv.color }}>{lv.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Filas por criterio */}
                    {applyingInstrument.criteria && applyingInstrument.criteria.map((c, idx) => {
                      const selected = evaluationScores[c.id];
                      return (
                        <div key={c.id} style={{
                          display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '6px',
                          marginBottom: '8px', alignItems: 'stretch'
                        }}>
                          {/* Nombre del criterio */}
                          <div style={{
                            padding: '0.75rem',                             background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                          }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{idx + 1}.</span>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.35 }}>{c.text}</span>
                          </div>

                          {/* Botón por nivel con descriptor */}
                          {LEVELS.map(lv => {
                            const isSelected = selected == lv.v;
                            const descriptor = c.descriptors?.[lv.g] || '';
                            return (
                              <button key={lv.v}
                                onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: lv.v })}
                                style={{
                                  padding: '0.5rem', borderRadius: '0 0 10px 10px',
                                  border: `2px solid ${isSelected ? lv.color : lv.color + '30'}`,
                                  background: isSelected ? lv.bg : 'transparent',
                                  cursor: 'pointer', transition: 'all 0.15s',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '4px',
                                  boxShadow: isSelected ? `0 0 0 3px ${lv.color}30` : 'none',
                                  minHeight: '100px'
                                }}>
                                {isSelected
                                  ? <span style={{ fontSize: '1.2rem' }}>✅</span>
                                  : <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${lv.color}60`, display: 'block' }} />
                                }
                                {descriptor ? (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    color: isSelected ? lv.color : 'var(--text-secondary)',
                                    textAlign: 'center', 
                                    lineHeight: 1.3,
                                    fontStyle: 'italic'
                                  }}>
                                    "{descriptor}"
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    {isSelected ? '✓' : '—'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={handleSaveEvaluation}>
              <CheckCircle2 size={20} /> Guardar Evaluación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  VIEW: LIST
  // ═══════════════════════════════════════════
  return (
    <div className="animate-fade-in">
      {/* Header moderno */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        color: 'white'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Instrumentos de Evaluación</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Crea y aplica herramientas según el DCNEB</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setView('create')} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'white',
            color: '#8b5cf6',
            border: 'none',
            fontWeight: 600
          }}>
            <Plus size={18} /> Nuevo Instrumento
          </button>
        </div>
      </div>

      {/* Grid de instrumentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {instruments.map(ins => {
          const typeDef = typeMap[ins.type] || INSTRUMENT_TYPES[0];
          const Icon = typeDef.icon;
          const evCount = instrumentEvaluations.filter(e => e.instrumentId === ins.id).length;
          return (
            <div key={ins.id} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              ':hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '14px', 
                  background: `${typeDef.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} color={typeDef.color} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEditInstrument(ins)} style={{ 
                    color: '#6366f1', 
                    background: '#f1f5f9', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (window.confirm('¿Eliminar instrumento?')) deleteInstrument(ins.id); }} style={{ 
                    color: '#ef4444', 
                    background: '#fef2f2', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>{ins.title}</h3>
                <span style={{ 
                  fontSize: '0.78rem', 
                  color: typeDef.color, 
                  fontWeight: 600, 
                  background: `${typeDef.color}15`, 
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {typeDef.label}
                </span>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '8px' }}>
                  {ins.criteria?.length ? `${ins.criteria.length} criterio(s)` : 'Evaluación global'} · {evCount} evaluación(es)
                </p>
              </div>
              <button className="btn-primary" style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '0.9rem', 
                gap: '8px',
                background: typeDef.color,
                border: 'none'
              }} onClick={() => handleStartApply(ins)}>
                <Play size={16} /> Aplicar Evaluación
              </button>
            </div>
          );
        })}

        {instruments.length === 0 && (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '4rem', 
            background: '#f8fafc',
            border: '2px dashed #e2e8f0', 
            borderRadius: '16px' 
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 1.5rem',
              background: '#f1f5f9',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardCheck size={36} color="#94a3b8" />
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Aún no tienes instrumentos creados</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Haz clic en <strong style={{ color: '#8b5cf6' }}>Nuevo Instrumento</strong> para comenzar</p>
          </div>
        )}
      </div>

      {/* Evaluaciones recientes */}
      {instrumentEvaluations.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            color: 'white'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-5%',
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Evaluaciones Recientes</h2>
                <p style={{ opacity: 0.9, fontSize: '0.85rem', margin: 0 }}>{instrumentEvaluations.length} evaluación(es) registrada(s)</p>
              </div>
            </div>
          </div>
          <div className="table-container shadow-glass" style={{ borderRadius: '16px', overflowX: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={16} />
                      Estudiante
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardCheck size={16} />
                      Actividad / Instrumento
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Grid size={16} />
                      Tipo
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <BarChart2 size={16} />
                      Resultado
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} />
                      Fecha
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <CheckCircle2 size={16} />
                      Acciones
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {instrumentEvaluations.slice().reverse().map((ev, idx) => {
                  const instrument = instruments.find(i => i.id === ev.instrumentId);
                  const evalType = ev.instrumentType || instrument?.type || 'rubric';
                  const td = typeMap[evalType] || typeMap['rubric'];
                  const displayTitle = ev.instrumentTitle || instrument?.title || instrument?.name || 'Sin instrumento';
                  const studentFromList = students.find(s => 
                    s.id === ev.studentId || s.id === ev.student_id || 
                    s.student_id === ev.studentId || s.student_id === ev.student_id
                  );
                  const studentByName = studentsByName[ev.student_name];
                  const studentFromSupabase = studentNamesFromSupabase[ev.studentId];
                  const displayStudent = studentFromList?.name || studentByName?.name || studentFromSupabase || ev.studentName || ev.student_name || 'Estudiante';
                  const formatDate = (dateStr) => {
                    if (!dateStr) return 'Sin fecha';
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return 'Sin fecha';
                    return d.toLocaleDateString('es-PE');
                  };
                  return (
                    <tr key={ev.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ fontWeight: 600, padding: '1rem' }}>{displayStudent}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{ev.activityName || 'Sin actividad'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{displayTitle}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: td.color, fontWeight: 600, background: `${td.color}15`, padding: '4px 10px', borderRadius: '6px' }}>
                          {td.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>
                        <span className={`badge ${BadgeTheme[ev.qualitative]}`}>
                          {ev.qualitative} – {GRADE_LABEL[ev.qualitative]}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b', padding: '1rem' }}>
                        {formatDate(ev.date)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem', border: 'none' }}
                            onClick={() => setViewingEvaluation(ev)}
                            title="Ver instrumento aplicado"
                          >
                            <FileSearch size={16} color="var(--accent-primary)" />
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem', border: 'none' }}
                            onClick={() => { if (window.confirm('¿Eliminar esta evaluación?')) deleteInstrumentEvaluation(ev.id); }}
                            title="Eliminar evaluación"
                          >
                            <Trash2 size={16} color="var(--danger-color)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para ver instrumento aplicado */}
      {viewingEvaluation && (
        <div className="modal-overlay animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '2rem 1rem', zIndex: 1000, overflowY: 'auto'
        }}>
          <div className="card shadow-glass" style={{ maxWidth: '700px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>{viewingEvaluation.instrumentTitle}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Estudiante: <strong>{viewingEvaluation.studentName}</strong> | {viewingEvaluation.activityName}
                </p>
                {viewingEvaluation.competencyName && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '4px' }}>
                    Competencia: <strong>{viewingEvaluation.competencyName}</strong>
                  </p>
                )}
              </div>
              <button onClick={() => setViewingEvaluation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Resultado */}
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', 
              padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
              background: viewingEvaluation.qualitative === 'AD' ? 'rgba(16,185,129,0.1)' :
                         viewingEvaluation.qualitative === 'A' ? 'rgba(59,130,246,0.1)' :
                         viewingEvaluation.qualitative === 'B' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
            }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '12px',
                background: viewingEvaluation.qualitative === 'AD' ? '#10b981' :
                           viewingEvaluation.qualitative === 'A' ? '#3b82f6' :
                           viewingEvaluation.qualitative === 'B' ? '#f59e0b' : '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, color: 'white'
              }}>
                {viewingEvaluation.qualitative}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{GRADE_LABEL[viewingEvaluation.qualitative]}</div>
                {viewingEvaluation.finalScore !== null && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Puntaje: {viewingEvaluation.finalScore} / {viewingEvaluation.maxPossible}
                  </div>
                )}
              </div>
            </div>

            {/* Criterios evaluados */}
            {viewingEvaluation.scores && Object.keys(viewingEvaluation.scores).filter(k => !k.startsWith('__')).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  Criterios Evaluados
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {viewingEvaluation.scores && Object.entries(viewingEvaluation.scores).map(([criterionId, score]) => {
                    if (criterionId.startsWith('__')) return null;
                    const criterion = viewingEvaluation.criteria?.find(c => c.id === criterionId) || { text: criterionId };
                    const scoreLabel = viewingEvaluation.instrumentType === 'checklist' 
                      ? (score ? '✅ Logrado' : '❌ No Logrado')
                      : viewingEvaluation.instrumentType === 'observation'
                      ? (score === 3 ? '🟢 Siempre' : score === 2 ? '🟡 A veces' : '🔴 Nunca')
                      : ['C', 'B', 'A', 'AD'][(score - 1)] || score;
                    
                    return (
                      <div key={criterionId} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '0.75rem', background: '#f8fafc', borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ flex: 1, fontSize: '0.9rem' }}>{criterion.text || criterionId}</span>
                        <span style={{ 
                          fontWeight: 700, marginLeft: '1rem',
                          color: viewingEvaluation.instrumentType === 'checklist' 
                            ? (score ? '#10b981' : '#ef4444')
                            : score === 4 ? '#10b981' : score === 3 ? '#3b82f6' : score === 2 ? '#f59e0b' : '#ef4444'
                        }}>
                          {scoreLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nota adicional (para registro anecdótico) */}
            {viewingEvaluation.scores?.__note__ && (
              <div style={{ 
                padding: '1rem', background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.85rem', color: '#6366f1', marginBottom: '0.5rem' }}>Nota del docente:</h4>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>{viewingEvaluation.scores.__note__}</p>
              </div>
            )}

            {/* Detalles adicionales */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Área:</span>
                <div style={{ fontWeight: 600 }}>
                  {viewingEvaluation.subjectName || 
                   (viewingEvaluation.subjectId && subjects?.find(s => s.id === viewingEvaluation.subjectId)?.name) ||
                   (viewingEvaluation.subject_name && viewingEvaluation.subject_name) ||
                   (viewingEvaluation.subject_id && subjects?.find(s => s.id === viewingEvaluation.subject_id)?.name) ||
                   '—'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Fecha:</span>
                <div style={{ fontWeight: 600 }}>{new Date(viewingEvaluation.date).toLocaleDateString('es-PE')}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Bimestre:</span>
                <div style={{ fontWeight: 600 }}>{viewingEvaluation.period}</div>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={() => setViewingEvaluation(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
