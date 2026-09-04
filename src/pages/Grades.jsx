import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { Info, ClipboardCheck, FileText, CheckSquare, BarChart2, Eye, BookOpen, MessageSquare, Star, Grid, X, GraduationCap, Users, Target, TrendingUp, Trophy, Plus, Send, Trash2, Pencil } from 'lucide-react';

const TYPE_ICONS = {
  checklist: CheckSquare,
  scale: BarChart2,
  rubric: Grid || BarChart2,
  observation: Eye,
  written: FileText,
  selfeval: Star,
  portfolio: BookOpen,
  anecdotal: MessageSquare
};

const TYPE_LABELS = {
  checklist: 'Lista de Cotejo',
  scale: 'Escala de Valoración',
  rubric: 'Rúbrica',
  observation: 'Ficha de Observación',
  written: 'Prueba Escrita',
  selfeval: 'Autoevaluación',
  portfolio: 'Portafolio',
  anecdotal: 'Registro Anecdótico'
};

// Map AD/A/B/C -> numeric value for averaging, then back
const GRADE_TO_NUM = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
const NUM_TO_GRADE = (n) => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};
const numToQualitative = (score, max, type, scores, criteria) => {
  if (!max || max === 0) return 'C';
  const pct = (score / max) * 100;
  if (pct >= 87.5) return 'AD';
  if (pct >= 62.5) return 'A';
  if (pct >= 37.5) return 'B';
  return 'C';
};

const calcScore = (type, scores, criteria) => {
  // Allow direct override for any type when __direct__ is set (e.g., quick grade without criteria)
  if (scores && typeof scores === 'object' && scores['__direct__']) {
    return { score: null, max: null, direct: scores['__direct__'] };
  }
  const scoring = type === 'checklist' ? 'binary'
                : type === 'observation' ? 'frequency'
                : type === 'written' ? 'numeric'
                : (type === 'portfolio' || type === 'anecdotal') ? 'direct'
                : 'qualitative';
  if (scoring === 'binary') {
    const score = Object.values(scores).filter(v => v === true).length;
    const max = criteria.length;
    return { score, max };
  }
  if (scoring === 'qualitative') {
    const score = Object.values(scores).reduce((a, b) => a + Number(b || 0), 0);
    const max = criteria?.length ? criteria.length * 4 : 0;
    return { score, max };
  }
  if (scoring === 'frequency') {
    const score = Object.values(scores).reduce((a, b) => a + Number(b || 0), 0);
    const max = criteria?.length ? criteria.length * 3 : 0;
    return { score, max };
  }
  if (scoring === 'numeric') {
    const score = Number(scores['__numeric__'] || 0);
    return { score, max: 20 };
  }
  if (scoring === 'direct') {
    return { score: null, max: null, direct: scores['__direct__'] || null };
  }
  return { score: 0, max: 0 };
};
const GRADE_LABEL = { AD: 'Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };
const GRADE_CHIP_COLOR = { AD: '#188038', A: '#1967d2', B: '#b06000', C: '#d93025' };
const GRADE_CHIP_BG = { AD: '#e6f4ea', A: '#e8f0fe', B: '#fef7e0', C: '#fce8e6' };

const gradeChipStyle = (qualitative, fontSize = '0.85rem') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '34px',
  padding: '0.25rem 0.6rem',
  borderRadius: '12px',
  background: GRADE_CHIP_BG[qualitative] || 'var(--hover-bg)',
  color: GRADE_CHIP_COLOR[qualitative] || 'var(--text-secondary)',
  fontWeight: 500,
  fontSize
});

const selectPillStyle = {
  padding: '0.55rem 1rem',
  borderRadius: '20px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-color-surface)',
  fontWeight: 500,
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  outline: 'none'
};

