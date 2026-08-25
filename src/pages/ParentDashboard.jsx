import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LogOut, GraduationCap, CalendarCheck, ChevronDown, BookOpen, Target, ArrowLeft, User, ThumbsUp, ThumbsDown } from 'lucide-react';

const PERIODS = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { students, grades, attendance, subjects, classes, behavior, periodDates } = useStore();
  const parentDni = sessionStorage.getItem('edu_parent_dni');
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [view, setView] = useState('grades');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date().toISOString().split('T')[0];
    for (const [id, { start, end }] of Object.entries(periodDates)) {
      if (now >= start && now <= end) return Number(id) - 1;
    }
    return 0;
  });

  const children = useMemo(() => {
    if (!parentDni) return [];
    return students.filter(s => (s.guardianDni || s.guardian_dni) === parentDni);
  }, [students, parentDni]);

  const currentChild = children[selectedStudentIdx];

  const childGrades = useMemo(() => {
    if (!currentChild) return [];
    return grades.filter(g => g.studentId === currentChild.id);
  }, [grades, currentChild]);

  const childAttendance = useMemo(() => {
    if (!currentChild) return [];
    const records = [];
    attendance.forEach(a => {
      let recs = a.records;
      if (typeof recs === 'string') try { recs = JSON.parse(recs); } catch { recs = []; }
      if (!Array.isArray(recs)) recs = [];
      const record = recs.find(r => r.studentId === currentChild.id);
      if (record) records.push({ date: a.date, status: record.status });
    });
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, currentChild]);

  const childBehavior = useMemo(() => {
    if (!currentChild) return [];
    return behavior.filter(r => r.studentId === currentChild.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [behavior, currentChild]);

  const subjectsWithGrades = useMemo(() => {
    const periodGrades = childGrades.filter(g => g.period === PERIODS[selectedPeriod]);
    const subjectIds = [...new Set(periodGrades.map(g => g.subject))];
    return subjectIds.map(sid => {
      const subject = subjects.find(s => s.id === sid || s.name === sid);
      const subjectGrades = periodGrades.filter(g => g.subject === sid);
      return { subject: subject || { name: sid }, grades: subjectGrades };
    });
  }, [childGrades, selectedPeriod, subjects]);

  const getStudentClass = (student) => {
    return classes.find(c => c.id === student.classId || c.id === student.class_id);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('edu_parent_dni');
    navigate('/parent');
  };

  if (!parentDni || children.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--surface-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-secondary)' }}>No se encontraron hijos con este DNI</h2>
          <button onClick={() => navigate('/parent')} className="btn-primary" style={{
            marginTop: '1rem', padding: '0.55rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem'
          }}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-muted)', paddingBottom: '2rem' }}>
      {/* Encabezado */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Portal para Padres</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>DNI: {parentDni}</p>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
            padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 500
          }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Student selector */}
        {children.length > 1 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Seleccionar hijo:
            </label>
            <select value={selectedStudentIdx} onChange={e => setSelectedStudentIdx(Number(e.target.value))} style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
              border: '1px solid var(--border-color)', fontSize: '0.95rem', background: 'var(--bg-color-surface)',
              cursor: 'pointer'
            }}>
              {children.map((c, i) => (
                <option key={c.id} value={i}>{c.name} - {getStudentClass(c)?.name || 'Sin sección'}</option>
              ))}
            </select>
          </div>
        )}

        {currentChild && (
          <>
            {/* Student info card */}
            <div style={{
              background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid var(--border-color)', marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--nav-active-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--nav-active-fg)', fontWeight: 500, fontSize: '1.2rem'
                }}>{currentChild.name?.charAt(0)?.toUpperCase() || '?'}</div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>{currentChild.name}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {getStudentClass(currentChild)?.name || 'Sin sección'} | {currentChild.gradeLevel || currentChild.grade || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setView('grades')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem', borderRadius: '20px',
                border: view === 'grades' ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                background: view === 'grades' ? 'var(--nav-active-bg)' : 'transparent',
                color: view === 'grades' ? 'var(--nav-active-fg)' : 'var(--text-secondary)'
              }}>
                <GraduationCap size={18} /> Notas
              </button>
              <button onClick={() => setView('attendance')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem', borderRadius: '20px',
                border: view === 'attendance' ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                background: view === 'attendance' ? 'var(--nav-active-bg)' : 'transparent',
                color: view === 'attendance' ? 'var(--nav-active-fg)' : 'var(--text-secondary)'
              }}>
                <CalendarCheck size={18} /> Asistencia
              </button>
              <button onClick={() => setView('behavior')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem', borderRadius: '20px',
                border: view === 'behavior' ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                background: view === 'behavior' ? 'var(--nav-active-bg)' : 'transparent',
                color: view === 'behavior' ? 'var(--nav-active-fg)' : 'var(--text-secondary)'
              }}>
                <ThumbsUp size={18} /> Conducta
              </button>
            </div>

            {/* Period selector for grades */}
            {view === 'grades' && (
              <div style={{ marginBottom: '1rem' }}>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))} style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                  border: '1px solid var(--border-color)', fontSize: '0.9rem', background: 'var(--bg-color-surface)',
                  cursor: 'pointer'
                }}>
                  {PERIODS.map((p, i) => <option key={i} value={i}>{p}</option>)}
                </select>
              </div>
            )}

            {/* Grades view */}
            {view === 'grades' && (
              <div>
                {subjectsWithGrades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No hay notas registradas para este período</p>
                  </div>
                ) : (
                  subjectsWithGrades.map(({ subject, grades: sg }) => (
                    <div key={subject.id || subject.name} style={{
                      background: 'var(--bg-color-surface)', borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      marginBottom: '1rem', overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-muted)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center'
                      }}>
                        <BookOpen size={15} style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }} />
                        {subject.name}
                      </div>
                      <div style={{ padding: '0.75rem 1rem' }}>
                        {sg.map(g => {
                          const comp = subject.competencies?.find(c => c.id === g.competencyId);
                          const qual = g.score !== undefined ? (
                            g.score >= 90 ? 'AD' : g.score >= 75 ? 'A' : g.score >= 60 ? 'B' : 'C'
                          ) : '-';
                          return (
                            <div key={g.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.5rem 0', borderBottom: '1px solid var(--surface-muted)'
                            }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1 }}>
                                <Target size={12} style={{ marginRight: '0.25rem', color: 'var(--text-secondary)' }} />
                                {comp?.name || g.competencyId || 'Competencia'}
                              </div>
                              <div style={{
                                fontWeight: 500, fontSize: '1rem',
                                color: qual === 'AD' ? '#188038' : qual === 'A' ? '#1a73e8' : qual === 'B' ? '#e37400' : '#d93025',
                                minWidth: '40px', textAlign: 'right'
                              }}>
                                {g.score !== undefined ? `${g.score} (${qual})` : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Behavior view */}
            {view === 'behavior' && (
              <div>
                {childBehavior.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <ThumbsUp size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No hay registros de conducta</p>
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                      background: 'var(--surface-muted)', fontWeight: 500, fontSize: '0.9rem',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <ThumbsUp size={16} /> Registro de Conducta
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {childBehavior.map((r, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.65rem 1rem', borderBottom: '1px solid var(--surface-muted)'
                        }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: r.type === 'positive' ? '#18803815' : 'var(--danger-tint-bg)'
                          }}>
                            {r.type === 'positive' ? <ThumbsUp size={16} color="#188038" /> : <ThumbsDown size={16} color="var(--danger-tint-fg)" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.description}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {new Date(r.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                            background: r.type === 'positive' ? '#18803815' : 'var(--danger-tint-bg)',
                            color: r.type === 'positive' ? '#188038' : 'var(--danger-tint-fg)'
                          }}>
                            {r.type === 'positive' ? 'Positivo' : 'Negativo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attendance view */}
            {view === 'attendance' && (
              <div>
                {childAttendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <CalendarCheck size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No hay registros de asistencia</p>
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                      background: 'var(--surface-muted)', fontWeight: 500, fontSize: '0.9rem',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <CalendarCheck size={16} /> Registro de Asistencia
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {childAttendance.map((a, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.65rem 1rem', borderBottom: '1px solid var(--surface-muted)'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(a.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
                            fontWeight: 500,
                            background: a.status === 'presente' ? '#18803815' : a.status === 'tardanza' ? '#e3740015' : a.status === 'justificado' ? '#007b8315' : 'var(--danger-tint-bg)',
                            color: a.status === 'presente' ? '#188038' : a.status === 'tardanza' ? '#e37400' : a.status === 'justificado' ? '#007b83' : 'var(--danger-tint-fg)'
                          }}>
                            {a.status === 'presente' ? 'Presente' : a.status === 'tardanza' ? 'Tardanza' : a.status === 'justificado' ? 'Justificado' : 'Falta'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}