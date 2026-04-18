import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Info, ClipboardCheck, FileText, CheckSquare, BarChart2, Eye, BookOpen, MessageSquare, Star, Grid, X, Calendar, GraduationCap, Users, BookMarked, Target, TrendingUp, Trophy } from 'lucide-react';

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
    const selectedClassObj = classes.find(c => c.name === selectedClass);
    return students.filter(s => s.gradeLevel === selectedClass || s.classId === selectedClass || s.classId === selectedClassObj?.name);
  }, [students, selectedClass, classes]);

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

  // Estadísticas para los widgets
  const gradeStats = useMemo(() => {
    if (!selectedClass || !selectedSubjectId) return null;
    
    const counts = { AD: 0, A: 0, B: 0, C: 0 };
    let total = 0;
    
    filteredStudents.forEach(student => {
      currentSubject?.competencies?.forEach(comp => {
        const ev = instrumentEvaluations.find(
          e => e.studentId === student.id && e.competencyId === comp.id && e.period === selectedPeriod
        );
        if (ev && counts[ev.qualitative] !== undefined) {
          counts[ev.qualitative]++;
          total++;
        }
      });
    });

    const adRate = total > 0 ? Math.round((counts.AD / total) * 100) : 0;
    const successRate = total > 0 ? Math.round(((counts.AD + counts.A) / total) * 100) : 0;

    return {
      counts,
      total,
      adRate,
      successRate,
      totalStudents: filteredStudents.length,
      evaluatedStudents: new Set(
        instrumentEvaluations
          .filter(e => e.period === selectedPeriod && filteredStudents.some(s => s.id === e.studentId))
          .map(e => e.studentId)
      ).size
    };
  }, [selectedClass, selectedSubjectId, selectedPeriod, filteredStudents, currentSubject, instrumentEvaluations]);

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
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
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Visualiza las evaluaciones por estudiante</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de selección */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Grado y sección</div>
            </div>
          </div>
          <select
            className="input-field"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubjectId(''); }}
            style={{ borderColor: selectedClass ? '#10b981' : '#e2e8f0' }}
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Periodo de evaluación</div>
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Materia a evaluar</div>
            </div>
          </div>
          <select
            className="input-field"
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClass}
            style={{ borderColor: selectedSubjectId ? '#8b5cf6' : '#e2e8f0' }}
          >
            <option value="">Seleccionar materia...</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Widgets de estadísticas animados */}
      {selectedClass && selectedSubjectId && gradeStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Total de evaluaciones */}
          <div style={{
            background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)'; }}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardCheck size={28} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{gradeStats.total}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Evaluaciones</div>
              </div>
            </div>
          </div>

          {/* Alumnos evaluados */}
          <div style={{
            background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)'; }}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={28} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{gradeStats.evaluatedStudents}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Alumnos Evaluados</div>
              </div>
            </div>
          </div>

          {/* Tasa de éxito */}
          <div style={{
            background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 158, 11, 0.4)'; }}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={28} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{gradeStats.successRate}%</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Tasa de Éxito</div>
              </div>
            </div>
          </div>

          {/* Nivel destacado */}
          <div style={{
            background: 'linear-gradient(145deg, #ec4899 0%, #db2777 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(236, 72, 153, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(236, 72, 153, 0.4)'; }}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={28} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{gradeStats.adRate}%</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Nivel AD</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty states */}
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

      {/* Main table */}
      {selectedClass && selectedSubjectId && currentSubject && (
        <>
          {/* Info banner moderno */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
            fontSize: '0.9rem', color: 'var(--text-secondary)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Info size={18} color="white" />
            </div>
            <span>Cada columna representa un instrumento aplicado. <strong style={{ color: '#667eea' }}>Haz clic en la nota</strong> para ver el detalle.</span>
          </div>

          {/* Obtener todas las evaluaciones agrupadas por estudiante y competencia */}
          {(() => {
            const getInstrumentsForCompetency = (competencyId) => {
              // Solo obtener evaluaciones de estudiantes de la clase seleccionada
              const studentIds = new Set(filteredStudents.map(s => s.id));
              const evs = instrumentEvaluations.filter(
                ev => ev.competencyId === competencyId && 
                      ev.period === selectedPeriod &&
                      studentIds.has(ev.studentId)
              );
              
              const uniqueInstruments = {};
              evs.forEach(ev => {
                const key = ev.activityName || ev.instrumentId;
                if (!uniqueInstruments[key]) {
                  uniqueInstruments[key] = {
                    id: key,
                    title: ev.activityName || instruments.find(i => i.id === ev.instrumentId)?.title || 'Sin título',
                    instrumentType: ev.instrumentType
                  };
                }
              });
              return Object.values(uniqueInstruments);
            };

            const gradientColors = [
              ['#10b981', '#059669'],
              ['#3b82f6', '#2563eb'],
              ['#f59e0b', '#d97706'],
              ['#ef4444', '#dc2626'],
              ['#8b5cf6', '#7c3aed'],
              ['#ec4899', '#db2777']
            ];

            return (
              <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div className="table-container" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <table className="styled-table" style={{ tableLayout: 'auto', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        minWidth: '200px', 
                        position: 'sticky', 
                        left: 0, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        zIndex: 10,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} />
                          Estudiante
                        </div>
                      </th>
                      {currentSubject.competencies.map((comp, idx) => {
                        const instruments = getInstrumentsForCompetency(comp.id);
                        const [color1, color2] = gradientColors[idx % gradientColors.length];
                        if (instruments.length === 0) {
                          return (
                            <th key={comp.id} style={{ 
                              textAlign: 'center', 
                              minWidth: '100px', 
                              fontSize: '0.8rem',
                              background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
                              color: 'white',
                              padding: '1rem'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <Target size={14} />
                                {comp.name}
                              </div>
                            </th>
                          );
                        }
                        return (
                          <th key={comp.id} colSpan={instruments.length} style={{ 
                            textAlign: 'center', 
                            minWidth: instruments.length * 80, 
                            fontSize: '0.8rem',
                            background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
                            color: 'white',
                            padding: '1rem'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <Target size={14} />
                              {comp.name}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      <th style={{ 
                        minWidth: '200px', 
                        position: 'sticky', 
                        left: 0, 
                        background: '#f8fafc', 
                        zIndex: 10,
                        padding: '0.75rem 1rem',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Instrumentos aplicados</span>
                      </th>
                      {currentSubject.competencies.map((comp, idx) => {
                        const instruments = getInstrumentsForCompetency(comp.id);
                        const [color1, color2] = gradientColors[idx % gradientColors.length];
                        if (instruments.length === 0) {
                          return (
                            <th key={comp.id} style={{ 
                              textAlign: 'center', 
                              fontSize: '0.7rem', 
                              color: '#64748b',
                              background: '#f8fafc',
                              padding: '0.75rem',
                              borderBottom: '2px solid #e2e8f0'
                            }}>
                              —
                            </th>
                          );
                        }
                        return instruments.map(inst => (
                          <th key={inst.id} style={{ 
                            textAlign: 'center', 
                            minWidth: '80px', 
                            fontSize: '0.7rem', 
                            color: '#64748b',
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderBottom: '2px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <ClipboardCheck size={12} />
                              {inst.title.length > 12 ? inst.title.substring(0, 12) + '...' : inst.title}
                            </div>
                          </th>
                        ));
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={100} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No hay estudiantes matriculados en esta sección.
                        </td>
                      </tr>
                    )}
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 5 }}>{student.name}</td>
                        {currentSubject.competencies.map(comp => {
                          const instruments = getInstrumentsForCompetency(comp.id);
                          if (instruments.length === 0) {
                            return (
                              <td key={comp.id} style={{ textAlign: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                              </td>
                            );
                          }
                          return instruments.map(inst => {
                            const ev = instrumentEvaluations.find(
                              e => e.studentId === student.id && e.competencyId === comp.id && (e.activityName || e.instrumentId) === inst.id && e.period === selectedPeriod
                            );
                            if (!ev) {
                              return (
                                <td key={inst.id} style={{ textAlign: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                                </td>
                              );
                            }
                            return (
                              <td key={inst.id} style={{ textAlign: 'center', cursor: 'pointer', padding: '0.5rem' }}
                                onMouseEnter={(e) => handleMouseEnterCell(e, [ev])}
                                onMouseLeave={handleMouseLeaveCell}
                                onClick={() => { setViewingEvaluation(ev); setHoveredEval(null); }}
                              >
                                <span className={`badge ${BADGE_THEME[ev.qualitative]}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ev.qualitative}</span>
                              </td>
                            );
                          });
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            );
          })()}

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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span className={`badge ${BADGE_THEME[ev.qualitative]}`} style={{ fontWeight: 700, fontSize: '1rem' }}>
                                  {ev.qualitative} – {GRADE_LABEL[ev.qualitative]}
                                </span>
                              </div>
                            </div>

                            {/* Criterios evaluados */}
                            {evalCriteria.length > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {evalCriteria.map((c, idx) => {
                                    const scoreValue = ev.scores?.[c.id];
                                    let displayValue = '—';
                                    let bgColor = 'transparent';
                                    let borderColor = 'var(--border-color)';

                                    if (ev.instrumentType === 'checklist') {
                                      displayValue = scoreValue ? '✅' : '❌';
                                      bgColor = scoreValue ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
                                      borderColor = scoreValue ? '#10b98150' : '#ef444450';
                                    } else if (ev.instrumentType === 'observation') {
                                      displayValue = scoreValue === 3 ? '🟢' : scoreValue === 2 ? '🟡' : '🔴';
                                      bgColor = scoreValue === 3 ? 'rgba(16,185,129,0.1)' : scoreValue === 2 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
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

                  {/* Footer del modal */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                  }}>
                    <button 
                      onClick={() => setTooltip(null)}
                      className="btn-primary"
                      style={{ padding: '0.6rem 1.5rem' }}
                    >
                      Cerrar
                    </button>
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

                {viewingEvaluation.scores && Object.keys(viewingEvaluation.scores).filter(k => !k.startsWith('__')).length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      Criterios Evaluados
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Object.entries(viewingEvaluation.scores).map(([criterionId, score]) => {
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