export default function Grades() {
  const { students, subjects, classes, instrumentEvaluations, instruments, currentUser, isAdmin, deleteInstrumentEvaluation, periodDates, saveInstrumentEvaluation, setInstrumentEvaluations } = useStore();

  const currentPeriod = () => {
    const now = new Date().toISOString().split('T')[0];
    for (const [id, { start, end }] of Object.entries(periodDates)) {
      if (now >= start && now <= end) return id;
    }
    return '1';
  };

  const availableClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (!currentUser?.assignments) return [];
    const classIds = [...new Set(currentUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [isAdmin, currentUser, classes]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Subjects available for this class (teacher-filtered or all for admin)
  const availableSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const classObj = classes.find(c => c.name === selectedClass);
    if (!classObj) return [];
    if (isAdmin) return subjects;
    if (!currentUser?.assignments) return [];
    const ids = currentUser.assignments
      .filter(a => a.classId === classObj.id)
      .map(a => a.subjectId);
    return subjects.filter(s => ids.includes(s.id));
  }, [selectedClass, isAdmin, currentUser, classes, subjects]);

  const currentSubject = useMemo(
    () => subjects.find(s => s.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanSelected = selectedClass.trim().toLowerCase();
    return students.filter(s => {
      const cleanGrade = (s.gradeLevel || '').trim().toLowerCase();
      const cleanClass = (s.classId || '').trim().toLowerCase();
      return cleanGrade === cleanSelected || cleanClass === cleanSelected;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Instruments filtered by current subject (fallback to all if no subjectId)
  const instrumentsBySubject = useMemo(() => {
    if (!selectedSubjectId) return instruments;
    return instruments.filter(i => !i.subjectId || i.subjectId === selectedSubjectId);
  }, [instruments, selectedSubjectId]);

  const [tooltip, setTooltip] = useState(null); // { studentId, competencyId, evs, position: { x, y } }
  const [hoveredEval, setHoveredEval] = useState(null);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [editScores, setEditScores] = useState({});

  useEffect(() => {
    if (editingEvaluation) {
      setEditScores(editingEvaluation.scores || {});
    } else {
      setEditScores({});
    }
  }, [editingEvaluation]);

  const [showQuickGrade, setShowQuickGrade] = useState(false);
  const [quickGrade, setQuickGrade] = useState({
    activityName: '', date: new Date().toISOString().split('T')[0], competencyId: ''
  });

  const [quickGradeSaving, setQuickGradeSaving] = useState(false);
  const [quickGradeMsg, setQuickGradeMsg] = useState('');

  const [quickAzarOpen, setQuickAzarOpen] = useState(false);
  const [quickAzarSpinning, setQuickAzarSpinning] = useState(false);
  const [quickAzarDeg, setQuickAzarDeg] = useState(0);
  const [quickAzarWinner, setQuickAzarWinner] = useState(null);
  const [quickAzarStudents, setQuickAzarStudents] = useState([]);
  const [quickAzarPicked, setQuickAzarPicked] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('edu_azar_picked') || '{}');
      if (stored.ts && Date.now() - stored.ts < 90 * 60 * 1000) return new Set(stored.ids || []);
    } catch {}
    return new Set();
  });
  const [quickAzarHighlighted, setQuickAzarHighlighted] = useState(null);
  const [quickAzarTotal, setQuickAzarTotal] = useState(0);
  const prevClassRef = useRef('');
  const WHEEL_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6','#e11d48','#0891b2'];

  // Instruments added on-the-fly per competency via the "+" button
  const [extraInstruments, setExtraInstruments] = useState({}); // { [compId]: [ { instrument, activityName?, ... } ] }
  const [instrumentPickerOpen, setInstrumentPickerOpen] = useState(false); // compId | null
  const [pickerCompetencyId, setPickerCompetencyId] = useState(null);
  const [renamingColumn, setRenamingColumn] = useState(null); // { competencyId, instrumentId, name } | null

  // Reset del ciclo solo al CAMBIAR de clase (no en el montaje, para que persista con localStorage)
  useEffect(() => {
    if (prevClassRef.current && prevClassRef.current !== selectedClass) {
      setQuickAzarPicked(new Set());
      localStorage.removeItem('edu_azar_picked');
    }
    prevClassRef.current = selectedClass;
  }, [selectedClass]);
  useEffect(() => { try { localStorage.setItem('edu_azar_picked', JSON.stringify({ ids: [...quickAzarPicked], ts: Date.now() })); } catch {} }, [quickAzarPicked]);

  // Función para obtener la posición del tooltip en hover
  const handleMouseEnterCell = (e, evaluations) => {
    if (evaluations.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredEval({
        evaluation: evaluations[0],
        position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      });
    }
  };

  const handleMouseLeaveCell = () => {
    setHoveredEval(null);
  };

  // Estadísticas para los widgets
  const gradeStats = useMemo(() => {
    if (!selectedClass || !selectedSubjectId) return null;
    
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    let total = 0;
    
    filteredStudents.forEach(student => {
      currentSubject?.competencies?.forEach(comp => {
        const ev = instrumentEvaluations.find(e => {
          if (e.period !== selectedPeriod || e.competencyId !== comp.id) return false;
          return e.studentId === student.id || e.student_id === student.id || e.student_name === student.name;
        });
        if (ev && counts[ev.qualitative] !== undefined) {
          counts[ev.qualitative]++;
          total++;
        }
      });
    });

    const adRate = total > 0 ? Math.round((counts.AD / total) * 100) : 0;
    const successRate = total > 0 ? Math.round(((counts.AD + counts.A) / total) * 100) : 0;

    return {
      counts,
      total,
      adRate,
      successRate,
      totalStudents: filteredStudents.length,
      evaluatedStudents: new Set(
        instrumentEvaluations
          .filter(e => e.period === selectedPeriod && filteredStudents.some(s => s.id === e.studentId))
          .map(e => e.studentId)
      ).size
    };
  }, [selectedClass, selectedSubjectId, selectedPeriod, filteredStudents, currentSubject, instrumentEvaluations]);

  return (
    <div className="animate-fade-in">
      {/* Barra de herramientas */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ marginRight: 'auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Calificaciones</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Visualiza las evaluaciones por estudiante</p>
        </div>
        <select
          value={selectedClass}
          onChange={e => { setSelectedClass(e.target.value); setSelectedSubjectId(''); }}
          style={selectPillStyle}
          aria-label="Sección"
        >
          <option value="">Seleccionar sección...</option>
          {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div style={{
          display: 'flex',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          overflow: 'hidden'
        }} aria-label="Bimestre">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(String(p))}
              style={{
                padding: '0.55rem 0.9rem',
                border: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: selectedPeriod === String(p) ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                color: selectedPeriod === String(p) ? 'var(--nav-active-fg)' : 'var(--text-secondary)'
              }}
            >
              B{p}
            </button>
          ))}
        </div>
        <select
          value={selectedSubjectId}
          onChange={e => setSelectedSubjectId(e.target.value)}
          disabled={!selectedClass}
          style={{ ...selectPillStyle, opacity: selectedClass ? 1 : 0.5, cursor: selectedClass ? 'pointer' : 'not-allowed' }}
          aria-label="Área Curricular"
        >
          <option value="">Seleccionar materia...</option>
          {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Widgets de estadísticas */}
      {selectedClass && selectedSubjectId && gradeStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Evaluaciones', value: gradeStats.total, color: '#1967d2', bg: '#e8f0fe', Icon: ClipboardCheck },
            { label: 'Alumnos Evaluados', value: gradeStats.evaluatedStudents, color: '#188038', bg: '#e6f4ea', Icon: Users },
            { label: 'Tasa de Éxito', value: `${gradeStats.successRate}%`, color: '#b06000', bg: '#fef7e0', Icon: TrendingUp },
            { label: 'Nivel AD', value: `${gradeStats.adRate}%`, color: '#7627bb', bg: '#f3e8fd', Icon: Trophy }
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} style={{
              background: 'var(--bg-color-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!selectedClass && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#e8f0fe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <GraduationCap size={30} color="#1a73e8" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Bienvenido al módulo de calificaciones
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona una sección para comenzar a visualizar las calificaciones de tus estudiantes
          </p>
        </div>
      )}

      {selectedClass && !selectedSubjectId && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fef7e0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <BookOpen size={30} color="#b06000" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Selecciona una materia
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '400px', margin: '0 auto' }}>
            Elige el área curricular para ver las competencias y evaluaciones disponibles
          </p>
        </div>
      )}

      {/* Main table */}
      {selectedClass && selectedSubjectId && currentSubject && (
        <>
          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: '#e8f0fe',
            borderRadius: '12px', padding: '0.9rem 1.25rem', marginBottom: '1.5rem',
            fontSize: '0.9rem', color: 'var(--text-primary)'
          }}>
            <Info size={20} color="#1967d2" />
            <span>Cada columna representa un instrumento aplicado. <strong style={{ color: '#1967d2' }}>Haz clic en la nota</strong> para ver el detalle.</span>
          </div>

          {/* Botón de calificación rápida */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
            <button onClick={() => {
              const all = [...filteredStudents];
              if (all.length === 0) return;
              setQuickAzarTotal(all.length);
              // Filter out already picked students for fair cycle
              let unpicked = all.filter(s => !quickAzarPicked.has(s.id));
              if (unpicked.length === 0) {
                // All picked - reset cycle
                setQuickAzarPicked(new Set());
                unpicked = [...all];
              }
              // La ruleta solo muestra los estudiantes que faltan por sortear
              setQuickAzarStudents(unpicked);
              const winner = unpicked[Math.floor(Math.random() * unpicked.length)];
              const n = unpicked.length;
              const idx = unpicked.findIndex(s => s.id === winner.id);
              const seg = 360 / n;
              const target = 360 * 5 + (360 - idx * seg - seg / 2);
              setQuickAzarWinner(winner);
              setQuickAzarDeg(0);
              setQuickAzarSpinning(false);
              setQuickAzarOpen(true);
              setTimeout(() => setQuickAzarSpinning(true), 10);
              setTimeout(() => setQuickAzarDeg(target), 100);
              setTimeout(() => {
                setQuickAzarSpinning(false);
                setQuickAzarPicked(prev => new Set([...prev, winner.id]));
                setQuickAzarHighlighted(winner.id);
              }, 4050);
            }} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: '20px',
              background: 'var(--bg-color-surface)',
              color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer'
            }}>
              🎲 Azar
            </button>
            <button onClick={() => { setQuickGrade({ activityName: '', date: new Date().toISOString().split('T')[0], competencyId: currentSubject?.competencies?.[0]?.id || '' }); setQuickGradeMsg(''); setShowQuickGrade(true); }} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.25rem', border: 'none', borderRadius: '20px',
              background: '#1a73e8',
              color: 'white', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer'
            }}>
              <Plus size={18} /> Calificación Rápida
            </button>
          </div>

          {/* Obtener todas las evaluaciones agrupadas por estudiante y competencia */}
          {(() => {
            const getInstrumentsForCompetency = (competencyId) => {
              // Solo obtener evaluaciones de estudiantes de la clase seleccionada
              const studentIds = new Set(filteredStudents.map(s => s.id));
              const evs = instrumentEvaluations.filter(
                ev => (ev.competencyId === competencyId || ev.competency_id === competencyId) && 
                      ev.period === selectedPeriod &&
                      studentIds.has(ev.studentId)
              );
              
              const uniqueInstruments = {};
              evs.forEach(ev => {
                const key = ev.activityName || ev.instrumentId;
                if (!uniqueInstruments[key]) {
                  const originalInstr = instruments.find(i => i.id === ev.instrumentId);
                  uniqueInstruments[key] = {
                    id: key,
                    instrumentId: ev.instrumentId,
                    title: ev.activityName || originalInstr?.title || 'Sin título',
                    instrumentType: ev.instrumentType,
                    criteria: ev.criteria || originalInstr?.criteria || [],
                    subjectId: ev.subjectId,
                    subjectName: ev.subjectName,
                    competencyId: ev.competencyId,
                    competencyName: ev.competencyName,
                    period: ev.period,
                    classId: ev.classId,
                    activityName: ev.activityName,
                    createdAt: ev.createdAt || originalInstr?.createdAt,
                  };
                }
              });
              return Object.values(uniqueInstruments).sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
              });
            };

            const compTints = [
              ['#e6f4ea', '#188038'],
              ['#e8f0fe', '#1967d2'],
              ['#fef7e0', '#b06000'],
              ['#fce8e6', '#c5221f'],
              ['#f3e8fd', '#7627bb'],
              ['#e4f7fb', '#007b83']
            ];

            return (
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div className="table-container" style={{ borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ tableLayout: 'auto', minWidth: '600px', borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{
                        width: '50px',
                        minWidth: '50px',
                        background: 'var(--surface-muted)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        borderRight: '2px solid var(--border-color)',
                        textAlign: 'center'
                      }}>
                        N°
                      </th>
                      <th style={{
                        minWidth: '150px',
                        background: 'var(--surface-muted)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        borderRight: '2px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Estudiante
                        </div>
                      </th>
                      {currentSubject.competencies.map((comp, idx) => {
                        const existingInstruments = getInstrumentsForCompetency(comp.id);
                        const extra = extraInstruments[comp.id] || [];
                        const existingKeys = new Set(existingInstruments.map(i => i.id));
                        const dedupedExtra = extra.filter(e => !existingKeys.has(e.activityName || e.id));
                        const totalCols = (existingInstruments.length || 0) + dedupedExtra.length + 1;
                        const [tintBg, tintFg] = compTints[idx % compTints.length];
                        return (
                          <th key={comp.id} colSpan={totalCols} style={{
                            textAlign: 'center',
                            minWidth: Math.max(totalCols * 70, 70),
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: tintBg,
                            color: tintFg,
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid var(--border-color)',
                            borderRight: '2px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <Target size={13} />
                              {comp.name}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      <th style={{
                        width: '50px',
                        minWidth: '50px',
                        background: 'var(--surface-muted)',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        borderRight: '2px solid var(--border-color)',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>#</span>
                      </th>
                      <th style={{
                        minWidth: '150px',
                        background: 'var(--surface-muted)',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        borderRight: '2px solid var(--border-color)'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Instrumentos aplicados</span>
                      </th>
                      {currentSubject.competencies.map((comp, idx) => {
                        const existingInstruments = getInstrumentsForCompetency(comp.id);
                        const extra = extraInstruments[comp.id] || [];
                        const existingKeys = new Set(existingInstruments.map(i => i.id));
                        const dedupedExtra = extra.filter(e => !existingKeys.has(e.activityName || e.id));
                        const items = existingInstruments.length > 0
                          ? [...existingInstruments, ...dedupedExtra, { _isPlus: true }]
                          : [...dedupedExtra, { _isPlus: true }];
                        return items.map((inst, j) => {
                          if (inst._isPlus) {
                            return (
                              <th key={'plus-' + comp.id} style={{
                                textAlign: 'center', minWidth: '36px', fontSize: '0.7rem',
                                color: 'var(--text-secondary)', background: 'var(--surface-muted)',
                                padding: '0.75rem 0.25rem',
                                borderBottom: '1px solid var(--border-color)',
                                borderRight: '2px solid var(--border-color)'
                              }}>
                                <button
                                  title="Añadir instrumento"
                                  onClick={() => { setPickerCompetencyId(comp.id); setInstrumentPickerOpen(true); }}
                                  style={{
                                    background: 'var(--hover-bg)', border: 'none', borderRadius: '6px',
                                    width: '24px', height: '24px', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)',
                                    transition: 'all 0.15s'
                                  }}
                                >+</button>
                              </th>
                            );
                          }
                          const isExtra = j >= existingInstruments.length;
                          const isQuickGrade = !instruments.find(i => i.id === inst.instrumentId);
                          const canRename = isExtra || isQuickGrade;
                          const renamingKey = comp.id + '-' + (inst.id || inst.instrumentId || j);
                          const renaming = renamingColumn === renamingKey;
                          return (
                            <th key={inst.id || inst.instrumentId} style={{
                              textAlign: 'center', minWidth: '60px', fontSize: '0.7rem',
                              color: 'var(--text-secondary)', background: 'var(--surface-muted)',
                              padding: '0.75rem',
                              borderBottom: '1px solid var(--border-color)',
                              borderRight: '1px solid var(--border-color)'
                            }}>
                              {renaming ? (
                                <input
                                  type="text"
                                  defaultValue={inst.title || inst.activityName || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val && val !== (inst.title || inst.activityName || '')) {
                                      if (isExtra) {
                                        const itemIdx = j - (existingInstruments.length > 0 ? existingInstruments.length : 0);
                                        setExtraInstruments(prev => {
                                          const current = [...(prev[comp.id] || [])];
                                          if (current[itemIdx]) {
                                            current[itemIdx] = { ...current[itemIdx], title: val, activityName: val };
                                          }
                                          return { ...prev, [comp.id]: current };
                                        });
                                      } else {
                                        const oldName = inst.activityName || inst.title || '';
                                        const matching = instrumentEvaluations.filter(ev =>
                                          (ev.activityName || ev.instrumentId) === oldName && (ev.competencyId === comp.id || ev.competency_id === comp.id) && ev.period === selectedPeriod
                                        );
                                        setInstrumentEvaluations(prev =>
                                          prev.map(ev =>
                                            (ev.activityName || ev.instrumentId) === oldName && (ev.competencyId === comp.id || ev.competency_id === comp.id) && ev.period === selectedPeriod
                                              ? { ...ev, activityName: val }
                                              : ev
                                          )
                                        );
                                        matching.forEach(ev => {
                                          saveInstrumentEvaluation({ ...ev, activityName: val });
                                        });
                                      }
                                    }
                                    setRenamingColumn(null);
                                  }}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setRenamingColumn(null); e.currentTarget.blur(); } }}
                                  autoFocus
                                  style={{
                                    width: '56px', fontSize: '0.7rem', textAlign: 'center',
                                    border: '1px solid #1a73e8', borderRadius: '4px',
                                    padding: '2px', outline: 'none'
                                  }}
                                />
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative' }}>
                                  <ClipboardCheck size={12} />
                                  <div className="instrument-tooltip-wrapper" style={{ position: 'relative', cursor: 'default' }}>
                                    {(inst.title || inst.activityName || '').length > 12
                                      ? (inst.title || inst.activityName || '').substring(0, 12) + '...'
                                      : (inst.title || inst.activityName || '')}
                                    {(inst.title || inst.activityName || '').length > 12 && (
                                      <div className="instrument-tooltip" style={{
                                        display: 'none', position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                                        transform: 'translateX(-50%)', background: '#1e293b', color: '#f1f5f9',
                                        padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.72rem',
                                        whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5, textAlign: 'left',
                                        pointerEvents: 'none'
                                      }}>
                                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>{inst.title || inst.activityName}</div>
                                        {inst.createdAt && (
                                          <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                                            Creado: {new Date(inst.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                          </div>
                                        )}
                                        <div style={{
                                          position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                                          width: '10px', height: '10px', background: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.1)',
                                          borderBottom: '1px solid rgba(255,255,255,0.1)'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                  {canRename && (
                                    <>
                                      <button
                                        title="Renombrar columna"
                                        onClick={(e) => { e.stopPropagation(); setRenamingColumn(renamingKey); }}
                                        style={{
                                          position: 'absolute', top: '-4px', right: '-4px',
                                          background: 'var(--hover-bg)', border: 'none', borderRadius: '50%',
                                          width: '16px', height: '16px', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          padding: 0, lineHeight: 1
                                        }}
                                      >
                                        <Pencil size={10} color="#5f6368" />
                                      </button>
                                      <button
                                        title="Eliminar columna"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!confirm('¿Eliminar esta columna y todas sus calificaciones?')) return;
                                          if (isExtra) {
                                            const itemIdx = j - (existingInstruments.length > 0 ? existingInstruments.length : 0);
                                            const removed = (extraInstruments[comp.id] || [])[itemIdx];
                                            setExtraInstruments(prev => {
                                              const current = [...(prev[comp.id] || [])];
                                              current.splice(itemIdx, 1);
                                              return { ...prev, [comp.id]: current };
                                            });
                                            if (removed?.id) {
                                              supabase.from('instruments').delete().eq('id', removed.id).catch(e => console.warn('Error deleting extra instrument:', e));
                                            }
                                          } else {
                                            const name = inst.activityName || inst.title || '';
                                            const toDelete = instrumentEvaluations.filter(e =>
                                              (e.activityName || e.instrumentId) === name && (e.competencyId === comp.id || e.competency_id === comp.id) && e.period === selectedPeriod
                                            );
                                            setInstrumentEvaluations(prev => prev.filter(e => !toDelete.find(d => d.id === e.id)));
                                            toDelete.forEach(e => {
                                              supabase.from('instrument_evaluations').delete().eq('id', e.id).catch(() => {});
                                            });
                                          }
                                        }}
                                        style={{
                                          position: 'absolute', top: '-4px', left: '-4px',
                                          background: '#fce8e6', border: 'none', borderRadius: '50%',
                                          width: '16px', height: '16px', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          padding: 0, lineHeight: 1
                                        }}
                                      >
                                        <Trash2 size={10} color="#dc2626" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </th>);
                        });
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={100} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          No hay estudiantes matriculados en esta sección.
                        </td>
                      </tr>
                    )}
                    {filteredStudents.map((student, studentIdx) => {
                      const isHighlighted = quickAzarHighlighted === student.id;
                      return (
                      <tr key={student.id} style={isHighlighted ? { background: '#fef9c3' } : {}}>
                        <td style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary)', minWidth: '50px', borderRight: '2px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>{studentIdx + 1}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', minWidth: '150px', borderRight: '2px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>{student.name}</td>
                        {currentSubject.competencies.map(comp => {
                          const existingInstruments = getInstrumentsForCompetency(comp.id);
                          const extra = extraInstruments[comp.id] || [];
                          const existingKeys = new Set(existingInstruments.map(i => i.id));
                          const dedupedExtra = extra.filter(e => !existingKeys.has(e.activityName || e.id));
                          const items = existingInstruments.length > 0
                            ? [...existingInstruments, ...dedupedExtra, { _isPlus: true }]
                            : [...dedupedExtra, { _isPlus: true }];
                          return items.map(inst => {
                            if (inst._isPlus) {
                              return (
                                <td key={'plus-' + comp.id} style={{ textAlign: 'center', padding: '0.25rem', borderRight: '2px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                                </td>
                              );
                            }
                            const ev = instrumentEvaluations.find(e => {
                              if (e.period !== selectedPeriod || e.competencyId !== comp.id) return false;
                              const instMatch = e.instrumentId === inst.id
                                || (e.activityName || e.instrumentId) === inst.id
                                || (e.activityName || '') === (inst.activityName || inst.title || '');
                              const idMatch = e.studentId === student.id || e.student_id === student.id;
                              return instMatch && (idMatch || e.student_name === student.name);
                            });
                            if (!ev) {
                              return (
                                <td key={inst.id || inst.instrumentId}
                                  title="Sin calificación — click para evaluar"
                                  style={{ textAlign: 'center', cursor: 'pointer', padding: '0.5rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
                                  onClick={() => {
                                    setQuickAzarHighlighted(null);
                                    const newEval = {
                                      id: null,
                                      instrumentId: inst.instrumentId || inst.id,
                                      instrumentTitle: inst.title || inst.activityName || '',
                                      instrumentType: inst.instrumentType || 'checklist',
                                      criteria: inst.criteria || [],
                                      activityName: inst.activityName || inst.title || '',
                                      scores: {},
                                      score: null,
                                      maxPossible: null,
                                      qualitative: null,
                                      subjectId: selectedSubjectId,
                                      subjectName: currentSubject?.name || '',
                                      competencyId: comp.id,
                                      competencyName: comp.name,
                                      period: selectedPeriod,
                                      classId: classes.find(c => c.name === selectedClass)?.id || '',
                                      studentId: student.id,
                                      studentName: student.name,
                                      date: new Date().toISOString().split('T')[0],
                                      userId: currentUser?.id,
                                      _isNew: true,
                                    };
                                    setEditingEvaluation(newEval);
                                  }}
                                >
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '6px',
                                    border: '1.5px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '1rem',
                                    transition: 'all 0.15s'
                                  }}>+</span>
                                </td>
                              );
                            }
                            return (
                              <td key={inst.id || inst.instrumentId} style={{ textAlign: 'center', cursor: 'pointer', padding: '0.5rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
                                onMouseEnter={(e) => handleMouseEnterCell(e, [ev])}
                                onMouseLeave={handleMouseLeaveCell}
                                onClick={() => { setQuickAzarHighlighted(null); setViewingEvaluation(ev); setHoveredEval(null); }}
                              >
                                <span style={gradeChipStyle(ev.qualitative)}>{ev.qualitative}</span>
                              </td>
                            );
                          });
                        })}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            );
          })()}

          {/* Modal flotante de detalle del instrumento */}
          {tooltip && (
            <>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  zIndex: 999
                }}
                onClick={() => setTooltip(null)}
              />
              <div 
                style={{
                  position: 'fixed',
                  top: tooltip.position.y + tooltip.position.height + 8,
                  left: Math.min(tooltip.position.x, window.innerWidth - 670),
                  maxWidth: '650px',
                  width: '100%',
                  zIndex: 1000,
                }}
              >
                <div className="card shadow-glass animate-fade-in" style={{ 
                  maxHeight: '80vh', 
                  overflowY: 'auto' 
                }}>
                  {/* Header del modal */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1.2rem' }}>{tooltip.studentName}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {currentSubject.name} · {tooltip.compName} · Bimestre {selectedPeriod}
                      </p>
                    </div>
                    <button 
                      onClick={() => setTooltip(null)}
                      style={{ 
                        color: 'var(--text-secondary)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Contenido scrolleable */}
                  <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {tooltip.evs.map((ev) => {
                        const originalInstrument = instruments.find(i => i.id === ev.instrumentId);
                        const instrumentType = ev.instrumentType || originalInstrument?.type || 'checklist';
                        const InstrumentIcon = TYPE_ICONS[instrumentType] || ClipboardCheck;
                        const evalCriteria = (() => {
                          if (ev.criteria && Array.isArray(ev.criteria) && ev.criteria.length > 0) {
                            return ev.criteria;
                          }
                          if (typeof ev.criteria === 'string') {
                            try {
                              const parsed = JSON.parse(ev.criteria);
                              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                            } catch (e) {
                              console.warn('Error parsing criteria:', e);
                            }
                          }
                          if (originalInstrument?.criteria && Array.isArray(originalInstrument.criteria)) {
                            return originalInstrument.criteria;
                          }
                          return [];
                        })();
                        const totalCriteria = evalCriteria.length;

                        const typeColors = {
                          checklist: '#188038',
                          scale: '#1967d2',
                          rubric: '#7627bb',
                          observation: '#e37400',
                          written: '#d93025',
                          selfeval: '#c2185b',
                          portfolio: '#00796b',
                          anecdotal: '#3949ab'
                        };
                        const typeColor = typeColors[instrumentType] || 'var(--text-secondary)';

                        return (
                          <div key={ev.id} style={{ 
                            border: `2px solid ${typeColor}40`,
                            borderRadius: '14px', 
                            padding: '1rem',
                            background: `${typeColor}08`
                          }}>
                            {/* Header del instrumento */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ 
                                  background: `${typeColor}20`, 
                                  padding: '0.6rem', 
                                  borderRadius: '10px',
                                  border: `1px solid ${typeColor}40`
                                }}>
                                  <InstrumentIcon size={20} color={typeColor} />
                                </div>
                                <div>
                                  <h5 style={{ fontWeight: 700, marginBottom: '2px', fontSize: '1rem' }}>{ev.activityName || 'Sin actividad'}</h5>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ color: typeColor, fontWeight: 600 }}>{TYPE_LABELS[instrumentType] || 'Instrumento'}</span>
                                    <span style={{ margin: '0 6px' }}>·</span>
                                    {originalInstrument?.title || 'Sin título'}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={gradeChipStyle(ev.qualitative, '1rem')}>
                                  {ev.qualitative} – {GRADE_LABEL[ev.qualitative]}
                                </span>
                              </div>
                            </div>

                            {/* Criterios evaluados */}
                            {evalCriteria.length > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {evalCriteria.map((c, idx) => {
                                    const scoreValue = ev.scores?.[c.id];
                                    let displayValue = '—';
                                    let bgColor = 'transparent';
                                    let borderColor = 'var(--border-color)';

                                    if (ev.instrumentType === 'checklist') {
                                      displayValue = scoreValue ? '✅' : '❌';
                                      bgColor = scoreValue ? '#e6f4ea' : '#fce8e6';
                                      borderColor = scoreValue ? '#18803850' : '#d9302550';
                                    } else if (ev.instrumentType === 'observation') {
                                      displayValue = scoreValue === 3 ? '🟢' : scoreValue === 2 ? '🟡' : '🔴';
                                      bgColor = scoreValue === 3 ? '#e6f4ea' : scoreValue === 2 ? '#fef7e0' : '#fce8e6';
                                    } else if (typeof scoreValue === 'number') {
                                      const levelMap = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };
                                      const levelColors = { 4: '#188038', 3: '#1967d2', 2: '#b06000', 1: '#d93025' };
                                      displayValue = levelMap[scoreValue] || '—';
                                      bgColor = levelColors[scoreValue] ? `${levelColors[scoreValue]}15` : 'transparent';
                                      borderColor = levelColors[scoreValue] ? `${levelColors[scoreValue]}50` : 'var(--border-color)';
                                    }

                                    return (
                                      <div key={c.id} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '8px',
                                        background: bgColor,
                                        border: `1px solid ${borderColor}`,
                                        fontSize: '0.85rem'
                                      }}>
                                        <span style={{ fontWeight: 500, flex: 1 }}>{idx + 1}. {c.text}</span>
                                        <span style={{ fontWeight: 700, marginLeft: '0.75rem', color: 'var(--text-primary)' }}>{displayValue}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {(ev.score !== null && ev.score !== undefined) && (
                                  <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'var(--hover-bg)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Puntaje Total</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                      {ev.score} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/</span> {ev.maxPossible || totalCriteria * 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Para instrumentos sin criterios (prueba escrita, portafolio) */}
                            {evalCriteria.length === 0 && (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: 'var(--surface-muted)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Puntaje</span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                    {ev.score ?? '—'} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/</span> {ev.maxPossible ?? 20}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer del modal */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                  }}>
                    <button 
                      onClick={() => setTooltip(null)}
                      className="btn-primary"
                      style={{ padding: '0.6rem 1.5rem' }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal para ver instrumento aplicado desde calificaciones */}
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
                    <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>{viewingEvaluation.activityName || 'Sin actividad'}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Estudiante: <strong>{viewingEvaluation.studentName}</strong>
                    </p>
                  </div>
                  <button onClick={() => setViewingEvaluation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} color="var(--text-secondary)" />
                  </button>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
                  background: viewingEvaluation.qualitative === 'AD' ? '#e6f4ea' :
                             viewingEvaluation.qualitative === 'A' ? '#e8f0fe' :
                             viewingEvaluation.qualitative === 'B' ? '#fef7e0' : '#fce8e6'
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    background: viewingEvaluation.qualitative === 'AD' ? '#188038' :
                               viewingEvaluation.qualitative === 'A' ? '#1967d2' :
                               viewingEvaluation.qualitative === 'B' ? '#e37400' : '#d93025',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 500, color: 'white'
                  }}>
                    {viewingEvaluation.qualitative}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{GRADE_LABEL[viewingEvaluation.qualitative]}</div>
                    {viewingEvaluation.score !== null && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Puntaje: {viewingEvaluation.score} / {viewingEvaluation.maxPossible || 20}
                      </div>
                    )}
                  </div>
                </div>

                {viewingEvaluation.scores && Object.keys(viewingEvaluation.scores).filter(k => !k.startsWith('__')).length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      Criterios Evaluados
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Object.entries(viewingEvaluation.scores).map(([criterionId, score]) => {
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
                            padding: '0.75rem', background: 'var(--surface-muted)', borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <span style={{ flex: 1, fontSize: '0.9rem' }}>{criterion.text || criterionId}</span>
                            <span style={{
                              fontWeight: 500, marginLeft: '1rem',
                              color: viewingEvaluation.instrumentType === 'checklist'
                                ? (score ? '#188038' : '#d93025')
                                : score === 4 ? '#188038' : score === 3 ? '#1967d2' : score === 2 ? '#b06000' : '#d93025'
                            }}>
                              {scoreLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {viewingEvaluation.scores?.__note__ && (
                  <div style={{
                    padding: '1rem', background: '#e8f0fe',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#1967d2', marginBottom: '0.5rem' }}>Nota del docente:</h4>
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>{viewingEvaluation.scores.__note__}</p>
                  </div>
                )}

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.75rem', padding: '1rem', background: 'var(--surface-muted)', borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Área:</span>
                    <div style={{ fontWeight: 600 }}>{viewingEvaluation.subjectName}</div>
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

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setViewingEvaluation(null)} style={{
                    flex: 1, padding: '0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-color-surface)', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
                  }}>Cerrar</button>
                  <button onClick={() => {
                    setEditingEvaluation({ ...viewingEvaluation });
                    setViewingEvaluation(null);
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem 1rem', borderRadius: '20px', border: 'none',
                    background: '#e8f0fe', color: '#1967d2', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
                  }}>
                    ✏️ Modificar
                  </button>
                  <button onClick={() => {
                    if (confirm('¿Eliminar esta evaluación?')) {
                      deleteInstrumentEvaluation(viewingEvaluation.id);
                      setViewingEvaluation(null);
                    }
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem 1rem', borderRadius: '20px', border: 'none',
                    background: '#fce8e6', color: '#d93025', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
                  }}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Modal editor de evaluación (modificar o crear nueva) ── */}
          {editingEvaluation && (() => {
            const evType = editingEvaluation.instrumentType || 'checklist';
            const evCriteria = editingEvaluation.criteria || [];
            const isNew = editingEvaluation._isNew;
            const gradeColor = { AD: '#188038', A: '#1967d2', B: '#e37400', C: '#d93025' };
            const gradeLabel = { AD: 'Logro Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };

            const { score, max, direct } = calcScore(evType, editScores, evCriteria);
            const previewQual = direct ?? numToQualitative(score, max, evType, editScores, evCriteria);

            const handleSaveEdit = async () => {
              const { score: s, max: m, direct: d } = calcScore(evType, editScores, evCriteria);
              const qual = d ?? numToQualitative(s, m, evType, editScores, evCriteria);
              const evalData = {
                ...editingEvaluation,
                id: editingEvaluation.id || (Date.now().toString()),
                scores: { ...editScores },
                score: s,
                maxPossible: m,
                qualitative: qual,
                date: editingEvaluation.date || new Date().toISOString().split('T')[0],
              };
              delete evalData._isNew;
              await saveInstrumentEvaluation(evalData);
              setEditingEvaluation(null);
            };

            return (
              <div className="modal-overlay animate-fade-in" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                padding: '2rem 1rem', zIndex: 1001, overflowY: 'auto'
              }}>
                <div className="card shadow-glass" style={{ maxWidth: '680px', width: '100%' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                        {isNew ? '➕ Nueva Evaluación' : '✏️ Modificar Evaluación'}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {editingEvaluation.studentName} · {editingEvaluation.activityName || editingEvaluation.instrumentTitle || ''}
                      </p>
                    </div>
                    <button onClick={() => setEditingEvaluation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={24} color="var(--text-secondary)" />
                    </button>
                  </div>

                  {/* Previsualización de calificación */}
                  {previewQual && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem',
                      background: gradeColor[previewQual] + '18',
                      border: `1px solid ${gradeColor[previewQual]}40`
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: gradeColor[previewQual],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 800, color: 'white', flexShrink: 0
                      }}>{previewQual}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{gradeLabel[previewQual]}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Calificación resultante</div>
                      </div>
                    </div>
                  )}

                  {/* Criterios / controles según tipo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

                    {/* CHECKLIST */}
                    {evType === 'checklist' && evCriteria.map((c, idx) => (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.9rem' }}>{idx + 1}. {c.text}</p>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          {[{ val: true, label: '✅ Logrado', color: '#188038' }, { val: false, label: '❌ No Logrado', color: '#d93025' }].map(opt => (
                            <button key={String(opt.val)}
                              onClick={() => setEditScores(s => ({ ...s, [c.id]: opt.val }))}
                              style={{
                                flex: 1, padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                border: `2px solid ${editScores[c.id] === opt.val ? opt.color : 'var(--border-color)'}`,
                                background: editScores[c.id] === opt.val ? opt.color + '18' : 'var(--bg-color-surface)',
                                color: editScores[c.id] === opt.val ? opt.color : 'var(--text-secondary)'
                              }}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* OBSERVATION */}
                    {evType === 'observation' && evCriteria.map((c, idx) => (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.9rem' }}>{idx + 1}. {c.text}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                          {[{ v: 3, l: '🟢 Siempre', color: '#188038' }, { v: 2, l: '🟡 A veces', color: '#e37400' }, { v: 1, l: '🔴 Nunca', color: '#d93025' }].map(opt => (
                            <button key={opt.v}
                              onClick={() => setEditScores(s => ({ ...s, [c.id]: opt.v }))}
                              style={{
                                padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                border: `2px solid ${editScores[c.id] === opt.v ? opt.color : 'var(--border-color)'}`,
                                background: editScores[c.id] === opt.v ? opt.color + '18' : 'var(--bg-color-surface)',
                                color: editScores[c.id] === opt.v ? opt.color : 'var(--text-secondary)'
                              }}>{opt.l}</button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* QUALITATIVE (scale, rubric, selfeval) */}
                    {['scale', 'rubric', 'selfeval'].includes(evType) && evCriteria.map((c, idx) => (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.9rem' }}>{idx + 1}. {c.text}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                          {[{ v: 4, g: 'AD', l: 'Destacado', color: '#188038' }, { v: 3, g: 'A', l: 'Logrado', color: '#1967d2' }, { v: 2, g: 'B', l: 'En Proceso', color: '#e37400' }, { v: 1, g: 'C', l: 'En Inicio', color: '#d93025' }].map(lv => (
                            <button key={lv.v}
                              onClick={() => setEditScores(s => ({ ...s, [c.id]: lv.v }))}
                              style={{
                                padding: '0.5rem 0.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                                border: `2px solid ${editScores[c.id] === lv.v ? lv.color : 'var(--border-color)'}`,
                                background: editScores[c.id] === lv.v ? lv.color + '18' : 'var(--bg-color-surface)',
                                color: editScores[c.id] === lv.v ? lv.color : 'var(--text-secondary)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                              }}>
                              <span style={{ fontSize: '1rem' }}>{lv.g}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{lv.l}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* WRITTEN / NUMERIC */}
                    {evType === 'written' && (
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.6rem' }}>Puntaje obtenido (0 – 20)</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <input type="number" min="0" max="20"
                            style={{ width: '90px', fontSize: '2rem', textAlign: 'center', fontWeight: 700, padding: '0.5rem', borderRadius: '8px', border: '2px solid var(--border-color)' }}
                            value={editScores['__numeric__'] ?? ''}
                            onChange={e => setEditScores({ __numeric__: Math.min(20, Math.max(0, Number(e.target.value))) })}
                          />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ 20 puntos</span>
                        </div>
                      </div>
                    )}

                    {/* PORTFOLIO / ANECDOTAL / DIRECT */}
                    {['portfolio', 'anecdotal'].includes(evType) && (
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Calificación directa</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                          {['AD', 'A', 'B', 'C'].map(g => (
                            <button key={g}
                              onClick={() => setEditScores({ ...editScores, __direct__: g })}
                              style={{
                                padding: '0.75rem 0.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                                border: `2px solid ${editScores['__direct__'] === g ? gradeColor[g] : 'var(--border-color)'}`,
                                background: editScores['__direct__'] === g ? gradeColor[g] + '18' : 'var(--bg-color-surface)',
                                color: editScores['__direct__'] === g ? gradeColor[g] : 'var(--text-secondary)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                              }}>
                              <span style={{ fontSize: '1.1rem' }}>{g}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{gradeLabel[g]}</span>
                            </button>
                          ))}
                        </div>
                        {evType === 'anecdotal' && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Descripción del hecho observado</label>
                            <textarea rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical', fontSize: '0.85rem' }}
                              value={editScores['__note__'] || ''}
                              onChange={e => setEditScores(s => ({ ...s, __note__: e.target.value }))}
                              placeholder="Describe brevemente la situación observada..."
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {evCriteria.length === 0 && !['portfolio', 'anecdotal', 'written'].includes(evType) && (
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Calificación directa</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                          {['AD', 'A', 'B', 'C'].map(g => (
                            <button key={g}
                              onClick={() => {
                                const newScores = { ...editScores };
                                Object.keys(newScores).forEach(k => delete newScores[k]);
                                newScores['__direct__'] = g;
                                setEditScores(newScores);
                              }}
                              style={{
                                padding: '0.75rem 0.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                                border: `2px solid ${editScores['__direct__'] === g ? gradeColor[g] : 'var(--border-color)'}`,
                                background: editScores['__direct__'] === g ? gradeColor[g] + '18' : 'var(--bg-color-surface)',
                                color: editScores['__direct__'] === g ? gradeColor[g] : 'var(--text-secondary)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                              }}>
                              <span style={{ fontSize: '1.1rem' }}>{g}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{gradeLabel[g]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    </div>

                  {/* Footer botones */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setEditingEvaluation(null)} style={{
                      flex: 1, padding: '0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)',
                      background: 'var(--bg-color-surface)', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
                    }}>Cancelar</button>
                    <button onClick={handleSaveEdit} style={{
                      flex: 2, padding: '0.75rem', borderRadius: '20px', border: 'none',
                      background: '#1a73e8', color: 'white',
                      fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}>💾 Guardar Calificación</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Instrument picker modal */}
          {instrumentPickerOpen && pickerCompetencyId && (() => {
            const comp = currentSubject?.competencies?.find(c => c.id === pickerCompetencyId);
            const alreadyAdded = (extraInstruments[pickerCompetencyId] || []).map(i => i.instrumentId || i.id);
            const pickable = instrumentsBySubject.filter(i => !alreadyAdded.includes(i.id));
            return (
              <div className="modal-overlay animate-fade-in" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                padding: '2rem 1rem', zIndex: 1002, overflowY: 'auto'
              }}>
                <div className="card shadow-glass" style={{ maxWidth: '500px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent-primary)', marginBottom: 0 }}>Seleccionar Instrumento</h3>
                    <button onClick={() => { setInstrumentPickerOpen(false); setPickerCompetencyId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={24} color="var(--text-secondary)" />
                    </button>
                  </div>
                  {comp && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Para la competencia: <strong>{comp.name}</strong></p>}
                  {pickable.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No hay instrumentos disponibles para esta área.
                      <br /><span style={{ fontSize: '0.8rem' }}>Crea uno desde la página de Instrumentos.</span>
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                      {pickable.map(inst => (
                        <button key={inst.id} onClick={() => {
                          setExtraInstruments(prev => {
                            const current = prev[pickerCompetencyId] || [];
                            return { ...prev, [pickerCompetencyId]: [...current, {
                              id: inst.id,
                              instrumentId: inst.id,
                              title: inst.title || inst.name || '',
                              instrumentType: inst.type,
                              criteria: inst.criteria || [],
                              activityName: inst.title || inst.name || '',
                              subjectId: selectedSubjectId,
                              competencyId: pickerCompetencyId,
                              period: selectedPeriod,
                            }] };
                          });
                          setInstrumentPickerOpen(false);
                          setPickerCompetencyId(null);
                        }} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
                          padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-color-surface)', cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s'
                        }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                            {inst.title || inst.name || 'Sin título'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {inst.type || '—'} · {inst.criteria?.length || 0} criterio(s)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setInstrumentPickerOpen(false); setPickerCompetencyId(null); }}
                    style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-color-surface)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Modal de calificación rápida */}
          {showQuickGrade && (
            <div className="modal-overlay animate-fade-in" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
              padding: '2rem 1rem', zIndex: 1000, overflowY: 'auto'
            }}>
              <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: '#e6f4ea',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Plus size={20} color="#188038" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Nueva Columna</h3>
                  </div>
                  <button onClick={() => setShowQuickGrade(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                    <X size={20} color="var(--text-secondary)" />
                  </button>
                </div>

                {quickGradeMsg && (
                  <div style={{
                    padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem',
                    background: quickGradeMsg.startsWith('✓') ? '#dcfce7' : '#fef2f2',
                    color: quickGradeMsg.startsWith('✓') ? '#16a34a' : '#dc2626',
                    fontSize: '0.85rem', fontWeight: 500
                  }}>{quickGradeMsg}</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Actividad</label>
                    <input type="text" className="input-field" placeholder="Ej: Participación oral, Actividad en pizarra..." value={quickGrade.activityName}
                      onChange={e => setQuickGrade(prev => ({ ...prev, activityName: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {currentSubject?.competencies?.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Competencia <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
                      <select value={quickGrade.competencyId} onChange={e => setQuickGrade(prev => ({ ...prev, competencyId: e.target.value }))} className="input-field" style={{ width: '100%' }}>
                        <option value="">Todas las competencias</option>
                        {currentSubject.competencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Fecha</label>
                    <input type="date" className="input-field" value={quickGrade.date}
                      onChange={e => setQuickGrade(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setShowQuickGrade(false)} style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-color-surface)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                  }}>Cancelar</button>
                  <button onClick={async () => {
                    if (!quickGrade.activityName.trim()) { setQuickGradeMsg('Ingresa el nombre de la actividad'); return; }
                    setQuickGradeSaving(true);
                    setQuickGradeMsg('');
                    try {
                      const compId = quickGrade.competencyId || currentSubject?.competencies?.[0]?.id || '';
                      const newInstr = {
                        id: 'qg-' + Date.now(),
                        instrumentId: null,
                        title: quickGrade.activityName.trim(),
                        activityName: quickGrade.activityName.trim(),
                        instrumentType: 'quick_grade',
                        criteria: [],
                        competencyId: compId,
                        subjectId: currentSubject?.id || '',
                        date: quickGrade.date,
                      };
                      setExtraInstruments(prev => {
                        const current = [...(prev[compId] || [])];
                        current.push(newInstr);
                        return { ...prev, [compId]: current };
                      });
                      setQuickGradeMsg('✓ Columna creada correctamente');
                      setQuickGrade(prev => ({ ...prev, activityName: '' }));
                    } catch (err) {
                      setQuickGradeMsg('Error al crear la columna');
                      console.error(err);
                    } finally {
                      setQuickGradeSaving(false);
                    }
                  }} disabled={quickGradeSaving} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: quickGradeSaving ? 'var(--text-secondary)' : '#1a73e8',
                    color: 'white', fontWeight: 500, cursor: quickGradeSaving ? 'not-allowed' : 'pointer', fontSize: '0.85rem'
                  }}>
                    <Send size={16} /> {quickGradeSaving ? 'Creando...' : 'Crear columna'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Azar wheel overlay */}
      {quickAzarOpen && (() => {
        const azarStudents = quickAzarStudents;
        const n = azarStudents.length;
        const pickedCount = quickAzarPicked.size;
        const total = quickAzarTotal || n;
        const seg = n > 0 ? 360 / n : 360;
        const wheelSize = Math.min(window.innerWidth * 0.9, 520);
        const fontSize = n <= 8 ? '0.9rem' : n <= 15 ? '0.75rem' : n <= 25 ? '0.65rem' : '0.55rem';
        const stopped = !quickAzarSpinning && quickAzarWinner;
        return (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '2rem', overflow: 'auto'
        }} onClick={() => { if (!quickAzarSpinning) setQuickAzarOpen(false); }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '-10px', left: '50%',
                transform: 'translateX(-50%)', zIndex: 10,
                width: 0, height: 0,
                  borderLeft: '18px solid transparent', borderRight: '18px solid transparent',
                  borderTop: '32px solid #e37400',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
              <div style={{
                width: wheelSize, height: wheelSize, borderRadius: '50%',
                position: 'relative', overflow: 'hidden',
                transform: `rotate(${quickAzarDeg}deg)`,
                transition: quickAzarSpinning ? `transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
                background: n > 0 ? `conic-gradient(${azarStudents.map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(', ')})` : 'var(--surface-muted)',
                boxShadow: '0 0 0 4px var(--border-color)'
              }}>
                {azarStudents.map((s, i) => {
                  const mid = i * seg + seg / 2;
                  return (
                    <div key={s.id} style={{
                      position: 'absolute', left: '50%', top: '50%',
                      width: `${wheelSize / 2 - 50}px`, height: '24px',
                      marginTop: '-12px',
                      transform: `rotate(${mid - 90}deg) translate(40px)`,
                      transformOrigin: 'left center',
                      fontSize, fontWeight: 500, color: 'white',
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      pointerEvents: 'none', display: 'flex', alignItems: 'center', textAlign: 'left'
                    }}>{s.name}</div>
                  );
                })}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: '90px', height: '90px', borderRadius: '50%',
                  background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)', zIndex: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>🎯</div>
              </div>
            </div>
            {quickAzarSpinning && (
              <div style={{ color: '#e37400', fontSize: '1.1rem', marginTop: '1.5rem', fontWeight: 500, letterSpacing: '0.05em' }}>SORTEANDO...</div>
            )}
            {stopped && (
              <div style={{
                marginTop: '1.5rem', background: 'var(--bg-color-surface)', borderRadius: '16px',
                padding: '1.2rem 2.5rem', textAlign: 'center',
                animation: 'bounceIn 0.5s ease',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>🎉</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-primary)' }}>{quickAzarWinner.name}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>¡Seleccionado!</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{pickedCount}/{total} alumnos sorteados</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setQuickAzarOpen(false)} className="btn-primary" style={{
                    padding: '0.6rem 1.5rem', borderRadius: '20px',
                    fontSize: '0.85rem'
                  }}>OK</button>
                  {pickedCount >= total && (
                    <button onClick={() => { setQuickAzarPicked(new Set()); setQuickAzarOpen(false); }} style={{
                      padding: '0.6rem 1.5rem', borderRadius: '20px',
                      border: '1px solid var(--border-color)', background: 'var(--bg-color-surface)',
                      color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
                    }}>Reiniciar ciclo</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>);
      })()}

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

    </div>
  );
}
