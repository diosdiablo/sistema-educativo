import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LogOut, GraduationCap, CalendarCheck, ChevronDown, BookOpen, Target, ArrowLeft, User } from 'lucide-react';

const PERIODS = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { students, grades, attendance, subjects, classes } = useStore();
  const parentDni = sessionStorage.getItem('edu_parent_dni');
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [view, setView] = useState('grades');
  const [selectedPeriod, setSelectedPeriod] = useState(0);

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
      const recs = typeof a.records === 'string' ? JSON.parse(a.records) : (a.records || []);
      const record = recs.find(r => r.studentId === currentChild.id);
      if (record) records.push({ date: a.date, status: record.status });
    });
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, currentChild]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#64748b' }}>No se encontraron hijos con este DNI</h2>
          <button onClick={() => navigate('/parent')} style={{
            marginTop: '1rem', padding: '0.75rem 1.5rem', border: 'none',
            borderRadius: '12px', background: '#10b981', color: 'white',
            fontWeight: 600, cursor: 'pointer'
          }}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
        padding: '1.25rem 1.5rem', color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Portal para Padres</h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '2px 0 0' }}>DNI: {parentDni}</p>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600
          }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Student selector */}
        {children.length > 1 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Seleccionar hijo:
            </label>
            <select value={selectedStudentIdx} onChange={e => setSelectedStudentIdx(Number(e.target.value))} style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
              border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white',
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
              background: 'white', borderRadius: '16px', padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.3rem'
                }}>{currentChild.name?.charAt(0)?.toUpperCase() || '?'}</div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{currentChild.name}</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                    {getStudentClass(currentChild)?.name || 'Sin sección'} | {currentChild.gradeLevel || currentChild.grade || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setView('grades')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '12px', border: 'none', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: view === 'grades' ? '#10b981' : '#e2e8f0',
                color: view === 'grades' ? 'white' : '#64748b'
              }}>
                <GraduationCap size={18} /> Notas
              </button>
              <button onClick={() => setView('attendance')} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '12px', border: 'none', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: view === 'attendance' ? '#10b981' : '#e2e8f0',
                color: view === 'attendance' ? 'white' : '#64748b'
              }}>
                <CalendarCheck size={18} /> Asistencia
              </button>
            </div>

            {/* Period selector for grades */}
            {view === 'grades' && (
              <div style={{ marginBottom: '1rem' }}>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))} style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                  border: '1px solid #e2e8f0', fontSize: '0.9rem', background: 'white',
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
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No hay notas registradas para este período</p>
                  </div>
                ) : (
                  subjectsWithGrades.map(({ subject, grades: sg }) => (
                    <div key={subject.id || subject.name} style={{
                      background: 'white', borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      marginBottom: '1rem', overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white', fontWeight: 700, fontSize: '0.9rem'
                      }}>
                        <BookOpen size={14} style={{ marginRight: '0.5rem' }} />
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
                              padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9'
                            }}>
                              <div style={{ fontSize: '0.85rem', color: '#475569', flex: 1 }}>
                                <Target size={12} style={{ marginRight: '0.25rem', color: '#94a3b8' }} />
                                {comp?.name || g.competencyId || 'Competencia'}
                              </div>
                              <div style={{
                                fontWeight: 700, fontSize: '1rem',
                                color: qual === 'AD' ? '#10b981' : qual === 'A' ? '#3b82f6' : qual === 'B' ? '#f59e0b' : '#ef4444',
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

            {/* Attendance view */}
            {view === 'attendance' && (
              <div>
                {childAttendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <CalendarCheck size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No hay registros de asistencia</p>
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9',
                      background: '#fafbfc', fontWeight: 700, fontSize: '0.9rem',
                      color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <CalendarCheck size={16} /> Registro de Asistencia
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {childAttendance.map((a, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.65rem 1rem', borderBottom: '1px solid #f8fafc'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                            {new Date(a.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
                            fontWeight: 600,
                            background: a.status === 'presente' ? '#dcfce7' : a.status === 'tardanza' ? '#fef9c3' : '#fee2e2',
                            color: a.status === 'presente' ? '#16a34a' : a.status === 'tardanza' ? '#ca8a04' : '#dc2626'
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