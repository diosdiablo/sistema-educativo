import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Save, Users, Calendar, CheckCircle, Clock, XCircle, FileCheck, GraduationCap, PieChart, UserCheck } from 'lucide-react';

export default function Attendance() {
  const { students, classes, attendance, saveAttendanceDate, currentUser, isAdmin } = useStore();
  const [searchParams] = useSearchParams();
  
  const availableClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (!currentUser?.assignments) return [];
    const classIds = [...new Set(currentUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [isAdmin, currentUser, classes]);

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    const classParam = searchParams.get('class');
    if (classParam && availableClasses.some(c => c.name === classParam)) {
      setSelectedClass(classParam);
    }
  }, [searchParams, availableClasses]);
  
  const selectedDateRecord = attendance.find(a => a.date === date);
  const [currentRecords, setCurrentRecords] = useState(selectedDateRecord?.records || {});

  useEffect(() => {
    setCurrentRecords(selectedDateRecord?.records || {});
  }, [date, selectedDateRecord]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.gradeLevel === selectedClass);
  }, [students, selectedClass]);

  // Estadísticas consolidadas de TODAS las fechas para el grado seleccionado
  const attendanceStats = useMemo(() => {
    if (!selectedClass || filteredStudents.length === 0) return null;
    
    // Obtener TODOS los registros de asistencia para estudiantes de este grado
    const allRecords = attendance.filter(record => {
      return filteredStudents.some(student => record.records && record.records[student.id]);
    });

    const stats = { P: 0, T: 0, F: 0, J: 0 };
    const datesCount = allRecords.length;
    
    allRecords.forEach(record => {
      filteredStudents.forEach(student => {
        const status = record.records?.[student.id];
        if (status && stats[status] !== undefined) {
          stats[status]++;
        }
      });
    });

    const totalMarked = stats.P + stats.T + stats.F + stats.J;
    const presentRate = totalMarked > 0 ? Math.round(((stats.P + stats.T + stats.J) / totalMarked) * 100) : 0;

    return {
      ...stats,
      total: filteredStudents.length,
      marked: totalMarked,
      presentRate,
      datesCount,
      dates: allRecords.map(r => r.date).sort()
    };
  }, [selectedClass, filteredStudents, attendance]);

  // Estadísticas del día seleccionado
  const todayStats = useMemo(() => {
    if (!selectedClass || filteredStudents.length === 0) return null;
    
    const stats = { P: 0, T: 0, F: 0, J: 0 };
    let total = 0;
    
    filteredStudents.forEach(student => {
      const status = currentRecords[student.id];
      if (status && stats[status] !== undefined) {
        stats[status]++;
        total++;
      }
    });

    const presentRate = total > 0 ? Math.round(((stats.P + stats.T + stats.J) / filteredStudents.length) * 100) : 0;

    return {
      ...stats,
      total: filteredStudents.length,
      marked: total,
      presentRate
    };
  }, [selectedClass, filteredStudents, currentRecords]);

  const handleStatusChange = (studentId, status) => {
    setCurrentRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!selectedClass) return;
    saveAttendanceDate(date, currentRecords);
    alert('Asistencia guardada con éxito.');
  };

  const STATUS_OPTIONS = [
    { value: 'P', label: 'Presente', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✓' },
    { value: 'T', label: 'Tarde', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏰' },
    { value: 'F', label: 'Falta', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '✗' },
    { value: 'J', label: 'Justificado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '📋' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
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
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Asistencia</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Registro y control diario de asistencia</p>
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
            onChange={e => setSelectedClass(e.target.value)} 
            style={{ borderColor: selectedClass ? '#10b981' : '#e2e8f0' }}
          >
            <option value="">Seleccionar sección...</option>
            {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* Tarjeta de Fecha */}
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
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} color="#8b5cf6" />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fecha</label>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>Día de asistencia</div>
            </div>
          </div>
          <input 
            type="date" 
            className="input-field" 
            value={date} 
            onChange={e => {
              setDate(e.target.value);
              const rec = attendance.find(a => a.date === e.target.value)?.records || {};
              setCurrentRecords(rec);
            }} 
            style={{ borderColor: '#8b5cf6' }}
          />
        </div>

        {/* Botón Guardar */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '2px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={!selectedClass}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              opacity: !selectedClass ? 0.5 : 1,
              background: selectedClass ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
              border: selectedClass ? 'none' : undefined,
              cursor: selectedClass ? 'pointer' : 'not-allowed'
            }}
          >
            <Save size={20} /> 
            <span style={{ fontWeight: 600 }}>Guardar Asistencia</span>
          </button>
        </div>
      </div>

      {/* Widgets de estadísticas del día seleccionado */}
      {selectedClass && todayStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Presentes */}
          <div style={{
            background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '1.25rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
              <CheckCircle size={28} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{todayStats.P}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Presentes HOY</div>
              </div>
            </div>
          </div>

          {/* Tardanzas */}
          <div style={{
            background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '16px',
            padding: '1.25rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
              <Clock size={28} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{todayStats.T}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Tardanzas HOY</div>
              </div>
            </div>
          </div>

          {/* Faltas */}
          <div style={{
            background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '16px',
            padding: '1.25rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
              <XCircle size={28} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{todayStats.F}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Faltas HOY</div>
              </div>
            </div>
          </div>

          {/* Justificados */}
          <div style={{
            background: 'linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '16px',
            padding: '1.25rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
          >
            <div style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
              <FileCheck size={28} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{todayStats.J}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Justificados HOY</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget consolidado por BIMESTRE */}
      {selectedClass && attendanceStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Resumen consolidado del bimestre */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PieChart size={22} color="white" />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                  Resumen Consolidado
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedClass} · {attendanceStats.datesCount} días con registro
                </p>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tasa de Asistencia</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{attendanceStats.presentRate}%</span>
              </div>
              <div style={{
                height: '14px',
                background: '#f1f5f9',
                borderRadius: '7px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${attendanceStats.presentRate}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '7px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Detalle consolidado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                  {attendanceStats.P}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Presentes</div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                  {attendanceStats.T}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tardanzas</div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
                  {attendanceStats.F}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Faltas</div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {attendanceStats.J}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Justificados</div>
              </div>
            </div>

            {/* Información adicional */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="#64748b" />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {attendanceStats.datesCount} días
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="#64748b" />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {attendanceStats.total} alumnos
                </span>
              </div>
            </div>
          </div>

          {/* Distribución visual del bimestre */}
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-30%',
              width: '200px',
              height: '200px',
              background: 'rgba(99, 102, 241, 0.2)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-20%',
              width: '150px',
              height: '150px',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '50%'
            }} />
            
            <h4 style={{ fontWeight: 700, margin: '0 0 1.25rem 0', fontSize: '1.1rem', position: 'relative', zIndex: 1 }}>
              Distribución General
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
              {/* Presentes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ flex: 1, fontSize: '0.85rem' }}>Presentes</span>
                <span style={{ fontWeight: 700 }}>{attendanceStats.P}</span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({attendanceStats.marked > 0 ? Math.round((attendanceStats.P / attendanceStats.marked) * 100) : 0}%)
                </span>
              </div>
              
              {/* Tardanzas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ flex: 1, fontSize: '0.85rem' }}>Tardanzas</span>
                <span style={{ fontWeight: 700 }}>{attendanceStats.T}</span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({attendanceStats.marked > 0 ? Math.round((attendanceStats.T / attendanceStats.marked) * 100) : 0}%)
                </span>
              </div>
              
              {/* Faltas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ flex: 1, fontSize: '0.85rem' }}>Faltas</span>
                <span style={{ fontWeight: 700 }}>{attendanceStats.F}</span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({attendanceStats.marked > 0 ? Math.round((attendanceStats.F / attendanceStats.marked) * 100) : 0}%)
                </span>
              </div>
              
              {/* Justificados */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ flex: 1, fontSize: '0.85rem' }}>Justificados</span>
                <span style={{ fontWeight: 700 }}>{attendanceStats.J}</span>
                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                  ({attendanceStats.marked > 0 ? Math.round((attendanceStats.J / attendanceStats.marked) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Barra de distribución */}
            <div style={{ 
              display: 'flex', 
              height: '28px', 
              borderRadius: '14px', 
              overflow: 'hidden', 
              marginTop: '1.5rem',
              position: 'relative',
              zIndex: 1,
              background: '#334155'
            }}>
              {attendanceStats.marked > 0 ? (
                <>
                  <div style={{ 
                    width: `${(attendanceStats.P / attendanceStats.marked) * 100}%`, 
                    background: '#10b981',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{ 
                    width: `${(attendanceStats.T / attendanceStats.marked) * 100}%`, 
                    background: '#f59e0b',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{ 
                    width: `${(attendanceStats.F / attendanceStats.marked) * 100}%`, 
                    background: '#ef4444',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{ 
                    width: `${(attendanceStats.J / attendanceStats.marked) * 100}%`, 
                    background: '#8b5cf6',
                    transition: 'width 0.5s ease'
                  }} />
                </>
              ) : (
                <div style={{ width: '100%', background: '#334155' }} />
              )}
            </div>

            {/* Lista de fechas del bimestre */}
            {attendanceStats.dates && attendanceStats.dates.length > 0 && (
              <div style={{ marginTop: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                  Fechas registradas:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {attendanceStats.dates.slice(-6).map(d => (
                    <span key={d} style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.8)'
                    }}>
                      {new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                  ))}
                  {attendanceStats.dates.length > 6 && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                      +{attendanceStats.dates.length - 6} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje si no hay registros en el bimestre */}
      {selectedClass && attendanceStats && attendanceStats.datesCount === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          border: '2px solid #fbbf24',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Calendar size={28} color="white" />
          </div>
          <h4 style={{ fontWeight: 700, margin: '0 0 0.5rem 0', color: '#92400e' }}>
            Sin registros de asistencia
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0 }}>
            No hay días registrados para {selectedClass}. 
            ¡Comienza a registrar la asistencia!
          </p>
        </div>
      )}

      {/* Estado vacío */}
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <GraduationCap size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Registro de Asistencia
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona una sección para comenzar a registrar la asistencia del día
          </p>
        </div>
      )}

      {/* Tabla */}
      {selectedClass && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={16} />
                      Estudiante
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem',
                    width: '150px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} />
                      Grado
                    </div>
                  </th>
                  <th style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} />
                      Estado de Asistencia
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No hay estudiantes matriculados en esta sección.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ fontWeight: 600, padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          {student.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '1rem' }}>{student.gradeLevel}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem' }}>
                          {STATUS_OPTIONS.map(opt => {
                            const isSelected = currentRecords[student.id] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(student.id, isSelected ? '' : opt.value)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '10px',
                                  border: `2px solid ${isSelected ? opt.color : 'transparent'}`,
                                  background: isSelected ? opt.bg : '#f1f5f9',
                                  color: isSelected ? opt.color : '#64748b',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: isSelected ? `0 0 0 3px ${opt.color}20` : 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = opt.bg;
                                    e.currentTarget.style.borderColor = opt.color + '40';
                                    e.currentTarget.style.color = opt.color;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.color = '#64748b';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '1rem' }}>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
