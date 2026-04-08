import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  ClipboardCheck, Plus, Trash2, Play, 
  CheckSquare, BarChart2, Grid, ChevronLeft, 
  PlusCircle, Save, User, Activity, CheckCircle2,
  Dices, Users, Eye, BookOpen, FileText, MessageSquare, Star,
  X, FileSearch, Edit2, CheckCircle as CheckCircleIcon
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

  const filteredStudents = useMemo(() => students.filter(s => s.gradeLevel === selectedClass), [students, selectedClass]);
  const predefinedGroups = useMemo(() => {
    const map = {};
    filteredStudents.forEach(s => {
      const g = s.group || 'Sin Grupo';
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return Object.entries(map).map(([name, members]) => ({ name, members }));
  }, [filteredStudents]);

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
      addInstrument({ title, type: instrumentType, criteria });
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
    setCriteria(ins.criteria && ins.criteria.length > 0 ? ins.criteria : [{ id: '1', text: '' }]);
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

    const evaluationData = {
      instrumentId: applyingInstrument.id,
      instrumentType: applyingInstrument.type,
      criteria: applyingInstrument.criteria || [],
      activityName,
      scores: evaluationScores,
      score,
      maxPossible: max,
      qualitative,
      subjectId: selectedSubjectId,
      subjectName: selectedSubjectObj?.name || '',
      competencyId: selectedCompetencyId,
      competencyName: availableCompetencies.find(c => c.id === selectedCompetencyId)?.name || '',
      period: selectedPeriod,
      classId: classes.find(c => c.name === selectedClass)?.id || ''
    };

    const save = (student) => saveInstrumentEvaluation({ ...evaluationData, studentId: student.id, studentName: student.name });

    if (applyMode === 'individual') {
      const s = students.find(s => s.id === selectedStudent);
      save(s);
      setSavedGroupMembers(prev => new Set([...prev, selectedStudent]));
    } else if (selectedGroupIdx !== null && tempGroups[selectedGroupIdx]?.members.length > 0) {
      const membersToSave = tempGroups[selectedGroupIdx].members;
      membersToSave.forEach(save);
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
        <header className="page-header">
          <div>
            <button className="nav-item" onClick={() => { setView('list'); setEditingInstrument(null); resetForm(); }} style={{ marginBottom: '1rem', padding: '0.5rem' }}>
              <ChevronLeft size={20} /> Volver
            </button>
            <h1 className="page-title">{editingInstrument ? 'Editar Instrumento' : 'Crear Instrumento de Evaluación'}</h1>
          </div>
        </header>

        <div className="card shadow-glass" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '1.75rem' }}>

            {/* Título */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Título del Instrumento</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Exposición oral sobre la Independencia del Perú" />
            </div>

            {/* Selector de tipo */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Tipo de Instrumento <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(DCNEB)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
                {INSTRUMENT_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = instrumentType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setInstrumentType(t.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
                        padding: '0.9rem 1rem', borderRadius: '12px', textAlign: 'left',
                        border: `2px solid ${active ? t.color : 'var(--border-color)'}`,
                        background: active ? `${t.color}18` : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <Icon size={20} color={active ? t.color : 'var(--text-secondary)'} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? t.color : 'var(--text-primary)' }}>{t.label}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Criterios — solo si el tipo los requiere */}
            {needsCriteria && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    Indicadores / Criterios
                    <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: currentTypeDef.color, background: `${currentTypeDef.color}18`, padding: '2px 8px', borderRadius: '6px' }}>
                      {instrumentType === 'observation' ? 'Siempre / A veces / Nunca' :
                       instrumentType === 'checklist' ? 'Logrado / No Logrado' : 'AD / A / B / C'}
                    </span>
                  </h3>
                  <button onClick={() => setCriteria([...criteria, { id: Date.now().toString(), text: '' }])} style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PlusCircle size={18} /> Añadir
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {criteria.map((c, idx) => (
                    <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, width: '22px', flexShrink: 0 }}>{idx + 1}.</span>
                      <input
                        className="input-field" style={{ flex: 1 }} value={c.text}
                        onChange={e => { const n = [...criteria]; n[idx].text = e.target.value; setCriteria(n); }}
                        placeholder="Describe el indicador o criterio..."
                      />
                      <button onClick={() => { if (criteria.length > 1) { if (window.confirm('¿Eliminar?')) setCriteria(criteria.filter(x => x.id !== c.id)); } else alert('Mínimo 1 criterio.'); }} style={{ color: 'var(--danger-color)', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prueba escrita — no necesita lista de criterios */}
            {instrumentType === 'numeric' && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                📝 Al aplicar esta prueba ingresarás un puntaje de <strong>0 a 20</strong> que se convertirá automáticamente a la escala cualitativa AD / A / B / C.
              </div>
            )}

            {/* Portafolio / Registro anecdótico */}
            {(instrumentType === 'portfolio' || instrumentType === 'anecdotal') && (
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {instrumentType === 'portfolio'
                  ? '📁 El portafolio se evalúa holísticamente. Al aplicarlo asignarás directamente una calificación AD / A / B / C.'
                  : '📋 El registro anecdótico describe situaciones significativas. Al aplicarlo asignarás directamente AD / A / B / C con una nota descriptiva.'}
              </div>
            )}

            <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleSaveInstrument}>
              <Save size={18} /> {editingInstrument ? 'Actualizar' : 'Guardar Instrumento'}
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
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={handleCancelApply} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'var(--accent-primary)15';
              e.target.style.color = 'var(--accent-primary)';
              e.target.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
              e.target.style.borderColor = 'var(--border-color)';
            }}
          >
            <ChevronLeft size={20} /> Volver a Instrumentos
          </button>
        </div>
        <header className="page-header">
          <div>
            <h1 className="page-title">
              Aplicar: <span style={{ color: typeDef.color }}>{applyingInstrument.title}</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{typeDef.label}</p>
          </div>
        </header>

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
                    const availableStudents = filteredStudents.filter(s => !savedGroupMembers.has(s.id));
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
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                        {/* Get all student IDs that are already in ANY group (for this evaluation session) */}
                        {(() => {
                          const allGroupMemberIds = new Set();
                          tempGroups.forEach(g => g.members.forEach(m => allGroupMemberIds.add(m.id)));
                          const availableStudents = filteredStudents.filter(s => !allGroupMemberIds.has(s.id));
                          
                          if (availableStudents.length === 0) {
                            return (
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                {tempGroups.every(g => g.members.length > 0) 
                                  ? 'Todos los estudiantes ya fueron añadidos a algún grupo' 
                                  : 'Todos los estudiantes ya están en este grupo'}
                              </p>
                            );
                          }
                          
                          return availableStudents.map(s => (
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
                          ));
                        })()}
                      </div>
                      {/* Show count of already added students */}
                      {(() => {
                        const allGroupMemberIds = new Set();
                        tempGroups.forEach(g => g.members.forEach(m => allGroupMemberIds.add(m.id)));
                        const remaining = filteredStudents.length - allGroupMemberIds.size;
                        return allGroupMemberIds.size > 0 && remaining > 0 ? (
                          <p style={{ fontSize: '0.7rem', color: 'var(--warning-color)', marginTop: '0.3rem', textAlign: 'center' }}>
                            {remaining} estudiante(s) disponible(s)
                          </p>
                        ) : null;
                      })()}
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
                  { v: 4, g: 'AD', l: 'Destacado',   desc: 'Supera lo esperado con evidencias sólidas',  color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
                  { v: 3, g: 'A',  l: 'Logrado',      desc: 'Cumple el estándar de manera satisfactoria', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
                  { v: 2, g: 'B',  l: 'En Proceso',   desc: 'Muestra avance pero requiere acompañamiento', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
                  { v: 1, g: 'C',  l: 'En Inicio',    desc: 'Evidencia dificultades en el desempeño',      color: '#ef4444', bg: 'rgba(239,68,68,0.10)'  },
                ];
                return (
                  <div style={{ overflowX: 'auto' }}>
                    {/* Encabezado de la tabla */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
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
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>{lv.desc}</div>
                        </div>
                      ))}
                    </div>

                    {/* Filas por criterio */}
                    {applyingInstrument.criteria && applyingInstrument.criteria.map((c, idx) => {
                      const selected = evaluationScores[c.id];
                      return (
                        <div key={c.id} style={{
                          display: 'grid', gridTemplateColumns: '220px repeat(4, 1fr)', gap: '6px',
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

                          {/* Botón por nivel */}
                          {LEVELS.map(lv => {
                            const isSelected = selected == lv.v;
                            return (
                              <button key={lv.v}
                                onClick={() => setEvaluationScores({ ...evaluationScores, [c.id]: lv.v })}
                                style={{
                                  padding: '0.6rem 0.5rem', borderRadius: '0 0 10px 10px',
                                  border: `2px solid ${isSelected ? lv.color : lv.color + '30'}`,
                                  background: isSelected ? lv.bg : 'transparent',
                                  cursor: 'pointer', transition: 'all 0.15s',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                  boxShadow: isSelected ? `0 0 0 3px ${lv.color}30` : 'none'
                                }}>
                                {isSelected
                                  ? <span style={{ fontSize: '1.4rem' }}>✅</span>
                                  : <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${lv.color}60`, display: 'block' }} />
                                }
                                <span style={{ fontSize: '0.7rem', fontWeight: isSelected ? 700 : 400, color: isSelected ? lv.color : 'var(--text-secondary)' }}>
                                  {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                </span>
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
      <header className="page-header">
        <div>
          <h1 className="page-title">Instrumentos de Evaluación</h1>
          <p className="page-subtitle">Crea y aplica herramientas de evaluación según el DCNEB</p>
        </div>
        <button className="btn-primary" onClick={() => setView('create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nuevo Instrumento
        </button>
      </header>

      {/* Grid de instrumentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {instruments.map(ins => {
          const typeDef = typeMap[ins.type] || INSTRUMENT_TYPES[0];
          const Icon = typeDef.icon;
          const evCount = instrumentEvaluations.filter(e => e.instrumentId === ins.id).length;
          return (
            <div key={ins.id} className="card shadow-glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${typeDef.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.55rem', borderRadius: '10px', background: `${typeDef.color}18` }}>
                  <Icon size={22} color={typeDef.color} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEditInstrument(ins)} style={{ color: 'var(--accent-primary)', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (window.confirm('¿Eliminar instrumento?')) deleteInstrument(ins.id); }} style={{ color: 'var(--danger-color)', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>{ins.title}</h3>
                <p style={{ fontSize: '0.8rem', color: typeDef.color, fontWeight: 600 }}>{typeDef.label}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {ins.criteria?.length ? `${ins.criteria.length} criterio(s)` : 'Evaluación global'} · {evCount} evaluación(es)
                </p>
              </div>
              <button className="btn-primary" style={{ padding: '0.55rem', fontSize: '0.88rem', gap: '6px' }} onClick={() => handleStartApply(ins)}>
                <Play size={15} /> Aplicar
              </button>
            </div>
          );
        })}

        {instruments.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '16px' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Aún no tienes instrumentos creados.</p>
            <p style={{ fontSize: '0.85rem' }}>Haz clic en <strong>Nuevo Instrumento</strong> para comenzar.</p>
          </div>
        )}
      </div>

      {/* Evaluaciones recientes */}
      {instrumentEvaluations.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="var(--accent-primary)" /> Evaluaciones Recientes
          </h2>
          <div className="table-container shadow-glass">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Actividad / Instrumento</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Resultado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instrumentEvaluations.slice().reverse().map(ev => {
                  const td = typeMap[ev.instrumentType] || typeMap['checklist'];
                  return (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 600 }}>{ev.studentName}</td>
                      <td>
                        <div>{ev.activityName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.instrumentTitle}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: td.color, fontWeight: 600, background: `${td.color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                          {td.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${BadgeTheme[ev.qualitative]}`}>
                          {ev.qualitative} – {GRADE_LABEL[ev.qualitative]}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(ev.date).toLocaleDateString('es-PE')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
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
