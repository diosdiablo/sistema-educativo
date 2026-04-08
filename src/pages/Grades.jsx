import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Info, ClipboardCheck, FileText, CheckSquare, BarChart2, Eye, BookOpen, MessageSquare, Star, Grid, X, Calendar } from 'lucide-react';

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
const numToQualitative = (score, max) => {
  if (!max || max === 0) return 'C';
  const pct = (score / max) * 100;
  if (pct >= 87.5) return 'AD';
  if (pct >= 62.5) return 'A';
  if (pct >= 37.5) return 'B';
  return 'C';
};
const GRADE_LABEL = { AD: 'Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };
const BADGE_THEME = { AD: 'badge-ad', A: 'badge-a', B: 'badge-b', C: 'badge-c' };

export default function Grades() {
  const { students, subjects, classes, instrumentEvaluations, instruments, currentUser, isAdmin } = useStore();

  const availableClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (!currentUser?.assignments) return [];
    const classIds = [...new Set(currentUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [isAdmin, currentUser, classes]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1');
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
    return students.filter(s => s.gradeLevel === selectedClass);
  }, [students, selectedClass]);

  /**
   * For a given student + competency, pull all instrument evaluations
   * that match: studentId, competencyId, period.
   * Returns { grade: 'AD'|'A'|'B'|'C'|null, count, evaluations[] }
   */
  const getCompetencyAverage = (studentId, competencyId) => {
    const evs = instrumentEvaluations.filter(
      ev =>
        ev.studentId === studentId &&
        ev.competencyId === competencyId &&
        ev.period === selectedPeriod
    );
    if (evs.length === 0) return { grade: null, count: 0, evaluations: [] };

    const nums = evs.map(ev => {
      if (ev.qualitative && GRADE_TO_NUM[ev.qualitative]) return GRADE_TO_NUM[ev.qualitative];
      if (ev.score !== null && ev.score !== undefined) {
        const numGrade = numToQualitative(ev.score, ev.maxPossible || 20);
        return GRADE_TO_NUM[numGrade] || 0;
      }
      return 0;
    }).filter(n => n > 0);
    
    if (nums.length === 0) return { grade: null, count: evs.length, evaluations: evs };

    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { grade: NUM_TO_GRADE(avg), count: evs.length, evaluations: evs };
  };

  const [tooltip, setTooltip] = useState(null);
  const [viewingEvaluation, setViewingEvaluation] = useState(null); // { studentId, competencyId, evs, position: { x, y } }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h2 className="page-title">Calificaciones</h2>
          <p className="page-subtitle">Promedio por competencia calculado desde los instrumentos aplicados</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            style={{ minWidth: '200px' }}
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubjectId(''); }}
          >
            <option value="">-- Selecciona una Sección --</option>
            {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            <option value="1">Bimestre 1</option>
            <option value="2">Bimestre 2</option>
            <option value="3">Bimestre 3</option>
            <option value="4">Bimestre 4</option>
          </select>

          <select
            className="input-field"
            style={{ minWidth: '180px' }}
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">-- Selecciona Materia --</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Empty states */}
      {!selectedClass && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '16px', marginTop: '2rem' }}>
          Selecciona una sección para ver las calificaciones.
        </div>
      )}

      {selectedClass && !selectedSubjectId && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '16px', marginTop: '2rem' }}>
          Selecciona una materia para ver las competencias.
        </div>
      )}

      {/* Main table */}
      {selectedClass && selectedSubjectId && currentSubject && (
        <>
          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', marginTop: '1.5rem',
            fontSize: '0.85rem', color: 'var(--text-secondary)'
          }}>
            <Info size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
            El promedio se calcula automáticamente con todos los instrumentos aplicados a cada competencia en el bimestre seleccionado.
            Haz clic en cualquier celda para ver el detalle de evaluaciones.
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="styled-table" style={{ tableLayout: 'auto', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Estudiante</th>
                  {currentSubject.competencies.map(comp => (
                    <th key={comp.id} style={{ textAlign: 'center', minWidth: '140px', fontSize: '0.78rem' }}>
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={currentSubject.competencies.length + 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No hay estudiantes matriculados en esta sección.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      {currentSubject.competencies.map(comp => {
                        const { grade, count, evaluations } = getCompetencyAverage(student.id, comp.id);
                        return (
                          <td
                            key={comp.id}
                            style={{ textAlign: 'center', cursor: count > 0 ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (count > 0 && evaluations.length > 0) {
                                setViewingEvaluation(evaluations[0]);
                              }
                            }}
                            title={count > 0 ? `${count} instrumento(s) aplicado(s)` : 'Sin evaluaciones aún'}
                          >
                            {grade ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span className={`badge ${BADGE_THEME[grade]}`} style={{ fontWeight: 700 }}>
                                  {grade}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                  {GRADE_LABEL[grade]} · {count} ev.
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                  alignItems: 'flex-start',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 100%)'
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
                        checklist: '#10b981',
                        scale: '#3b82f6',
                        rubric: '#8b5cf6',
                        observation: '#f59e0b',
                        written: '#ef4444',
                        selfeval: '#ec4899',
                        portfolio: '#14b8a6',
                        anecdotal: '#6366f1'
                      };
                      const typeColor = typeColors[instrumentType] || '#6366f1';

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={14} />
                                {new Date(ev.date).toLocaleDateString('es-PE')}
                              </div>
                              <span className={`badge ${BADGE_THEME[ev.qualitative]}`} style={{ fontWeight: 700, fontSize: '1.1rem', padding: '0.4rem 0.9rem' }}>
                                {ev.qualitative || ev.score || '—'}
                              </span>
                            </div>
                          </div>

                          {/* Criterios evaluados */}
                          {evalCriteria.length > 0 && (
                            <div style={{ 
                              borderTop: `1px solid ${typeColor}30`, 
                              paddingTop: '1rem',
                              marginTop: '0.5rem'
                            }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Detalle de la Evaluación
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {evalCriteria.map((c, idx) => {
                                  const scoreValue = ev.scores?.[c.id];
                                  let displayValue = '—';
                                  let bgColor = 'transparent';
                                  let borderColor = 'var(--border-color)';

                                  if (instrumentType === 'checklist') {
                                    displayValue = scoreValue === true ? '✅ Logrado' : scoreValue === false ? '❌ No Logrado' : '—';
                                    bgColor = scoreValue === true ? 'rgba(16,185,129,0.15)' : scoreValue === false ? 'rgba(239,68,68,0.15)' : 'transparent';
                                    borderColor = scoreValue === true ? '#10b98160' : scoreValue === false ? '#ef444460' : 'var(--border-color)';
                                  } else if (instrumentType === 'observation') {
                                    const freqMap = { 3: '🟢 Siempre', 2: '🟡 A veces', 1: '🔴 Nunca' };
                                    const bgMaps = { 3: 'rgba(16,185,129,0.15)', 2: 'rgba(245,158,11,0.15)', 1: 'rgba(239,68,68,0.15)' };
                                    displayValue = freqMap[scoreValue] || '—';
                                    bgColor = bgMaps[scoreValue] || 'transparent';
                                    borderColor = scoreValue === 3 ? '#10b98160' : scoreValue === 2 ? '#f59e0b60' : scoreValue === 1 ? '#ef444460' : 'var(--border-color)';
                                  } else if (typeof scoreValue === 'number') {
                                    const levelMap = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };
                                    const levelColors = { 4: '#10b981', 3: '#3b82f6', 2: '#f59e0b', 1: '#ef4444' };
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
                                  background: 'rgba(0,0,0,0.2)',
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
                              background: 'rgba(0,0,0,0.15)'
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
                    {viewingEvaluation.score !== null && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Puntaje: {viewingEvaluation.score} / {viewingEvaluation.maxPossible || 20}
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
        </>
      )}
    </div>
  );
}
