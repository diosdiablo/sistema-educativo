import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, BookOpen, CheckCircle, TrendingUp, CalendarCheck, ClipboardCheck, BarChart3, Award, Clock, Calendar, ArrowRight, GraduationCap } from 'lucide-react';
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
    instrumentEvaluations.forEach(ev => {
      const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
      if (level && counts[level] !== undefined) counts[level]++;
    });
    return [
      { name: 'AD - Destacado', value: counts.AD, color: '#10b981' },
      { name: 'A - Logrado', value: counts.A, color: '#3b82f6' },
      { name: 'B - En Proceso', value: counts.B, color: '#f59e0b' },
      { name: 'C - En Inicio', value: counts.C, color: '#ef4444' },
    ];
  }, [grades, instrumentEvaluations]);

  const gradesByClass = useMemo(() => {
    const classStats = {};
    classes.forEach(c => {
      classStats[c.id] = { AD: 0, A: 0, B: 0, C: 0, total: 0, name: c.name };
    });
    
    grades.forEach(g => {
      const student = students.find(s => s.id === g.studentId);
      if (student) {
        const classData = classes.find(c => c.name === student.gradeLevel || c.id === student.gradeLevel);
        if (classData && classStats[classData.id]) {
          if (classStats[classData.id][g.score] !== undefined) {
            classStats[classData.id][g.score]++;
          }
          classStats[classData.id].total++;
        }
      }
    });
    
    instrumentEvaluations.forEach(ev => {
      const classId = ev.classId || ev.class_id;
      const classData = classes.find(c => c.id === classId);
      if (classData && classStats[classData.id]) {
        const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
        if (level && classStats[classData.id][level] !== undefined) {
          classStats[classData.id][level]++;
        }
        classStats[classData.id].total++;
      }
    });
    
    return classes.map(c => ({
      name: c.name.replace(/"/g, ''),
      ad: classStats[c.id]?.AD || 0,
      a: classStats[c.id]?.A || 0,
      b: classStats[c.id]?.B || 0,
      c: classStats[c.id]?.C || 0,
    }));
  }, [grades, students, classes, instrumentEvaluations]);

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
  const monthsMapping = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const todayDate = new Date();
  const todayName = daysMapping[todayDate.getDay()];
  const formattedDate = `${todayDate.getDate()} de ${monthsMapping[todayDate.getMonth()]} de ${todayDate.getFullYear()}`;
  const todayScheduleRaw = schedule.filter(s => s.day === todayName);
  const todaySchedule = groupScheduleByCourse(todayScheduleRaw);

  const motivationalMessages = [
    "¡Cada día es una nueva oportunidad para aprender!",
    "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "Aprender hoy, liderar mañana.",
    "La curiosidad es el motor del conocimiento.",
    "Cada estudiante puede aprender, solo necesita el método adecuado.",
    "El conocimiento es poder, y el poder es dar lo mejor de ti.",
    "Pequeños pasos llevan a grandes logros.",
    "Hoy es el mejor día para empezar algo nuevo.",
    "La enseñanza que deja huella es aquella que enciende la curiosidad.",
    "No temas a los problemas, enfréntalos con lo que sabes.",
    "El maestro no es el que más sabe, sino el que más inspira.",
    "Un día a la vez, una lección a la vez.",
    "El esfuerzo de hoy es el éxito de mañana."
  ];
  const dayMessage = motivationalMessages[todayDate.getDay()];

  const getNextClass = () => {
    if (todaySchedule.length === 0) return null;
    const now = todayDate.getHours();
    const currentMinutes = todayDate.getMinutes();
    const currentTimeInMinutes = now * 60 + currentMinutes;
    
    for (const item of todaySchedule) {
      const startTime = item.time.split(' - ')[0];
      const [hours, minutes] = startTime.split(':').map(Number);
      const classMinutes = hours < 7 ? (hours + 12) * 60 + minutes : hours * 60 + minutes;
      if (classMinutes > currentTimeInMinutes) {
        const className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
        const subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Área...';
        return { className, subjectName, time: item.time };
      }
    }
    return null;
  };
  const nextClass = getNextClass();

  const statCards = [
    { icon: <Users size={24} />, title: "Total Estudiantes", value: totalStudents, color: "#3b82f6", gradient: ['#3b82f6', '#2563eb'] },
    { icon: <CheckCircle size={24} />, title: "Asistencia Promedio", value: avgAttendance, color: "#10b981", gradient: ['#10b981', '#059669'] },
    { icon: <TrendingUp size={24} />, title: "Calif. Registradas", value: grades.length + diagnosticEvaluations.length + instrumentEvaluations.length, color: "#8b5cf6", gradient: ['#8b5cf6', '#7c3aed'] },
    { icon: <ClipboardCheck size={24} />, title: "Instrumentos", value: instruments.length, color: "#f59e0b", gradient: ['#f59e0b', '#d97706'] },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Usuario'}</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '0.25rem' }}>{formattedDate}</p>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', fontWeight: 500, marginTop: '0.5rem', fontStyle: 'italic' }}>"{dayMessage}"</p>
          </div>
          {nextClass && (
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '1rem 1.5rem', 
              borderRadius: '16px', 
              borderLeft: '4px solid #10b981',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} /> Próxima clase
              </p>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{nextClass.subjectName}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{nextClass.className} • {nextClass.time}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {statCards.map((stat, idx) => (
          <div 
            key={idx}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
          >
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '14px', 
              background: `linear-gradient(135deg, ${stat.gradient[0]}, ${stat.gradient[1]})`,
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 15px ${stat.color}40`
            }}>
              {stat.icon}
            </div>
            <div>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{stat.title}</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secciones de horario e instrumentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Horario de hoy */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarCheck size={18} color="white" />
            </div>
            Horario de Hoy
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 'auto' }}>({todayName})</span>
          </h3>
          {todaySchedule.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '2rem', 
              background: '#f8fafc', borderRadius: '12px',
              border: '2px dashed #e2e8f0'
            }}>
              <Calendar size={32} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tienes clases programadas para hoy.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaySchedule.map((item, idx) => {
                const className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
                const subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Área...';
                const timesDisplay = item.times.length > 1 ? item.times.join(' y ') : item.time;
                return (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '1rem', background: '#f8fafc', borderRadius: '12px',
                    borderLeft: `4px solid ${item.color || '#10b981'}`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        fontWeight: 700, minWidth: '130px', fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>{timesDisplay}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{className}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subjectName}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/attendance?class=${encodeURIComponent(className)}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <CalendarCheck size={14} /> Asistencia
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instrumentos más usados */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ClipboardCheck size={18} color="white" />
            </div>
            Instrumentos Más Usados
          </h3>
          {topInstruments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '2rem', 
              background: '#f8fafc', borderRadius: '12px',
              border: '2px dashed #e2e8f0'
            }}>
              <Award size={32} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No hay evaluaciones registradas.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topInstruments.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', 
                  padding: '0.875rem', background: '#f8fafc', borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                               idx === 1 ? 'linear-gradient(135deg, #64748b, #475569)' :
                               idx === 2 ? 'linear-gradient(135deg, #c2410c, #9a3412)' : '#f1f5f9',
                    color: idx < 3 ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center',
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
                  <Award size={18} color={idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#c2410c'} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráficos de estadísticas */}
      {(grades.length > 0 || diagnosticEvaluations.length > 0 || instrumentEvaluations.length > 0) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BarChart3 size={18} color="white" />
            </div>
            Estadísticas de Calificaciones
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h4 style={{ marginBottom: '1rem', color: '#6366f1', fontSize: '1rem', fontWeight: 700 }}>Niveles de Logro (General)</h4>
              {gradesByLevel.some(g => g.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByLevel.filter(g => g.value > 0)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
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

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h4 style={{ marginBottom: '1rem', color: '#6366f1', fontSize: '1rem', fontWeight: 700 }}>Calificaciones por Grado</h4>
              {gradesByClass.some(g => g.ad + g.a + g.b + g.c > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByClass}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="ad" stackId="a" fill="#10b981" name="AD" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="a" stackId="a" fill="#3b82f6" name="A" />
                    <Bar dataKey="b" stackId="a" fill="#f59e0b" name="B" />
                    <Bar dataKey="c" stackId="a" fill="#ef4444" name="C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                  Registra calificaciones para ver estadísticas
                </p>
              )}
            </div>

            {diagnosticStats.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <h4 style={{ marginBottom: '1rem', color: '#6366f1', fontSize: '1rem', fontWeight: 700 }}>Evaluación Diagnóstica</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={diagnosticStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
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
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Empty state */}
      {(grades.length === 0 && diagnosticEvaluations.length === 0 && instrumentEvaluations.length === 0) && (
        <div style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed #cbd5e1'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <BarChart3 size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Comienza a registrar calificaciones
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Los gráficos aparecerán aquí cuando registres calificaciones en instrumentos o evaluaciones diagnósticas.
          </p>
        </div>
      )}
    </div>
  );
}