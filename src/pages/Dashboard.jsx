import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, CheckCircle, TrendingUp, CalendarCheck, ClipboardCheck,
  BarChart3, Clock, Calendar, GraduationCap, Cake,
  AlertTriangle,
  FileText, Star, CheckSquare
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

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
      grouped[key] = { ...item, times: [item.time], count: 1 };
    } else {
      grouped[key].times.push(item.time);
      grouped[key].count++;
    }
  });
  return Object.values(grouped);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #dadce0',
      borderRadius: '8px',
      padding: '0.65rem 0.85rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      fontSize: '0.78rem',
      minWidth: '120px'
    }}>
      {label && <p style={{ fontWeight: 500, marginBottom: '0.4rem', color: '#202124', fontSize: '0.8rem', borderBottom: '1px solid #e8eaed', paddingBottom: '0.35rem' }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '2px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
            <span style={{ color: '#5f6368' }}>{entry.name}</span>
          </div>
          <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#202124' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const ChartGradients = () => (
  <defs>
    <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#188038" stopOpacity={1} />
      <stop offset="100%" stopColor="#188038" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#e37400" stopOpacity={1} />
      <stop offset="100%" stopColor="#e37400" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradJustified" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7627bb" stopOpacity={1} />
      <stop offset="100%" stopColor="#7627bb" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#d93025" stopOpacity={1} />
      <stop offset="100%" stopColor="#d93025" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#188038" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#188038" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="gradAD" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#188038" />
      <stop offset="100%" stopColor="#188038" />
    </linearGradient>
    <linearGradient id="gradA" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#1967d2" />
      <stop offset="100%" stopColor="#1967d2" />
    </linearGradient>
    <linearGradient id="gradB" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#e37400" />
      <stop offset="100%" stopColor="#e37400" />
    </linearGradient>
    <linearGradient id="gradC" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#d93025" />
      <stop offset="100%" stopColor="#d93025" />
    </linearGradient>
    <linearGradient id="gradRadar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7627bb" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#7627bb" stopOpacity={0.1} />
    </linearGradient>
  </defs>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    students, grades, attendance, subjects, schedule, classes,
    instruments, instrumentEvaluations, diagnosticEvaluations,
    currentUser, events
  } = useStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceView, setAttendanceView] = useState('daily');
  const [attendanceClass, setAttendanceClass] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const daysMapping = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const monthsMapping = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const todayDate = currentTime;
  const todayName = daysMapping[todayDate.getDay()];
  const formattedDate = `${todayDate.getDate()} de ${monthsMapping[todayDate.getMonth()]} ${todayDate.getFullYear()}`;
  const timeString = todayDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const todayScheduleRaw = schedule.filter(s => s.day === todayName);
  const todaySchedule = groupScheduleByCourse(todayScheduleRaw);

  const motivationalMessages = [
    "Cada dia es una nueva oportunidad para aprender!",
    "La educacion es el arma mas poderosa que puedes usar para cambiar el mundo.",
    "El exito es la suma de pequenos esfuerzos repetidos dia tras dia.",
    "Aprender hoy, liderar manana.",
    "La curiosidad es el motor del conocimiento.",
    "Cada estudiante puede aprender, solo necesita el metodo adecuado.",
    "El conocimiento es poder, y el poder es dar lo mejor de ti.",
    "Pequenos pasos llevan a grandes logros.",
    "Hoy es el mejor dia para empezar algo nuevo.",
    "La ensenanza que deja huella es aquella que enciende la curiosidad.",
    "No temas a los problemas, enfrentalos con lo que sabes.",
    "El maestro no es el que mas sabe, sino el que mas inspira.",
    "Un dia a la vez, una leccion a la vez.",
    "El esfuerzo de hoy es el exito de manana."
  ];
  const dayMessage = motivationalMessages[todayDate.getDay()];

  const totalStudents = students.length;

  let totalPresent = 0;
  let totalRecords = 0;
  attendance.forEach(dayRecord => {
    Object.values(dayRecord.records).forEach(status => {
      totalRecords++;
      if (status === 'Presente' || status === 'P') totalPresent++;
    });
  });
  const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const totalGrades = grades.length + diagnosticEvaluations.length + instrumentEvaluations.length;

  const totalGradesCount = useMemo(() => {
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    grades.forEach(g => { if (counts[g.score] !== undefined) counts[g.score]++; });
    instrumentEvaluations.forEach(ev => {
      const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
      if (level && counts[level] !== undefined) counts[level]++;
    });
    const total = counts.AD + counts.A + counts.B + counts.C;
    if (total === 0) return 'N/A';
    const weighted = (counts.AD * 4 + counts.A * 3 + counts.B * 2 + counts.C * 1) / total;
    if (weighted >= 3.5) return 'AD';
    if (weighted >= 2.5) return 'A';
    if (weighted >= 1.5) return 'B';
    return 'C';
  }, [grades, instrumentEvaluations]);

  const studentsAtRisk = useMemo(() => {
    const studentAttendance = {};
    attendance.forEach(dayRecord => {
      Object.entries(dayRecord.records).forEach(([sid, status]) => {
        if (!studentAttendance[sid]) studentAttendance[sid] = { total: 0, present: 0 };
        studentAttendance[sid].total++;
        if (status === 'Presente' || status === 'P') studentAttendance[sid].present++;
      });
    });
    return Object.entries(studentAttendance)
      .filter(([_, data]) => data.total > 0 && (data.present / data.total) < 0.7)
      .length;
  }, [attendance]);

  const classesToday = todaySchedule.length;

  const pendingEvaluations = useMemo(() => {
    return instruments.filter(inst => {
      const hasEvals = instrumentEvaluations.some(ev => ev.instrumentId === inst.id);
      return !hasEvals;
    }).length;
  }, [instruments, instrumentEvaluations]);

  const getNextClass = () => {
    if (todaySchedule.length === 0) return null;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    for (const item of todaySchedule) {
      const startTime = item.time.split(' - ')[0];
      const [hours, minutes] = startTime.split(':').map(Number);
      const classMinutes = hours < 7 ? (hours + 12) * 60 + minutes : hours * 60 + minutes;
      if (classMinutes > currentMinutes) {
        const className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
        const subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Area...';
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

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      // Try ISO format: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      // Try DD/MM/YYYY or DD-MM-YYYY
      const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      // Try DD/MM/YY
      const match2 = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
      if (match2) {
        const year = parseInt(match2[3]) + (parseInt(match2[3]) > 50 ? 1900 : 2000);
        return new Date(year, parseInt(match2[2]) - 1, parseInt(match2[1]));
      }
      return null;
    };

    const withBirthday = students.filter(s => s.birthDate).map(s => {
      const bd = parseDate(s.birthDate);
      if (!bd || isNaN(bd.getTime())) return null;
      const month = bd.getMonth();
      const day = bd.getDate();
      const isToday = month === todayMonth && day === todayDay;
      const nextBirthday = new Date(today.getFullYear(), month, day);
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      return { ...s, month, day, isToday, daysUntil };
    }).filter(Boolean);

    const todayBirthdays = withBirthday.filter(s => s.isToday);
    const thisWeek = withBirthday.filter(s => s.daysUntil <= 7 && !s.isToday);
    const thisMonth = withBirthday.filter(s => s.month === todayMonth && !s.isToday);
    return { todayBirthdays, thisWeek, thisMonth, total: withBirthday.length };
  }, [students]);

  const gradesByLevel = useMemo(() => {
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    grades.forEach(g => { if (counts[g.score] !== undefined) counts[g.score]++; });
    instrumentEvaluations.forEach(ev => {
      const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
      if (level && counts[level] !== undefined) counts[level]++;
    });
    return [
      { name: 'AD - Destacado', value: counts.AD, color: '#188038' },
      { name: 'A - Logrado', value: counts.A, color: '#1967d2' },
      { name: 'B - En Proceso', value: counts.B, color: '#e37400' },
      { name: 'C - En Inicio', value: counts.C, color: '#d93025' },
    ];
  }, [grades, instrumentEvaluations]);

  const gradesByClass = useMemo(() => {
    const classStats = {};
    classes.forEach(c => { classStats[c.id] = { AD: 0, A: 0, B: 0, C: 0, total: 0, name: c.name }; });
    grades.forEach(g => {
      const student = students.find(s => s.id === g.studentId);
      if (student) {
        const classData = classes.find(c => c.name === student.gradeLevel || c.id === student.gradeLevel);
        if (classData && classStats[classData.id]) {
          if (classStats[classData.id][g.score] !== undefined) classStats[classData.id][g.score]++;
          classStats[classData.id].total++;
        }
      }
    });
    instrumentEvaluations.forEach(ev => {
      const classId = ev.classId || ev.class_id;
      const classData = classes.find(c => c.id === classId);
      if (classData && classStats[classData.id]) {
        const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
        if (level && classStats[classData.id][level] !== undefined) classStats[classData.id][level]++;
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

  const subjectPerformance = useMemo(() => {
    const subjectStats = {};
    subjects.forEach(s => { subjectStats[s.id] = { name: s.name, scores: [], total: 0 }; });
    grades.forEach(g => {
      if (subjectStats[g.subject]) {
        const scoreMap = { AD: 4, A: 3, B: 2, C: 1 };
        if (scoreMap[g.score] !== undefined) {
          subjectStats[g.subject].scores.push(scoreMap[g.score]);
          subjectStats[g.subject].total++;
        }
      }
    });
    instrumentEvaluations.forEach(ev => {
      const subjId = ev.subjectId || ev.subject_id;
      if (subjId && subjectStats[subjId]) {
        const level = ev.qualitative || (['AD', 'A', 'B', 'C'].includes(ev.score) ? ev.score : null);
        const scoreMap = { AD: 4, A: 3, B: 2, C: 1 };
        if (level && scoreMap[level] !== undefined) {
          subjectStats[subjId].scores.push(scoreMap[level]);
          subjectStats[subjId].total++;
        }
      }
    });
    return Object.values(subjectStats)
      .filter(s => s.total > 0)
      .map(s => ({
        subject: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
        fullName: s.name,
        promedio: s.scores.length > 0 ? +(s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1) : 0,
        evaluaciones: s.total
      }))
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 6);
  }, [grades, instrumentEvaluations, subjects]);

  const diagnosticStats = useMemo(() => {
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    diagnosticEvaluations.forEach(ev => {
      if (ev.grades) {
        Object.values(ev.grades).forEach(studentGrade => {
          Object.values(studentGrade).forEach(grade => {
            if (grade?.nivel && counts[grade.nivel] !== undefined) counts[grade.nivel]++;
          });
        });
      }
    });
    return [
      { name: 'AD', value: counts.AD, fill: '#188038' },
      { name: 'A', value: counts.A, fill: '#1967d2' },
      { name: 'B', value: counts.B, fill: '#e37400' },
      { name: 'C', value: counts.C, fill: '#d93025' },
    ].filter(d => d.value > 0);
  }, [diagnosticEvaluations]);

  const sectionSummary = useMemo(() => {
    return classes.map(c => {
      const classStudents = students.filter(s => s.gradeLevel === c.name || s.classId === c.id);
      const classAttend = attendance.filter(a => {
        return classStudents.some(s => a.records[s.id]);
      });
      let present = 0, total = 0;
      classAttend.forEach(a => {
        classStudents.forEach(s => {
          if (a.records[s.id]) {
            total++;
            if (a.records[s.id] === 'P' || a.records[s.id] === 'Presente') present++;
          }
        });
      });
      const classGrades = grades.filter(g => classStudents.some(s => s.id === g.studentId));
      const gradeScores = { AD: 0, A: 0, B: 0, C: 0 };
      classGrades.forEach(g => { if (gradeScores[g.score] !== undefined) gradeScores[g.score]++; });
      const totalG = gradeScores.AD + gradeScores.A + gradeScores.B + gradeScores.C;
      const avgGrade = totalG > 0
        ? ((gradeScores.AD * 4 + gradeScores.A * 3 + gradeScores.B * 2 + gradeScores.C * 1) / totalG).toFixed(1)
        : '-';
      return {
        id: c.id,
        name: c.name,
        color: c.color || '#188038',
        students: classStudents.length,
        attendance: total > 0 ? Math.round((present / total) * 100) : 0,
        avgGrade,
        gradesCount: totalG
      };
    }).filter(c => c.students > 0);
  }, [classes, students, attendance, grades]);

  const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
        return { date: `${monthsNames[parseInt(m) - 1]} ${parseInt(day)}`, ...weekData[wk] };
      });
    }
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

  const statCards = [
    {
      icon: <Users size={22} />, title: 'Estudiantes', value: totalStudents,
      tint: ['#e8f0fe', '#1967d2'], trend: '+2', trendUp: true
    },
    {
      icon: <CheckCircle size={22} />, title: 'Asistencia', value: `${avgAttendance}%`,
      tint: ['#e6f4ea', '#188038'], trend: avgAttendance >= 80 ? 'Buena' : 'Baja', trendUp: avgAttendance >= 80
    },
    {
      icon: <TrendingUp size={22} />, title: 'Calificaciones', value: totalGrades,
      tint: ['#f3e8fd', '#7627bb'], trend: `Nivel ${totalGradesCount}`, trendUp: totalGradesCount === 'AD' || totalGradesCount === 'A'
    },
    {
      icon: <ClipboardCheck size={22} />, title: 'Instrumentos', value: instruments.length,
      tint: ['#fef7e0', '#b06000'], trend: `${pendingEvaluations} sin usar`, trendUp: pendingEvaluations === 0
    },
    {
      icon: <Star size={22} />, title: 'Nivel General', value: totalGradesCount,
      tint: ['#e4f7fb', '#007b83'], trend: totalGradesCount === 'AD' ? 'Excelente' : totalGradesCount === 'A' ? 'Bueno' : 'Mejorar', trendUp: totalGradesCount === 'AD' || totalGradesCount === 'A'
    },
    {
      icon: <CalendarCheck size={22} />, title: 'Clases Hoy', value: classesToday,
      tint: ['#e8f0fe', '#1967d2'], trend: todayName, trendUp: true
    },
  ];

  if (studentsAtRisk > 0) {
    statCards.push({
      icon: <AlertTriangle size={22} />, title: 'En Riesgo', value: studentsAtRisk,
      tint: ['#fce8e6', '#d93025'], trend: 'Asistencia <70%', trendUp: false
    });
  }

  const quickActions = [
    { icon: <CheckSquare size={20} />, label: 'Asistencia', tint: ['#e6f4ea', '#188038'], path: '/attendance' },
    { icon: <ClipboardCheck size={20} />, label: 'Evaluar', tint: ['#fef7e0', '#b06000'], path: '/instruments' },
    { icon: <BookOpen size={20} />, label: 'Calificar', tint: ['#e8f0fe', '#1967d2'], path: '/grades' },
    { icon: <Users size={20} />, label: 'Estudiantes', tint: ['#f3e8fd', '#7627bb'], path: '/students' },
    { icon: <FileText size={20} />, label: 'Planificar', tint: ['#e4f7fb', '#007b83'], path: '/planning' },
    { icon: <BarChart3 size={20} />, label: 'Reportes', tint: ['#fce8e6', '#d93025'], path: '/reports' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} style={{ minHeight: '100vh' }}>
      {/* Header */}
      <motion.div variants={fadeIn} style={{
        background: '#ffffff',
        borderRadius: '12px', padding: '1.75rem 2rem', marginBottom: '1.5rem',
        border: '1px solid #dadce0', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: '#202124', letterSpacing: '-0.02em' }}>{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Usuario'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f3f4', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500, color: '#5f6368' }}>
                <Clock size={14} />
                {timeString}
              </div>
            </div>
            <p style={{ color: '#5f6368', fontSize: '0.9rem', marginTop: '0.25rem' }}>{formattedDate}</p>
            <p style={{ color: '#80868b', fontSize: '0.85rem', fontWeight: 400, marginTop: '0.5rem', fontStyle: 'italic' }}>"{dayMessage}"</p>
          </div>
          {nextClass && (
            <motion.div whileHover={{ scale: 1.03 }} style={{
              background: '#e8f0fe', padding: '1rem 1.5rem', borderRadius: '12px',
              cursor: 'pointer'
            }} onClick={() => navigate('/attendance')}>
              <p style={{ fontSize: '0.75rem', color: '#1967d2', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                <Clock size={14} /> Proxima clase
              </p>
              <p style={{ fontWeight: 500, fontSize: '1rem', color: '#202124' }}>{nextClass.subjectName}</p>
              <p style={{ fontSize: '0.8rem', color: '#5f6368' }}>{nextClass.className} - {nextClass.time}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card"
            style={{ padding: '1.25rem', cursor: 'pointer', background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', boxShadow: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: stat.tint[0],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.tint[1]
              }}>
                {stat.icon}
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 500,
                padding: '0.2rem 0.6rem', borderRadius: '10px',
                background: stat.trendUp ? '#e6f4ea' : '#fce8e6',
                color: stat.trendUp ? '#188038' : '#d93025'
              }}>
                {stat.trend}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 500, color: '#202124', lineHeight: 1.2 }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#5f6368', marginTop: '0.25rem' }}>{stat.title}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeIn} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 500, color: '#5f6368', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesos Rapidos
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {quickActions.map((action, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#ffffff', border: '1px solid #dadce0',
                borderRadius: '20px', padding: '0.55rem 1.1rem',
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: action.tint[0], color: action.tint[1],
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {action.icon}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043' }}>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Birthday Section */}
      {birthdayData.total > 0 && (
        <motion.div variants={fadeIn} style={{
          background: '#ffffff',
          borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem',
          border: '1px solid #dadce0',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#fce8e6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cake size={22} color="#d93025" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0, color: '#202124' }}>Proximos Cumpleanos</h3>
              <p style={{ fontSize: '0.8rem', color: '#5f6368', margin: 0 }}>{birthdayData.total} estudiante(s) registrados</p>
            </div>
          </div>
          {birthdayData.todayBirthdays.length > 0 && (
            <div style={{
              background: '#fef7e0', borderRadius: '12px',
              padding: '1rem', marginBottom: '0.75rem'
            }}>
              <p style={{ fontWeight: 500, color: '#b06000', fontSize: '0.85rem', marginBottom: '0.5rem' }}>HOY ES SU CUMPLEANOS!</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {birthdayData.todayBirthdays.map(student => (
                  <div key={student.id} style={{
                    background: '#ffffff', borderRadius: '16px',
                    padding: '0.5rem 1rem', fontWeight: 500, fontSize: '0.9rem', color: '#202124'
                  }}>
                    {student.name}
                    {student.gradeLevel && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#5f6368', marginLeft: '0.5rem' }}>{student.gradeLevel}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {birthdayData.thisWeek.length > 0 && (
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#5f6368', marginBottom: '0.5rem' }}>Esta semana:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {birthdayData.thisWeek.map(student => (
                  <div key={student.id} style={{
                    background: '#f1f3f4', borderRadius: '16px',
                    padding: '0.4rem 0.85rem', fontSize: '0.8rem'
                  }}>
                    <span style={{ fontWeight: 500, color: '#202124' }}>{student.name}</span>
                    {student.gradeLevel && <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#5f6368', marginLeft: '0.35rem' }}>{student.gradeLevel}</span>}
                    <span style={{ color: '#1967d2', marginLeft: '0.4rem', fontWeight: 500, fontSize: '0.75rem' }}>
                      {student.daysUntil === 1 ? 'Manana!' : `En ${student.daysUntil} dias`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Schedule + Top Instruments + Activity */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Today Schedule */}
        <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1.25rem', color: '#202124', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} color="#188038" />
            </div>
            Horario de Hoy
            <span style={{ fontSize: '0.8rem', color: '#5f6368', fontWeight: 400, marginLeft: 'auto' }}>({todayName})</span>
          </h3>
          {todaySchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '12px', border: '2px dashed #dadce0' }}>
              <Calendar size={32} color="#9aa0a6" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ color: '#5f6368', fontSize: '0.9rem' }}>No tienes clases programadas para hoy.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {todaySchedule.map((item, idx) => {
                let className, subjectName;
                if (item.classId === '__ATENCION__') { className = 'ATENCION AL PADRE DE FAMILIA'; subjectName = ''; }
                else if (item.classId === '__TRABAJO__') { className = 'TRABAJO COLEGIADO'; subjectName = ''; }
                else {
                  className = classes.find(c => c.id === item.classId)?.name || 'Grado...';
                  subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Area...';
                }
                const timesDisplay = item.times.length > 1 ? item.times.join(' y ') : item.time;
                const now = currentTime.getHours() * 60 + currentTime.getMinutes();
                const startTime = item.time.split(' - ')[0];
                const [h, m] = startTime.split(':').map(Number);
                const classTime = h < 7 ? (h + 12) * 60 + m : h * 60 + m;
                const isPast = classTime + 15 < now;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.85rem', background: '#f8f9fa', borderRadius: '12px',
                      borderLeft: `4px solid ${isPast ? '#9aa0a6' : item.color || '#188038'}`,
                      opacity: isPast ? 0.6 : 1, transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ fontWeight: 500, minWidth: '120px', fontSize: '0.8rem', color: '#5f6368' }}>{timesDisplay}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#202124' }}>{className}</div>
                        {subjectName && <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>{subjectName}</div>}
                      </div>
                    </div>
                    {!isPast ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/attendance?class=${encodeURIComponent(className)}`)}
                        style={{
                          padding: '0.4rem 0.85rem', background: '#188038',
                          border: 'none', borderRadius: '16px', color: 'white', fontSize: '0.7rem',
                          fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <CalendarCheck size={12} /> Asistencia
                      </motion.button>
                    ) : (
                      <div style={{
                        padding: '0.4rem 0.85rem', background: '#e6f4ea',
                        border: 'none', borderRadius: '16px',
                        color: '#188038', fontSize: '0.7rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                      }} onClick={() => navigate(`/attendance?class=${encodeURIComponent(className)}`)}>
                        <CheckCircle size={12} /> Asistencia registrada
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>




      </motion.div>

      {/* Section Summary */}
      {sectionSummary.length > 0 && (
        <motion.div variants={fadeIn} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#202124', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#7627bb" />
            </div>
            Resumen por Seccion
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {sectionSummary.map((section, idx) => (
              <motion.div
                key={section.id}
                whileHover={{ y: -4 }}
                className="glass-card"
                style={{ padding: '1rem', cursor: 'pointer', background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px', boxShadow: 'none', borderTop: `3px solid ${section.color}` }}
                onClick={() => navigate('/students')}
              >
                <div style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.5rem', color: '#202124' }}>{section.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5f6368' }}>
                  <span>{section.students} estudiantes</span>
                  <span style={{ fontWeight: 500, color: section.attendance >= 80 ? '#188038' : '#d93025' }}>{section.attendance}% asist.</span>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#5f6368' }}>Nivel: <strong>{section.avgGrade}</strong></span>
                  <span style={{ fontSize: '0.65rem', color: '#5f6368' }}>{section.gradesCount} calif.</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Attendance Charts */}
      {attendanceChartData.length > 0 && (
        <motion.div variants={fadeIn} style={{ marginBottom: '1.5rem' }}>
          <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ color: '#202124', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={18} color="#188038" />
                  </div>
                  Asistencia
                </h3>
                <select value={attendanceClass} onChange={e => setAttendanceClass(e.target.value)}
                  style={{ padding: '0.45rem 1rem', borderRadius: '20px', border: '1px solid #dadce0', fontSize: '0.8rem', fontWeight: 500, color: '#3c4043', background: '#ffffff', cursor: 'pointer', outline: 'none' }}>
                  <option value="">Todas las secciones</option>
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f3f4', borderRadius: '20px', padding: '3px' }}>
                {[{ key: 'daily', label: 'Diario' }, { key: 'weekly', label: 'Semanal' }, { key: 'monthly', label: 'Mensual' }].map(v => (
                  <button key={v.key} onClick={() => setAttendanceView(v.key)} style={{
                    padding: '6px 14px', border: 'none', borderRadius: '18px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
                    background: attendanceView === v.key ? '#ffffff' : 'transparent',
                    boxShadow: attendanceView === v.key ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    color: attendanceView === v.key ? '#1967d2' : '#5f6368', transition: 'all 0.2s'
                  }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceChartData} barCategoryGap="20%">
                <ChartGradients />
                <CartesianGrid strokeDasharray="0" stroke="#e8eaed" opacity={0.4} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dx={-4} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26, 115, 232, 0.06)' }} />
                <Bar dataKey="P" stackId="a" fill="url(#gradPresent)" name="Presente" radius={[0, 0, 0, 0]} />
                <Bar dataKey="T" stackId="a" fill="url(#gradLate)" name="Tarde" radius={[0, 0, 0, 0]} />
                <Bar dataKey="J" stackId="a" fill="url(#gradJustified)" name="Justificado" radius={[0, 0, 0, 0]} />
                <Bar dataKey="F" stackId="a" fill="url(#gradAbsent)" name="Falta" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {attendancePresentRate.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 500, color: '#5f6368', marginBottom: '0.75rem' }}>% de Asistencia</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={attendancePresentRate}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#188038" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#188038" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="#e8eaed" opacity={0.3} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dy={6} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dx={-4} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone" dataKey="rate" name="% Asistencia"
                      stroke="#188038" strokeWidth={2.5}
                      dot={{ fill: '#188038', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#188038', fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Grade Stats */}
      {(grades.length > 0 || diagnosticEvaluations.length > 0 || instrumentEvaluations.length > 0) && (
        <motion.div variants={fadeIn} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: '#202124', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="#7627bb" />
            </div>
            Estadisticas de Calificaciones
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Levels General */}
            <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 500, color: '#202124' }}>Niveles de Logro (General)</h4>
              {gradesByLevel.some(g => g.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByLevel.filter(g => g.value > 0)} layout="vertical" barCategoryGap="25%">
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="0" stroke="#e8eaed" opacity={0.3} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dx={-4} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26, 115, 232, 0.06)' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                      {gradesByLevel.filter(g => g.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#grad${entry.name.charAt(0)})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#5f6368', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>Registra calificaciones para ver estadisticas</p>
              )}
            </div>

            {/* By Class */}
            <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 500, color: '#202124' }}>Calificaciones por Grado</h4>
              {gradesByClass.some(g => g.ad + g.a + g.b + g.c > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradesByClass} barCategoryGap="25%">
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="0" stroke="#e8eaed" opacity={0.3} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} dx={-4} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26, 115, 232, 0.06)' }} />
                    <Bar dataKey="ad" stackId="a" fill="url(#gradAD)" name="AD" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="a" stackId="a" fill="url(#gradA)" name="A" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="b" stackId="a" fill="url(#gradB)" name="B" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="c" stackId="a" fill="url(#gradC)" name="C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#5f6368', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>Registra calificaciones para ver estadisticas</p>
              )}
            </div>

            {/* Subject Performance Radar */}
            {subjectPerformance.length > 2 && (
              <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 500, color: '#202124' }}>Rendimiento por Asignatura</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={subjectPerformance} cx="50%" cy="50%" outerRadius="70%">
                    <ChartGradients />
                    <PolarGrid stroke="#e8eaed" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9aa0a6' }} />
                    <PolarRadiusAxis domain={[0, 4]} tick={false} axisLine={false} />
                    <Radar name="Promedio" dataKey="promedio" stroke="#7627bb" strokeWidth={2.5} fill="url(#gradRadar)" dot={{ r: 4, fill: '#7627bb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#7627bb', stroke: '#fff', strokeWidth: 2 }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Diagnostic Pie */}
            {diagnosticStats.length > 0 && (
              <div className="dashboard-card" style={{ background: '#ffffff', border: '1px solid #dadce0', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 500, color: '#202124' }}>Evaluacion Diagnostica</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={diagnosticStats} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={95}
                      paddingAngle={4} dataKey="value"
                      stroke="#ffffff" strokeWidth={2}
                      animationBegin={0} animationDuration={800} animationEasing="ease-out"
                    >
                      {diagnosticStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
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
        </motion.div>
      )}

      {/* Empty State */}
      {(grades.length === 0 && diagnosticEvaluations.length === 0 && instrumentEvaluations.length === 0 && attendance.length === 0) && (
        <motion.div variants={fadeIn} style={{
          background: '#ffffff',
          borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', border: '2px dashed #dadce0'
        }}>
          <div style={{
            width: '80px', height: '80px',
            background: '#e8f0fe',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>
            <BarChart3 size={40} color="#1967d2" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#202124', marginBottom: '0.5rem' }}>Comienza a registrar datos</h3>
          <p style={{ color: '#5f6368', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Los graficos y estadisticas apareceran aqui cuando registres asistencia, calificaciones o evaluaciones.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/attendance')}
              style={{
                padding: '0.75rem 1.5rem', background: '#188038',
                border: 'none', borderRadius: '20px', color: 'white', fontWeight: 500, cursor: 'pointer'
              }}
            >
              Registrar Asistencia
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/grades')}
              style={{
                padding: '0.75rem 1.5rem', background: '#1a73e8',
                border: 'none', borderRadius: '20px', color: 'white', fontWeight: 500, cursor: 'pointer'
              }}
            >
              Ingresar Calificaciones
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
