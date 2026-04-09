import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Info, ClipboardCheck, FileText, CheckSquare, BarChart2, Eye, BookOpen, MessageSquare, Star, Grid, X, Calendar, GraduationCap, Users, BookMarked, BarChart3, Trophy, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

  const [tooltip, setTooltip] = useState(null); // { studentId, competencyId, evs, position: { x, y } }
  const [hoveredEval, setHoveredEval] = useState(null); // { evaluation, position: { x, y } }
  const [viewingEvaluation, setViewingEvaluation] = useState(null);

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

  const getInstrumentsForCompetency = (competencyId) => {
    const evs = instrumentEvaluations.filter(
      ev => (ev.competencyId === competencyId || ev.competency_id === competencyId) && ev.period === selectedPeriod
    );
    
    const uniqueInstruments = {};
    evs.forEach(ev => {
      const activityKey = ev.activityName || ev.activity_name || '';
      const instrumentKey = ev.instrumentId || ev.instrument_id || '';
      const key = activityKey || instrumentKey;
      
      if (!uniqueInstruments[key]) {
        uniqueInstruments[key] = {
          id: key,
          title: activityKey || instruments.find(i => i.id === instrumentKey)?.title || 'Sin título',
          instrumentType: ev.instrumentType || ev.instrument_type,
          activityKey,
          instrumentKey
        };
      }
    });
    return Object.values(uniqueInstruments);
  };

  const gradeDistribution = useMemo(() => {
    if (!selectedClass || !selectedSubjectId) return null;
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    let totalEvaluations = 0;
    
    filteredStudents.forEach(student => {
      currentSubject.competencies.forEach(comp => {
        const instruments = getInstrumentsForCompetency(comp.id);
        instruments.forEach(inst => {
          const activityKey = inst.activityKey || inst.id || '';
          const matchingEvs = instrumentEvaluations.filter(e => {
            const studentMatch = e.studentId === student.id || e.student_id === student.id;
            const competencyMatch = e.competencyId === comp.id || e.competency_id === comp.id;
            const periodMatch = String(e.period) === String(selectedPeriod);
            const activityMatch = 
              e.activityName === activityKey || 
              e.activity_name === activityKey ||
              e.instrumentId === activityKey ||
              e.instrument_id === activityKey;
            return studentMatch && competencyMatch && periodMatch && activityMatch;
          });
          if (matchingEvs[0]) {
            const grade = matchingEvs[0].qualitative;
            if (counts[grade] !== undefined) counts[grade]++;
            totalEvaluations++;
          }
        });
      });
    });
    
    return [
      { name: 'AD - Destacado', value: counts.AD, color: '#10b981', icon: '🏆' },
      { name: 'A - Logrado', value: counts.A, color: '#3b82f6', icon: '⭐' },
      { name: 'B - En Proceso', value: counts.B, color: '#f59e0b', icon: '📈' },
      { name: 'C - En Inicio', value: counts.C, color: '#ef4444', icon: '🎯' },
    ].map(item => ({
      ...item,
      percentage: totalEvaluations > 0 ? Math.round((item.value / totalEvaluations) * 100) : 0
    }));
  }, [selectedClass, selectedSubjectId, selectedPeriod, filteredStudents, currentSubject, instrumentEvaluations]);

  const classStats = useMemo(() => {
    if (!selectedClass) return null;
    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    return {
      totalStudents: classStudents.length,
      withEvaluations: filteredStudents.filter(s => {
        return currentSubject?.competencies.some(comp => {
          const evs = instrumentEvaluations.filter(e => 
            (e.studentId === s.id || e.student_id === s.id) &&
            (e.competencyId === comp.id || e.competency_id === comp.id) &&
            String(e.period) === String(selectedPeriod)
          );
          return evs.length > 0;
        });
      }).length
    };
  }, [selectedClass, students, filteredStudents, currentSubject, selectedPeriod, instrumentEvaluations]);

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente colorido */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <GraduationCap size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Calificaciones</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Visualiza y gestiona las evaluaciones por estudiante</p>
          </div>
        </div>
      </div>

      {/* Selector visual de filtros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Tarjeta de Sección */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '2px solid',
          borderColor: selectedClass ? '#10b981' : '#e2e8f0',
          transition: 'all 0.3s ease',
          boxShadow: selectedClass ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: selectedClass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color={selectedClass ? '#10b981' : '#6366f1'} />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sección</label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Grado y sección</div>
            </div>
          </div>
          <select
            className="input-field"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubjectId(''); }}
            style={{
              borderColor: selectedClass ? '#10b981' : '#e2e8f0',
              background: selectedClass ? 'rgba(16, 185, 129, 0.05)' : 'white'
            }}
          >
            <option value="">Seleccionar sección...</option>
            {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* Tarjeta de Bimestre */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '2px solid #e2e8f0',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} color="#f59e0b" />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bimestre</label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Periodo de evaluación</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(String(p))}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedPeriod === String(p) ? '#f59e0b' : '#f1f5f9',
                  color: selectedPeriod === String(p) ? 'white' : 'var(--text-secondary)'
                }}
              >
                B{p}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta de Materia */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '2px solid',
          borderColor: selectedSubjectId ? '#8b5cf6' : '#e2e8f0',
          transition: 'all 0.3s ease',
          boxShadow: selectedSubjectId ? '0 4px 20px rgba(139, 92, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
          opacity: !selectedClass ? 0.6 : 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: selectedSubjectId ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookMarked size={20} color={selectedSubjectId ? '#8b5cf6' : '#6366f1'} />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Área Curricular</label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Materia a evaluar</div>
            </div>
          </div>
          <select
            className="input-field"
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClass}
            style={{
              borderColor: selectedSubjectId ? '#8b5cf6' : '#e2e8f0',
              background: selectedSubjectId ? 'rgba(139, 92, 246, 0.05)' : 'white'
            }}
          >
            <option value="">Seleccionar materia...</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Estado vacío inicial */}
      {!selectedClass && (
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <GraduationCap size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Bienvenido al módulo de calificaciones
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona una sección para comenzar a visualizar las calificaciones de tus estudiantes
          </p>
        </div>
      )}

      {selectedClass && !selectedSubjectId && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px solid #fbbf24'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <BookOpen size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Selecciona una materia
          </h3>
          <p style={{ color: '#92400e', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Elige el área curricular para ver las competencias y evaluaciones disponibles
          </p>
        </div>
      )}

      {/* Panel de estadísticas */}
      {selectedClass && selectedSubjectId && currentSubject && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Gráfico circular de distribución */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} color="white" />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Distribución de Notas</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Bimestre {selectedPeriod}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ResponsiveContainer width="50%" height={140}>
                <PieChart>
                  <Pie
                    data={gradeDistribution?.filter(g => g.value > 0) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {gradeDistribution?.filter(g => g.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(gradeDistribution || [{ name: 'AD - Destacado', value: 0, color: '#10b981', percentage: 0 }, { name: 'A - Logrado', value: 0, color: '#3b82f6', percentage: 0 }, { name: 'B - En Proceso', value: 0, color: '#f59e0b', percentage: 0 }, { name: 'C - En Inicio', value: 0, color: '#ef4444', percentage: 0 }]).map((grade, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    background: grade.value > 0 ? `${grade.color}12` : '#f8fafc'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: grade.color
                    }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, flex: 1 }}>{grade.name.split(' - ')[0]}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: grade.color }}>{grade.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen de estudiantes */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color="white" />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Resumen de Sección</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{selectedClass}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{classStats?.totalStudents || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total Alumnos</div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{classStats?.withEvaluations || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Con Evaluaciones</div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                textAlign: 'center',
                gridColumn: 'span 2'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{currentSubject.competencies.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Competencias en {currentSubject.name}</div>
              </div>
            </div>
          </div>

          {/* Indicadores de rendimiento */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="white" />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Rendimiento</h4>
                <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>Bimestre {selectedPeriod}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(() => {
                const dist = gradeDistribution || [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
                const total = dist.reduce((sum, g) => sum + g.value, 0);
                const adRate = total > 0 ? Math.round((dist[0].value / total) * 100) : 0;
                const successRate = total > 0 ? Math.round(((dist[0].value + dist[1].value) / total) * 100) : 0;
                return (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Tasa de Éxito</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{successRate}%</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Nivel Destacado</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{adRate}%</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Evaluaciones</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{total}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Main table */}
      {selectedClass && selectedSubjectId && currentSubject && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
            fontSize: '0.9rem', color: 'var(--text-secondary)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Target size={16} color="white" />
            </div>
            <span>Cada columna representa un instrumento aplicado. <strong style={{ color: '#667eea' }}>Haz clic en la nota</strong> para ver el detalle completo.</span>
          </div>

          <div style={{ 
            overflowX: 'auto',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 25px rgba(0,0,0,0.08)',
            background: 'white'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              tableLayout: 'auto'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white',
                    fontWeight: 700,
                    textAlign: 'left'
                  }}>
                    Estudiante
                  </th>
                  {(currentSubject.competencies || []).map((comp, idx) => (
                    <th key={comp.id} style={{ 
                      padding: '1rem',
                      background: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5],
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={100} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No hay estudiantes en esta sección
                    </td>
                  </tr>
                )}
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                      {student.name}
                    </td>
                    {(currentSubject.competencies || []).map(comp => (
                      <td key={comp.id} style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        —
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tooltip && (
        <div>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999
          }} onClick={() => setTooltip(null)} />
          <div style={{
            position: 'fixed',
            top: tooltip.position.y + tooltip.position.height + 8,
            left: Math.min(tooltip.position.x, window.innerWidth - 670),
            maxWidth: '650px', width: '100%', zIndex: 1000,
          }}>
            <div className="card shadow-glass animate-fade-in" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 100%)' }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1.2rem' }}>{tooltip.studentName}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {currentSubject?.name} · {tooltip.compName} · Bimestre {selectedPeriod}
                  </p>
                </div>
                <button onClick={() => setTooltip(null)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {tooltip.evs.map((ev) => {
                    const originalInstrument = instruments.find(i => i.id === ev.instrumentId);
                    const instrumentType = ev.instrumentType || originalInstrument?.type || 'checklist';
                    const InstrumentIcon = TYPE_ICONS[instrumentType] || ClipboardCheck;
                    const evalCriteria = (() => {
                      if (ev.criteria && Array.isArray(ev.criteria) && ev.criteria.length > 0) return ev.criteria;
                      if (typeof ev.criteria === 'string') {
                        try { const parsed = JSON.parse(ev.criteria); if (Array.isArray(parsed) && parsed.length > 0) return parsed; } catch (e) {}
                      }
                      if (originalInstrument?.criteria && Array.isArray(originalInstrument.criteria)) return originalInstrument.criteria;
                      return [];
                    })();
                    const typeColors = { checklist: '#10b981', scale: '#3b82f6', rubric: '#8b5cf6', observation: '#f59e0b', written: '#ef4444', selfeval: '#ec4899', portfolio: '#14b8a6', anecdotal: '#6366f1' };
                    const typeColor = typeColors[instrumentType] || '#6366f1';
                    return (
                      <div key={ev.id} style={{ border: `2px solid ${typeColor}40`, borderRadius: '14px', padding: '1rem', background: `${typeColor}08` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: `${typeColor}20`, padding: '0.6rem', borderRadius: '10px', border: `1px solid ${typeColor}40` }}>
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
                          <span className={`badge ${BADGE_THEME[ev.qualitative]}`} style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {ev.qualitative} – {GRADE_LABEL[ev.qualitative]}
                          </span>
                        </div>
                        {evalCriteria.length > 0 && (
                          <div>
                            {evalCriteria.map((c, idx) => {
                              const scoreValue = ev.scores?.[c.id];
                              let displayValue = '—', bgColor = 'transparent', borderColor = 'var(--border-color)';
                              if (ev.instrumentType === 'checklist') {
                                displayValue = scoreValue ? '✅' : '❌';
                                bgColor = scoreValue ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
                                borderColor = scoreValue ? '#10b98150' : '#ef444450';
                              } else if (typeof scoreValue === 'number') {
                                const levelMap = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };
                                const levelColors = { 4: '#10b981', 3: '#3b82f6', 2: '#f59e0b', 1: '#ef4444' };
                                displayValue = levelMap[scoreValue] || '—';
                                bgColor = levelColors[scoreValue] ? `${levelColors[scoreValue]}15` : 'transparent';
                                borderColor = levelColors[scoreValue] ? `${levelColors[scoreValue]}50` : 'var(--border-color)';
                              }
                              return (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: '8px', background: bgColor, border: `1px solid ${borderColor}`, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 500, flex: 1 }}>{idx + 1}. {c.text}</span>
                                  <span style={{ fontWeight: 700, marginLeft: '0.75rem' }}>{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setTooltip(null)} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingEvaluation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', zIndex: 1000 }}>
          <div style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ background: viewingEvaluation.qualitative === 'AD' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : viewingEvaluation.qualitative === 'A' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : viewingEvaluation.qualitative === 'B' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '2rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>{viewingEvaluation.qualitative}</div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{GRADE_LABEL[viewingEvaluation.qualitative]}</h3>
                    <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>{viewingEvaluation.activityName || 'Sin actividad'}</p>
                  </div>
                </div>
                <button onClick={() => setViewingEvaluation(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {viewingEvaluation.studentName?.split(' ').map(n => n[0]).slice(0, 2).join('') || '??'}
                </div>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{viewingEvaluation.studentName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{viewingEvaluation.subjectName} · Bimestre {viewingEvaluation.period}</p>
                </div>
              </div>
              {viewingEvaluation.score !== null && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: viewingEvaluation.qualitative === 'AD' ? '#10b981' : viewingEvaluation.qualitative === 'A' ? '#3b82f6' : viewingEvaluation.qualitative === 'B' ? '#f59e0b' : '#ef4444' }}>{viewingEvaluation.score}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Puntaje Obtenido</div>
                  </div>
                  <div style={{ width: '1px', background: '#e2e8f0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{viewingEvaluation.maxPossible || 20}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Puntaje Máximo</div>
                  </div>
                </div>
              )}
              {viewingEvaluation.scores?.__note__ && (
                <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#6366f1', marginBottom: '0.5rem' }}>Nota del docente:</h4>
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>{viewingEvaluation.scores.__note__}</p>
                </div>
              )}
              <button style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewingEvaluation(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
