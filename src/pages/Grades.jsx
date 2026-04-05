import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Info } from 'lucide-react';

// Map AD/A/B/C -> numeric value for averaging, then back
const GRADE_TO_NUM = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
const NUM_TO_GRADE = (n) => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};
const GRADE_LABEL = { AD: 'Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };
const BADGE_THEME = { AD: 'badge-ad', A: 'badge-a', B: 'badge-b', C: 'badge-c' };

export default function Grades() {
  const { students, subjects, classes, instrumentEvaluations, currentUser, isAdmin } = useStore();

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

    const nums = evs.map(ev => GRADE_TO_NUM[ev.qualitative] ?? 0).filter(n => n > 0);
    if (nums.length === 0) return { grade: null, count: 0, evaluations: evs };

    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { grade: NUM_TO_GRADE(avg), count: evs.length, evaluations: evs };
  };

  const [tooltip, setTooltip] = useState(null); // { studentId, competencyId, evs }

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
                            onClick={() => count > 0 && setTooltip(
                              (tooltip?.studentId === student.id && tooltip?.competencyId === comp.id)
                                ? null
                                : { studentId: student.id, competencyId: comp.id, evs: evaluations, compName: comp.name, studentName: student.name }
                            )}
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

          {/* Detail tooltip/panel */}
          {tooltip && (
            <div style={{
              marginTop: '1.5rem',
              background: 'var(--card-bg, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.studentName}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {currentSubject.name} · {tooltip.compName} · Bimestre {selectedPeriod}
                  </p>
                </div>
                <button onClick={() => setTooltip(null)} style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
              </div>
              <table className="styled-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Instrumento</th>
                    <th style={{ textAlign: 'center' }}>Nota</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {tooltip.evs.map(ev => (
                    <tr key={ev.id}>
                      <td>{ev.activityName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.instrumentTitle}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${BADGE_THEME[ev.qualitative]}`}>{ev.qualitative}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(ev.date).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
