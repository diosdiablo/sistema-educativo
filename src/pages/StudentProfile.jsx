import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, Users, GraduationCap, Calendar, Phone, MapPin, UserCheck, FileText, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, Target, Award, BarChart3, PieChart, CalendarRange } from 'lucide-react';

const GRADE_TO_NUM = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
const NUM_TO_GRADE = (n) => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};
const GRADE_LABEL = { AD: 'Destacado', A: 'Logrado', B: 'En Proceso', C: 'En Inicio' };
const GRADE_COLORS = { AD: '#188038', A: '#1a73e8', B: '#e37400', C: '#d93025' };
const PERIODS = ['1', '2', '3', '4'];
const PERIOD_LABELS = { '1': 'I Bimestre', '2': 'II Bimestre', '3': 'III Bimestre', '4': 'IV Bimestre' };

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, grades, subjects, attendance, instrumentEvaluations, diagnosticEvaluations, periodDates } = useStore();
  const [activeTab, setActiveTab] = useState('info');
  const [selectedAttendancePeriod, setSelectedAttendancePeriod] = useState(null);

  const student = useMemo(() => students.find(s => s.id === id), [students, id]);

  const studentGrades = useMemo(() => {
    if (!student) return [];
    return grades.filter(g => g.studentId === student.id);
  }, [grades, student]);

  const studentInstrEvals = useMemo(() => {
    if (!student) return [];
    return instrumentEvaluations.filter(e => e.studentId === student.id);
  }, [instrumentEvaluations, student]);

  const studentDiagnostics = useMemo(() => {
    if (!student) return [];
    return diagnosticEvaluations.filter(e => e.studentId === student.id);
  }, [diagnosticEvaluations, student]);

  const attendanceStats = useMemo(() => {
    if (!student) return { total: 0, present: 0, late: 0, absent: 0, justified: 0, percentage: 0 };
    let present = 0, late = 0, absent = 0, justified = 0, total = 0;
    attendance.forEach(day => {
      const status = day.records[student.id];
      if (!status) return;
      total++;
      if (status === 'P') present++;
      else if (status === 'T') late++;
      else if (status === 'F') absent++;
      else if (status === 'J') justified++;
    });
    return {
      total,
      present,
      late,
      absent,
      justified,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }, [attendance, student]);

  const filteredAttendanceStats = useMemo(() => {
    if (!student || !selectedAttendancePeriod) return attendanceStats;
    const period = periodDates[selectedAttendancePeriod];
    if (!period) return attendanceStats;
    let present = 0, late = 0, absent = 0, justified = 0, total = 0;
    attendance.forEach(day => {
      const status = day.records[student.id];
      if (!status) return;
      if (day.date < period.start || day.date > period.end) return;
      total++;
      if (status === 'P') present++;
      else if (status === 'T') late++;
      else if (status === 'F') absent++;
      else if (status === 'J') justified++;
    });
    return {
      total, present, late, absent, justified,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }, [attendance, student, selectedAttendancePeriod, periodDates, attendanceStats]);

  const filteredAttendanceDays = useMemo(() => {
    let days = [...attendance].reverse().filter(a => a.records[student.id]);
    if (selectedAttendancePeriod) {
      const period = periodDates[selectedAttendancePeriod];
      if (period) {
        days = days.filter(a => a.date >= period.start && a.date <= period.end);
      }
    }
    return days.slice(-60);
  }, [attendance, student, selectedAttendancePeriod, periodDates]);

  const gradesByPeriodAndSubject = useMemo(() => {
    if (!student) return {};
    const result = {};
    subjects.forEach(sub => {
      result[sub.id] = {};
      PERIODS.forEach(period => {
        const subEvals = studentInstrEvals.filter(e =>
          e.subjectId === sub.id && e.period === period
        );
        const subGrades = studentGrades.filter(g =>
          g.subject === sub.name && g.period === period
        );

        const competencyResults = {};
        sub.competencies.forEach(comp => {
          const ev = subEvals.find(e => e.competencyId === comp.id);
          const gr = subGrades.find(g => g.competencyId === comp.id);
          if (ev && ev.qualitative) {
            competencyResults[comp.id] = { label: ev.qualitative, score: ev.score, max: ev.maxPossible };
          } else if (gr && gr.score) {
            const qualitative = gr.conclusion || NUM_TO_GRADE((GRADE_TO_NUM[gr.score] || 0));
            competencyResults[comp.id] = { label: qualitative, score: gr.score };
          }
        });

        let periodAverage = null;
        const values = Object.values(competencyResults);
        if (values.length > 0) {
          const nums = values.map(v => GRADE_TO_NUM[v.label]).filter(Boolean);
          if (nums.length > 0) {
            periodAverage = NUM_TO_GRADE(nums.reduce((a, b) => a + b, 0) / nums.length);
          }
        }

        result[sub.id][period] = { competencies: competencyResults, average: periodAverage };
      });
    });
    return result;
  }, [student, subjects, studentInstrEvals, studentGrades]);

  if (!student) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Users size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h2>Estudiante no encontrado</h2>
        <button onClick={() => navigate('/students')} className="btn-primary" style={{
          marginTop: '1rem', padding: '0.55rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem'
        }}>Volver a Estudiantes</button>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información', icon: <Users size={18} /> },
    { id: 'grades', label: 'Calificaciones', icon: <GraduationCap size={18} /> },
    { id: 'attendance', label: 'Asistencia', icon: <CheckCircle size={18} /> },
    { id: 'diagnostic', label: 'Eval. Diagnóstica', icon: <FileText size={18} /> },
  ];

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate('/students')} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontWeight: 600, marginBottom: '1rem',
        padding: '0.5rem 0', fontSize: '0.9rem'
      }}>
        <ArrowLeft size={18} /> Volver a Estudiantes
      </button>

      {/* Encabezado */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: student.photo_url ? `url(${student.photo_url}) center/cover` : 'var(--nav-active-bg)',
            color: 'var(--nav-active-fg)', fontWeight: 500,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0, fontSize: '1.4rem'
          }}>
            {student.photo_url ? null : (
              <span>
                {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{student.name}</h2>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              {student.gradeLevel} {student.dni ? `| DNI: ${student.dni}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.15rem', borderRadius: '20px',
            border: activeTab === tab.id ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
            background: activeTab === tab.id ? 'var(--nav-active-bg)' : 'transparent',
            color: activeTab === tab.id ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
            fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontWeight: 500, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Users size={20} color="var(--accent-primary)" /> Datos Personales
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="DNI" value={student.dni || '-'} />
              <InfoRow label="Nombre Completo" value={student.name} />
              <InfoRow label="Grado y Sección" value={student.gradeLevel || '-'} />
              <InfoRow label="Fecha de Nacimiento" value={student.birthDate || '-'} icon={<Calendar size={14} />} />
              <InfoRow label="Dirección" value={student.address || '-'} icon={<MapPin size={14} />} />
              <InfoRow label="Teléfono" value={student.phone || '-'} icon={<Phone size={14} />} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontWeight: 500, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <UserCheck size={20} color="var(--accent-primary)" /> Apoderado
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="Nombre" value={student.guardianName || '-'} />
              <InfoRow label="DNI" value={student.guardianDni || '-'} />
              <InfoRow label="Teléfono" value={student.guardianPhone || '-'} icon={<Phone size={14} />} />
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <StatCard icon={<Users />} label="Total Asistencias" value={`${attendanceStats.total} días`} color="#1a73e8" />
            <StatCard icon={<CheckCircle />} label="Asistencias" value={String(attendanceStats.present)} color="#188038" />
            <StatCard icon={<AlertCircle />} label="Tardanzas" value={String(attendanceStats.late)} color="#e37400" />
            <StatCard icon={<XCircle />} label="Faltas" value={String(attendanceStats.absent)} color="#d93025" />
            <StatCard icon={<Award />} label="% Asistencia" value={`${attendanceStats.percentage}%`} color="#007b83" />
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subjects.map(sub => {
            const subData = gradesByPeriodAndSubject[sub.id];
            if (!subData) return null;
            const hasAnyGrade = PERIODS.some(p =>
              Object.keys(subData[p]?.competencies || {}).length > 0
            );
            if (!hasAnyGrade) return null;

            return (
              <div key={sub.id} style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontWeight: 500, marginBottom: '1rem', color: 'var(--text-primary)' }}>{sub.name}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>Competencia</th>
                        {PERIODS.map(p => (
                          <th key={p} style={{ textAlign: 'center', padding: '0.5rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '70px' }}>
                            {p}° Bim.
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sub.competencies.map(comp => {
                        const isAnyGrade = PERIODS.some(p => subData[p]?.competencies[comp.id]);
                        if (!isAnyGrade) return null;
                        return (
                          <tr key={comp.id}>
                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--surface-muted)', fontWeight: 500 }}>{comp.name}</td>
                            {PERIODS.map(p => {
                              const data = subData[p]?.competencies[comp.id];
                              return (
                                <td key={p} style={{ textAlign: 'center', padding: '0.5rem', borderBottom: '1px solid var(--surface-muted)' }}>
                                  {data ? (
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: '36px', height: '36px', borderRadius: '50%',
                                      background: `${GRADE_COLORS[data.label]}20`,
                                      color: GRADE_COLORS[data.label],
                                      fontWeight: 700, fontSize: '0.8rem'
                                    }}>{data.label}</span>
                                  ) : <span style={{ color: 'var(--border-color)' }}>-</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Average row */}
                      {PERIODS.some(p => subData[p]?.average) && (
                        <tr>
                          <td style={{ padding: '0.5rem', borderTop: '2px solid var(--border-color)', fontWeight: 700, color: 'var(--text-primary)' }}>Promedio</td>
                          {PERIODS.map(p => {
                            const avg = subData[p]?.average;
                            return (
                              <td key={p} style={{ textAlign: 'center', padding: '0.5rem', borderTop: '2px solid var(--border-color)' }}>
                                {avg ? (
                                  <span style={{
                                    fontWeight: 700, color: GRADE_COLORS[avg], fontSize: '0.9rem'
                                  }}>{avg}</span>
                                ) : <span style={{ color: 'var(--border-color)' }}>-</span>}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {subjects.every(sub => {
            const subData = gradesByPeriodAndSubject[sub.id];
            return !subData || PERIODS.every(p => Object.keys(subData[p]?.competencies || {}).length === 0);
          }) && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-color-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <GraduationCap size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No hay calificaciones registradas para este estudiante.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <CalendarRange size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '0.25rem' }}>Filtrar por:</span>
            <button onClick={() => setSelectedAttendancePeriod(null)} style={{
              padding: '0.4rem 0.85rem', borderRadius: '20px',
              border: selectedAttendancePeriod === null ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
              background: selectedAttendancePeriod === null ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
              color: selectedAttendancePeriod === null ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
              fontWeight: 500, cursor: 'pointer', fontSize: '0.8rem'
            }}>Todo</button>
            {PERIODS.map(p => {
              const isActive = selectedAttendancePeriod === p;
              return (
                <button key={p} onClick={() => setSelectedAttendancePeriod(p)} style={{
                  padding: '0.4rem 0.85rem', borderRadius: '20px',
                  border: isActive ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                  color: isActive ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
                  fontWeight: 500, cursor: 'pointer', fontSize: '0.8rem'
                }}>{p}° Bim.</button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <StatCard icon={<CheckCircle size={22} />} label="Presente" value={String(filteredAttendanceStats.present)} color="#188038" large />
            <StatCard icon={<AlertCircle size={22} />} label="Tardanza" value={String(filteredAttendanceStats.late)} color="#e37400" large />
            <StatCard icon={<XCircle size={22} />} label="Falta" value={String(filteredAttendanceStats.absent)} color="#d93025" large />
            <StatCard icon={<Clock size={22} />} label="Justificado" value={String(filteredAttendanceStats.justified)} color="#007b83" large />
          </div>

          {/* Historial */}
          <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Clock size={20} color="var(--accent-primary)" /> Historial de Asistencia
            </h3>
            {filteredAttendanceDays.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No hay registro de asistencia para este período.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredAttendanceDays.map(day => {
                  const status = day.records[student.id];
                  const statusConfig = {
                    P: { label: 'Presente', color: '#188038', bg: '#18803815' },
                    T: { label: 'Tardanza', color: '#e37400', bg: '#e3740015' },
                    F: { label: 'Falta', color: '#d93025', bg: '#d9302515' },
                    J: { label: 'Justificado', color: '#007b83', bg: '#007b8315' },
                  };
                  const config = statusConfig[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--surface-muted)' };
                  return (
                    <div key={day.date} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: '10px', background: config.bg,
                      border: `1px solid ${config.color}20`
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span style={{ color: config.color, fontWeight: 700, fontSize: '0.85rem' }}>{config.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'diagnostic' && (
        <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontWeight: 500, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <FileText size={20} color="var(--accent-primary)" /> Evaluación Diagnóstica
          </h3>
          {studentDiagnostics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No hay evaluaciones diagnósticas registradas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subjects.map(sub => {
                const diag = studentDiagnostics.find(d => d.subjectId === sub.id);
                if (!diag) return null;
                return (
                  <div key={sub.id} style={{
                    padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{sub.name}</span>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '8px', fontWeight: 700,
                      background: diag.result === 'AD' ? '#18803820' : diag.result === 'A' ? '#1a73e820' : diag.result === 'B' ? '#e3740020' : '#d9302520',
                      color: diag.result === 'AD' ? '#188038' : diag.result === 'A' ? '#1a73e8' : diag.result === 'B' ? '#e37400' : '#d93025'
                    }}>{diag.result || diag.score || '-'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, color, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-muted)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon}{label}
      </span>
      <span style={{ fontWeight: 500, color: color || 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color, large }) {
  return (
    <div style={{
      background: 'var(--bg-color-surface)', borderRadius: '12px', padding: '1.25rem',
      border: '1px solid var(--border-color)',
      textAlign: 'center'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 0.5rem auto',
        color
      }}>
        {icon}
      </div>
      <div style={{ fontSize: large ? '1.6rem' : '1.35rem', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}
