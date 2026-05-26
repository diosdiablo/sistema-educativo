import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, BookOpen, CheckCircle, TrendingUp, CalendarCheck, ClipboardCheck, BarChart3, Award, Clock, Calendar, ArrowRight, GraduationCap, Cake, Gift } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

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
      const instrument = instruments.find(i => i.id === ev.instrumentId);
      const key = instrument?.title || instrument?.name || ev.instrumentTitle || ev.instrumentId;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [instrumentEvaluations, instruments]);

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

  const birthdayData = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    const withBirthday = students.filter(s => s.birthDate).map(s => {
      const bd = new Date(s.birthDate);
      const month = bd.getMonth();
      const day = bd.getDate();
      const isToday = month === todayMonth && day === todayDay;
      const nextBirthday = new Date(today.getFullYear(), month, day);
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      return { ...s, month, day, isToday, daysUntil };
    });

    const todayBirthdays = withBirthday.filter(s => s.isToday);
    const thisWeek = withBirthday.filter(s => s.daysUntil <= 7 && !s.isToday);
    const thisMonth = withBirthday.filter(s => s.month === todayMonth && !s.isToday);

    return { todayBirthdays, thisWeek, thisMonth, total: withBirthday.length };
  }, [students]);

  const statCards = [
    { icon: <Users size={24} />, title: "Total Estudiantes", value: totalStudents, color: "#3b82f6", gradient: ['#3b82f6', '#2563eb'] },
    { icon: <CheckCircle size={24} />, title: "Asistencia Promedio", value: avgAttendance, color: "#10b981", gradient: ['#10b981', '#059669'] },
    { icon: <TrendingUp size={24} />, title: "Calif. Registradas", value: grades.length + diagnosticEvaluations.length + instrumentEvaluations.length, color: "#8b5cf6", gradient: ['#8b5cf6', '#7c3aed'] },
    { icon: <ClipboardCheck size={24} />, title: "Instrumentos", value: instruments.length, color: "#f59e0b", gradient: ['#f59e0b', '#d97706'] },
  ];

  const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const [attendanceView, setAttendanceView] = useState('daily');
  const [attendanceClass, setAttendanceClass] = useState('');

  const classStudentIds = useMemo(() => {
    if (!attendanceClass) return null;
    const cleanSelected = attendanceClass.trim().toLowerCase();
    const ids = students
      .filter(s => (s.gradeLevel || '').trim().toLowerCase() === cleanSelected || (s.classId || '').trim().toLowerCase() === cleanSelected)
      .map(s => s.id);
    return new Set(ids);
  }, [attendanceClass, students]);

  const attendanceChartData = useMemo(() => {
    const now = new Date();
    const sortedDates = [...attendance].sort((a, b) => a.date.localeCompare(b.date));
    if (sortedDates.length === 0) return [];

    const filterRecords = (records) => {
      if (!classStudentIds) return records;
      const filtered = {};
      Object.entries(records).forEach(([sid, status]) => {
        if (classStudentIds.has(sid)) filtered[sid] = status;
      });
      return filtered;
    };

    const countStats = (records) => {
      const stats = { P: 0, T: 0, F: 0, J: 0 };
      Object.values(records).forEach(s => { if (stats[s] !== undefined) stats[s]++; });
      return stats;
    };

    if (attendanceView === 'daily') {
      const days = 14;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      return sortedDates
        .filter(d => d.date >= cutoff.toISOString().split('T')[0])
        .map(d => ({ date: d.date.slice(5), ...countStats(filterRecords(d.records)) }));
    }

    if (attendanceView === 'weekly') {
      const weeks = 8;
      const weekData = {};
      const getWeekKey = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      };
      sortedDates.forEach(d => {
        const wk = getWeekKey(d.date);
        if (!weekData[wk]) weekData[wk] = { P: 0, T: 0, F: 0, J: 0 };
        const stats = countStats(filterRecords(d.records));
        Object.keys(stats).forEach(k => { weekData[wk][k] += stats[k]; });
      });
      const weekKeys = Object.keys(weekData).sort().slice(-weeks);
      return weekKeys.map(wk => {
        const [y, m, day] = wk.split('-');
        const label = `${monthsNames[parseInt(m) - 1]} ${parseInt(day)}`;
        return { date: label, ...weekData[wk] };
      });
    }

    // monthly
    const months = 12;
    const monthData = {};
    sortedDates.forEach(d => {
      const mk = d.date.slice(0, 7);
      if (!monthData[mk]) monthData[mk] = { P: 0, T: 0, F: 0, J: 0 };
      const stats = countStats(filterRecords(d.records));
      Object.keys(stats).forEach(k => { monthData[mk][k] += stats[k]; });
    });
    const monthKeys = Object.keys(monthData).sort().slice(-months);
    return monthKeys.map(mk => {
      const [y, m] = mk.split('-');
      return { date: `${monthsNames[parseInt(m) - 1]} ${y}`, ...monthData[mk] };
    });
  }, [attendance, attendanceView, monthsNames, classStudentIds]);

  const attendancePresentRate = useMemo(() => {
    return attendanceChartData.map(d => {
      const total = (d.P || 0) + (d.T || 0) + (d.F || 0) + (d.J || 0);
      const present = (d.P || 0) + (d.T || 0) + (d.J || 0);
      return { date: d.date, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
    });
  }, [attendanceChartData]);

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

      {/* Sección de Cumpleaños Animada */}
      {birthdayData.total > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, #fff5f9 0%, #fff0f7 50%, #fef3f2 100%)',
          borderRadius: '24px',
          padding: '1.75rem',
          boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(236, 72, 153, 0.15)',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          cursor: 'default'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(236, 72, 153, 0.2), 0 2px 8px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(236, 72, 153, 0.15), 0 2px 8px rgba(0,0,0,0.06)'; }}
        >
          {/* Partículas decorativas flotantes */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {[0,1,2,3,4].map(i => (
              <span key={i} style={{
                position: 'absolute',
                fontSize: `${1.5 + Math.random() * 1.5}rem`,
                opacity: 0.15,
                animation: `floatBirthday${i} ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 70}%`,
                transform: 'rotate(0deg)'
              }}>
                {['🎂','🎈','🎉','🎊','✨'][i]}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #ec4899, #db2777, #be185d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.15)',
              animation: 'glowCelebration 2s ease-in-out infinite',
              position: 'relative'
            }}>
              <Cake size={26} color="white" />
              {/* Luces alrededor del pastel */}
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', animation: 'candleFlicker 0.6s ease-in-out infinite alternate' }} />
              <span style={{ position: 'absolute', top: '-2px', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6', boxShadow: '0 0 6px #f472b6', animation: 'candleFlicker 0.8s ease-in-out infinite alternate', animationDelay: '0.2s' }} />
              <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '7px', height: '7px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', animation: 'candleFlicker 0.5s ease-in-out infinite alternate', animationDelay: '0.4s' }} />
              <span style={{ position: 'absolute', bottom: '-4px', left: '-2px', width: '9px', height: '9px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'candleFlicker 0.7s ease-in-out infinite alternate', animationDelay: '0.1s' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #db2777, #be185d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🎂 Próximos Cumpleaños
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#a855a8', margin: 0, fontStyle: 'italic' }}>
                {birthdayData.total} estudiante(s) registrados
              </p>
            </div>
          </div>

          {/* HOY - Tarjeta de celebración animada */}
          {birthdayData.todayBirthdays.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
              borderRadius: '18px',
              padding: '1.5rem',
              marginBottom: '1rem',
              position: 'relative',
              overflow: 'hidden',
              animation: 'glowCelebration 2s ease-in-out infinite',
              transition: 'transform 0.3s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Confeti animado */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[...Array(12)].map((_, i) => (
                  <span key={i} style={{
                    position: 'absolute',
                    width: `${6 + Math.random() * 6}px`,
                    height: `${6 + Math.random() * 6}px`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    background: ['#ec4899','#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444'][i % 6],
                    opacity: 0.8,
                    animation: `confettiFall${i} ${2 + Math.random() * 2}s ease-in infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    left: `${Math.random() * 100}%`,
                    top: '-10px'
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '1.5rem', animation: 'bounceParty 1s ease-in-out infinite' }}>🎉</span>
                <span style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>¡HOY ES SU CUMPLEAÑOS!</span>
                <span style={{ fontSize: '1.5rem', animation: 'bounceParty 1s ease-in-out infinite', animationDelay: '0.3s' }}>🎉</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                {birthdayData.todayBirthdays.map(student => (
                  <div key={student.id} style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '14px',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) rotate(-1deg)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
                  >
                    <span style={{ fontSize: '2rem', animation: 'bounceParty 1.5s ease-in-out infinite' }}>🎈</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.gradeLevel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Carrusel animado para todas las listas */}
          {birthdayData.thisWeek.length > 0 && (
            <div style={{ marginBottom: birthdayData.todayBirthdays.length > 0 ? '1rem' : 0, position: 'relative', zIndex: 2 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#db2777', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', animation: 'pulseBirthday 2s ease-in-out infinite' }}>📅</span>
                Esta semana ({birthdayData.thisWeek.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {birthdayData.thisWeek.map(student => (
                  <div key={student.id} style={{
                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                    borderRadius: '12px',
                    padding: '0.6rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(236, 72, 153, 0.15)',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.2)'; e.currentTarget.style.borderColor = '#ec4899'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.15)'; }}
                  >
                    <span style={{ fontSize: '1.2rem', animation: 'floatBirthday0 3s ease-in-out infinite' }}>🎂</span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{student.name}</span>
                      <span style={{ color: '#db2777', marginLeft: '0.4rem', fontWeight: 600, fontSize: '0.8rem' }}>
                        {student.daysUntil === 1 ? '¡Mañana!' : `En ${student.daysUntil} días`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mes actual - con auto-scroll */}
          {birthdayData.todayBirthdays.length === 0 && birthdayData.thisWeek.length === 0 && birthdayData.thisMonth.length > 0 && (
            <BirthdayCarousel items={birthdayData.thisMonth} monthsNames={monthsNames} />
          )}

          {birthdayData.todayBirthdays.length === 0 && birthdayData.thisWeek.length === 0 && birthdayData.thisMonth.length === 0 && (
            <div style={{
              background: 'rgba(236, 72, 153, 0.05)',
              borderRadius: '14px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.6 }}>🎂</span>
              <p style={{ fontSize: '0.9rem', color: '#a855a8', margin: 0, fontStyle: 'italic' }}>
                No hay cumpleaños próximos esta semana
              </p>
            </div>
          )}

          <style>{`
            @keyframes pulseBirthday {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            @keyframes bounceParty {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            @keyframes glowCelebration {
              0%, 100% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3); }
              50% { box-shadow: 0 4px 40px rgba(245, 158, 11, 0.6); }
            }
            @keyframes candleFlicker {
              0% { opacity: 0.4; transform: scale(0.8); }
              100% { opacity: 1; transform: scale(1.2); }
            }
            ${[...Array(12)].map((_, i) => `
              @keyframes confettiFall${i} {
                0% { transform: translateY(-10px) rotate(0deg); opacity: 0.8; }
                100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
              }
            `).join('')}
            ${[0,1,2,3,4].map(i => `
              @keyframes floatBirthday${i} {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                33% { transform: translateY(-10px) rotate(3deg); }
                66% { transform: translateY(5px) rotate(-2deg); }
              }
            `).join('')}
          `}</style>
        </div>
      )}

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
                let className, subjectName;
                if (item.classId === '__ATENCION__') {
                  className = 'ATENCIÓN AL PADRE DE FAMILIA';
                  subjectName = '';
                } else if (item.classId === '__TRABAJO__') {
                  className = 'TRABAJO COLEGIADO';
                  subjectName = '';
                } else {
                  className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
                  subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Área...';
                }
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
                        {subjectName && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subjectName}</div>}
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

      {/* Gráficos de Asistencia */}
      {attendanceChartData.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <BarChart3 size={18} color="white" />
                  </div>
                  Asistencia
                </h3>
                <select value={attendanceClass} onChange={e => setAttendanceClass(e.target.value)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                    fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc',
                    cursor: 'pointer', outline: 'none'
                  }}>
                  <option value="">Todas las secciones</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                {[
                  { key: 'daily', label: 'Diario' },
                  { key: 'weekly', label: 'Semanal' },
                  { key: 'monthly', label: 'Mensual' },
                ].map(v => (
                  <button key={v.key} onClick={() => setAttendanceView(v.key)} style={{
                    padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                    background: attendanceView === v.key ? '#10b981' : 'transparent',
                    color: attendanceView === v.key ? 'white' : '#64748b',
                    transition: 'all 0.2s'
                  }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="P" stackId="a" fill="#10b981" name="Presente" radius={[0, 0, 0, 0]} />
                <Bar dataKey="T" stackId="a" fill="#f59e0b" name="Tarde" />
                <Bar dataKey="J" stackId="a" fill="#8b5cf6" name="Justificado" />
                <Bar dataKey="F" stackId="a" fill="#ef4444" name="Falta" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {attendancePresentRate.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  % de Asistencia (Presentes+Tardes+Justificados)
                </h4>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={attendancePresentRate}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="% Asistencia" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

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

function BirthdayCarousel({ items, monthsNames }) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 4;
  const totalPages = Math.ceil(items.length / pageSize);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [totalPages]);

  const visibleItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ display: 'inline-block', animation: 'pulseBirthday 2s ease-in-out infinite' }}>📅</span>
        Este mes ({items.length} estudiante(s))
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.5rem',
        minHeight: '80px',
        transition: 'all 0.3s ease'
      }}>
        {visibleItems.map(student => (
          <div key={student.id} style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            borderRadius: '12px',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            transition: 'all 0.3s ease',
            cursor: 'default',
            animation: 'fadeSlideIn 0.3s ease-out'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'; }}
          >
            <span style={{ fontSize: '1.2rem' }}>🎂</span>
            <div>
              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{student.name}</span>
              <span style={{ color: '#7c3aed', marginLeft: '0.4rem', fontWeight: 500, fontSize: '0.75rem' }}>
                {student.day} {monthsNames[student.month]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de página */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              border: 'none', padding: 0, cursor: 'pointer',
              background: i === currentPage ? '#8b5cf6' : '#e2e8f0',
              transition: 'all 0.3s ease',
              transform: i === currentPage ? 'scale(1.3)' : 'scale(1)'
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}