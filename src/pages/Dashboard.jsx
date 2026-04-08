import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, BookOpen, CheckCircle, TrendingUp, CalendarCheck, ClipboardCheck, BarChart3, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function parseTimeToMinutes(timeStr) {
  const firstTime = timeStr.split(' - ')[0];
  const [hours, minutes] = firstTime.split(':').map(Number);
  if (hours < 7) return (hours + 12) * 60 + minutes;
  return hours * 60 + minutes;
}

function groupScheduleByCourse(schedule) {
  const sorted = [...schedule].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  const grouped = {};
  sorted.forEach(item => {
    const key = `${item.classId}-${item.subjectId}`;
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        times: [item.time],
        count: 1
      };
    } else {
      grouped[key].times.push(item.time);
      grouped[key].count++;
    }
  });
  return Object.values(grouped);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { students, grades, attendance, subjects, schedule, classes, instruments, instrumentEvaluations, diagnosticEvaluations, currentUser } = useStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const totalStudents = students.length;
  
  let totalPresent = 0;
  let totalRecords = 0;
  attendance.forEach(dayRecord => {
    Object.values(dayRecord.records).forEach(status => {
      totalRecords++;
      if (status === 'Presente' || status === 'P') totalPresent++;
    });
  });
  const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) + '%' : '0%';

  const gradesByLevel = useMemo(() => {
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    grades.forEach(g => {
      if (counts[g.score] !== undefined) counts[g.score]++;
    });
    return [
      { name: 'AD - Destacado', value: counts.AD, color: '#10b981' },
      { name: 'A - Logrado', value: counts.A, color: '#3b82f6' },
      { name: 'B - En Proceso', value: counts.B, color: '#f59e0b' },
      { name: 'C - En Inicio', value: counts.C, color: '#ef4444' },
    ];
  }, [grades]);

  const gradesByClass = useMemo(() => {
    const classStats = {};
    classes.forEach(c => {
      classStats[c.name] = { AD: 0, A: 0, B: 0, C: 0, total: 0 };
    });
    
    grades.forEach(g => {
      const student = students.find(s => s.id === g.studentId);
      if (student && classStats[student.gradeLevel]) {
        if (classStats[student.gradeLevel][g.score] !== undefined) {
          classStats[student.gradeLevel][g.score]++;
        }
        classStats[student.gradeLevel].total++;
      }
    });
    
    return classes.map(c => ({
      name: c.name.replace(/"/g, ''),
      ad: classStats[c.name]?.AD || 0,
      a: classStats[c.name]?.A || 0,
      b: classStats[c.name]?.B || 0,
      c: classStats[c.name]?.C || 0,
    }));
  }, [grades, students, classes]);

  const topInstruments = useMemo(() => {
    const counts = {};
    instrumentEvaluations.forEach(ev => {
      const key = ev.instrumentTitle || ev.instrumentId;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [instrumentEvaluations]);

  const diagnosticStats = useMemo(() => {
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    diagnosticEvaluations.forEach(ev => {
      if (ev.grades) {
        Object.values(ev.grades).forEach(studentGrade => {
          Object.values(studentGrade).forEach(grade => {
            if (grade?.nivel && counts[grade.nivel] !== undefined) {
              counts[grade.nivel]++;
            }
          });
        });
      }
    });
    return [
      { name: 'AD', value: counts.AD, fill: '#10b981' },
      { name: 'A', value: counts.A, fill: '#3b82f6' },
      { name: 'B', value: counts.B, fill: '#f59e0b' },
      { name: 'C', value: counts.C, fill: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [diagnosticEvaluations]);

  const daysMapping = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayName = daysMapping[new Date().getDay()];
  const todayScheduleRaw = schedule.filter(s => s.day === todayName);
  const todaySchedule = groupScheduleByCourse(todayScheduleRaw);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Usuario'}</h2>
          <p className="page-subtitle">Resumen general del sistema educativo</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard icon={<Users />} title="Total Estudiantes" value={totalStudents} color="#3b82f6" />
        <StatCard icon={<CheckCircle />} title="Asistencia Promedio" value={avgAttendance} color="#10b981" />
        <StatCard icon={<TrendingUp />} title="Calif. Registradas" value={grades.length + diagnosticEvaluations.length + instrumentEvaluations.length} color="#8b5cf6" />
        <StatCard icon={<ClipboardCheck />} title="Instrumentos" value={instruments.length} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={18} /> Horario de Hoy ({todayName})
          </h3>
          {todaySchedule.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No tienes clases programadas para hoy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaySchedule.map((item, idx) => {
                const className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
                const subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Área...';
                const timesDisplay = item.times.length > 1 ? item.times.join(' y ') : item.time;
                return (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '0.75rem', background: '#f8fafc', borderRadius: '10px',
                    borderLeft: `4px solid ${item.color || '#10b981'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, minWidth: '130px', fontSize: '0.85rem' }}>{timesDisplay}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{className}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subjectName}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/attendance?class=${encodeURIComponent(className)}`)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: '#10b98115',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CalendarCheck size={14} /> Asistencia
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={18} /> Instrumentos Más Usados
          </h3>
          {topInstruments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No hay evaluaciones registradas. Aplica instrumentos para ver estadísticas aquí.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topInstruments.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', 
                  padding: '0.75rem', background: '#f8fafc', borderRadius: '8px'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.count} evaluación{item.count > 1 ? 'es' : ''}
                    </div>
                  </div>
                  <Award size={18} color="var(--warning-color)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(grades.length > 0 || diagnosticEvaluations.length > 0) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} /> Estadísticas de Calificaciones
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            <div className="card">
              <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)', fontSize: '1rem' }}>Niveles de Logro (General)</h4>
              {gradesByLevel.some(g => g.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByLevel.filter(g => g.value > 0)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {gradesByLevel.filter(g => g.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                  Registra calificaciones para ver estadísticas
                </p>
              )}
            </div>

            <div className="card">
              <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)', fontSize: '1rem' }}>Calificaciones por Grado</h4>
              {gradesByClass.some(g => g.ad + g.a + g.b + g.c > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByClass}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="ad" stackId="a" fill="#10b981" name="AD" />
                    <Bar dataKey="a" stackId="a" fill="#3b82f6" name="A" />
                    <Bar dataKey="b" stackId="a" fill="#f59e0b" name="B" />
                    <Bar dataKey="c" stackId="a" fill="#ef4444" name="C" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                  Registra calificaciones para ver estadísticas
                </p>
              )}
            </div>

            {diagnosticStats.length > 0 && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)', fontSize: '1rem' }}>Evaluación Diagnóstica</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={diagnosticStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {diagnosticStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {diagnosticStats.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {(grades.length === 0 && diagnosticEvaluations.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', marginTop: '1rem' }}>
          <BarChart3 size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Comienza a registrar calificaciones
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Los gráficos aparecerán aquí cuando registres calificaciones en instrumentos o evaluaciones diagnósticas.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '12px', 
        backgroundColor: `${color}20`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</h4>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}
