import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Save, Users, Calendar, CheckCircle, Clock, XCircle, FileCheck, GraduationCap, PieChart, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const unwrapStatus = (r) => (typeof r === 'string' ? r : (r?.s || null));

export default function Attendance() {
  const { students, classes, attendance, saveAttendanceDate, deleteAttendanceDate, currentUser, isAdmin, periodDates } = useStore();
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
  const [expandedDates, setExpandedDates] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const getPeriodForDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    for (const [period, dates] of Object.entries(periodDates)) {
      const start = new Date(dates.start + 'T00:00:00');
      const end = new Date(dates.end + 'T00:00:00');
      if (date >= start && date <= end) return period;
    }
    return null;
  };

  const toggleDateExpand = (dateStr) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const getAttendanceForDate = (dateStr) => {
    const record = attendance.find(a => a.date === dateStr);
    return record?.records || {};
  };

  const getAttendanceSummaryForDate = (dateStr, studentsList) => {
    const records = getAttendanceForDate(dateStr);
    const stats = { P: 0, T: 0, F: 0, J: 0, total: 0 };
    studentsList.forEach(student => {
      const status = unwrapStatus(records[student.id]);
      if (status && stats[status] !== undefined) {
        stats[status]++;
        stats.total++;
      }
    });
    return stats;
  };

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
    const cleanSelected = selectedClass.trim().toLowerCase();
    return students
      .filter(s => {
        const cleanGrade = (s.gradeLevel || '').trim().toLowerCase();
        const cleanClass = (s.classId || '').trim().toLowerCase();
        return cleanGrade === cleanSelected || cleanClass === cleanSelected;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
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
        const status = unwrapStatus(record.records?.[student.id]);
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

  // Fechas con asistencia registrada (para tabla de historial)
  const historicalAttendanceDates = useMemo(() => {
    if (!selectedClass || filteredStudents.length === 0) return [];
    return attendance
      .filter(a => filteredStudents.some(s => a.records && a.records[s.id]))
      .map(a => a.date)
      .sort()
      .reverse();
  }, [selectedClass, filteredStudents, attendance]);

  const filteredHistoricalDates = useMemo(() => {
    if (selectedPeriod === 'all') return historicalAttendanceDates;
    return historicalAttendanceDates.filter(d => getPeriodForDate(d) === selectedPeriod);
  }, [historicalAttendanceDates, selectedPeriod]);

  const PERIOD_LABELS = {
    '1': 'I Bimestre',
    '2': 'II Bimestre',
    '3': 'III Bimestre',
    '4': 'IV Bimestre'
  };

  // Estadísticas del día seleccionado
  const todayStats = useMemo(() => {
    if (!selectedClass || filteredStudents.length === 0) return null;
    
    const stats = { P: 0, T: 0, F: 0, J: 0 };
    let total = 0;
    
    filteredStudents.forEach(student => {
      const status = unwrapStatus(currentRecords[student.id]);
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
    setCurrentRecords(prev => {
      const updated = { ...prev, [studentId]: status };
      saveAttendanceDate(date, updated);
      return updated;
    });
  };

  const handleSave = () => {
    if (!selectedClass) return;
    saveAttendanceDate(date, currentRecords);
    alert('Asistencia guardada con éxito.');
  };

  const STATUS_OPTIONS = [
    { value: 'P', label: 'Presente', color: '#188038', bg: '#e6f4ea' },
    { value: 'T', label: 'Tarde', color: '#e37400', bg: '#fef7e0' },
    { value: 'F', label: 'Falta', color: '#d93025', bg: '#fce8e6' },
    { value: 'J', label: 'Justificado', color: '#9334e6', bg: '#f3e8fd' },
  ];

  const selectPillStyle = {
    padding: '0.55rem 1rem',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-color-surface)',
    fontWeight: 500,
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    outline: 'none'
  };

  const thStyle = (width, align = 'left') => ({
    padding: '0.85rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: align,
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--surface-muted)',
    width: width || 'auto',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="animate-fade-in">
      {/* Barra de herramientas */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ marginRight: 'auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Asistencia</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Registro y control diario de asistencia</p>
        </div>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          style={selectPillStyle}
          aria-label="Sección"
        >
          <option value="">Seleccionar sección...</option>
          {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input
          type="date"
          value={date}
          onChange={e => {
            setDate(e.target.value);
            const rec = attendance.find(a => a.date === e.target.value)?.records || {};
            setCurrentRecords(rec);
          }}
          style={selectPillStyle}
          aria-label="Fecha"
        />
        <button
          onClick={handleSave}
          disabled={!selectedClass}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.55rem 1.25rem',
            borderRadius: '20px',
            border: 'none',
            background: selectedClass ? '#1a73e8' : 'var(--hover-bg)',
            color: selectedClass ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: selectedClass ? 'pointer' : 'not-allowed'
          }}
        >
          <Save size={16} />
          Guardar
        </button>
      </div>

      {/* Widgets de estadísticas del día seleccionado */}
      {selectedClass && todayStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Presentes HOY', value: todayStats.P, color: '#188038', bg: '#e6f4ea', Icon: CheckCircle },
            { label: 'Tardanzas HOY', value: todayStats.T, color: '#e37400', bg: '#fef7e0', Icon: Clock },
            { label: 'Faltas HOY', value: todayStats.F, color: '#d93025', bg: '#fce8e6', Icon: XCircle },
            { label: 'Justificados HOY', value: todayStats.J, color: '#9334e6', bg: '#f3e8fd', Icon: FileCheck }
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} style={{
              background: 'var(--bg-color-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
              </div>
            </div>
          ))}
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
            background: 'var(--bg-color-surface)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e8f0fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PieChart size={18} color="#1a73e8" />
              </div>
              <div>
                <h4 style={{ fontWeight: 500, margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Resumen Consolidado
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedClass} · {attendanceStats.datesCount} días con registro
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tasa de Asistencia</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#188038' }}>{attendanceStats.presentRate}%</span>
              </div>
              <div style={{
                height: '8px',
                background: 'var(--hover-bg)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${attendanceStats.presentRate}%`,
                  background: '#188038',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Detalle consolidado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {[
                ['Presentes', attendanceStats.P],
                ['Tardanzas', attendanceStats.T],
                ['Faltas', attendanceStats.F],
                ['Justificados', attendanceStats.J]
              ].map(([label, val]) => {
                const cfg = STATUS_OPTIONS.find(o => o.label === label);
                return (
                  <div key={label} style={{
                    padding: '0.9rem',
                    borderRadius: '8px',
                    background: 'var(--surface-muted)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 500, color: cfg?.color || 'var(--text-primary)' }}>
                      {val}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Información adicional */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--surface-muted)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Calendar size={14} />
                {attendanceStats.datesCount} días
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Users size={14} />
                {attendanceStats.total} alumnos
              </div>
            </div>
          </div>

          {/* Distribución visual del bimestre */}
          <div style={{
            background: 'var(--bg-color-surface)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ fontWeight: 500, margin: '0 0 1.25rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
              Distribución General
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Presentes', attendanceStats.P],
                ['Tardanzas', attendanceStats.T],
                ['Faltas', attendanceStats.F],
                ['Justificados', attendanceStats.J]
              ].map(([label, val]) => {
                const cfg = STATUS_OPTIONS.find(o => o.label === label);
                const pct = attendanceStats.marked > 0 ? Math.round((val / attendanceStats.marked) * 100) : 0;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg?.color }} />
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{val}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', width: '44px', textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Barra de distribución */}
            <div style={{
              display: 'flex',
              height: '24px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginTop: '1.5rem',
              background: 'var(--hover-bg)'
            }}>
              {attendanceStats.marked > 0 ? (
                <>
                  <div style={{
                    width: `${(attendanceStats.P / attendanceStats.marked) * 100}%`,
                    background: '#188038',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{
                    width: `${(attendanceStats.T / attendanceStats.marked) * 100}%`,
                    background: '#e37400',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{
                    width: `${(attendanceStats.F / attendanceStats.marked) * 100}%`,
                    background: '#d93025',
                    transition: 'width 0.5s ease'
                  }} />
                  <div style={{
                    width: `${(attendanceStats.J / attendanceStats.marked) * 100}%`,
                    background: '#9334e6',
                    transition: 'width 0.5s ease'
                  }} />
                </>
              ) : null}
            </div>

            {/* Lista de fechas del bimestre */}
            {attendanceStats.dates && attendanceStats.dates.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Fechas registradas:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {attendanceStats.dates.slice(-6).map(d => (
                    <span key={d} style={{
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.65rem',
                      background: 'var(--hover-bg)',
                      borderRadius: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                  ))}
                  {attendanceStats.dates.length > 6 && (
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.65rem',
                      background: 'var(--hover-bg)',
                      borderRadius: '12px',
                      color: 'var(--text-secondary)'
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
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'var(--hover-bg)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Calendar size={26} color="#5f6368" />
          </div>
          <h4 style={{ fontWeight: 500, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Sin registros de asistencia
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            No hay días registrados para {selectedClass}. ¡Comienza a registrar la asistencia!
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {!selectedClass && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#e8f0fe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <GraduationCap size={30} color="#1a73e8" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Registro de Asistencia
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '400px', margin: '0 auto' }}>
            Selecciona una sección para comenzar a registrar la asistencia del día
          </p>
        </div>
      )}

      {/* Tabla */}
      {selectedClass && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle('60px', 'center')}>N°</th>
                  <th style={thStyle()}>Estudiante</th>
                  <th style={thStyle('150px')}>Grado</th>
                  <th style={thStyle()}>Estado de Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                      No hay estudiantes matriculados en esta sección.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id}>
                      <td style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary)', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 500, padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#e8f0fe',
                            color: '#1967d2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}>
                            {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          {student.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>{student.gradeLevel}</td>
                      <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.6rem 1rem' }}>
                          {STATUS_OPTIONS.map(opt => {
                            const isSelected = unwrapStatus(currentRecords[student.id]) === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(student.id, isSelected ? '' : opt.value)}
                                style={{
                                  padding: '0.4rem 0.95rem',
                                  borderRadius: '18px',
                                  border: `1px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                                  background: isSelected ? opt.color : 'var(--bg-color-surface)',
                                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                  fontWeight: 500,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'var(--hover-bg)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-color-surface)';
                                }}
                              >
                                {opt.label}
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

      {/* Tabla de Historial de Asistencias Tomadas */}
      {selectedClass && historicalAttendanceDates.length > 0 && (
        <div style={{
          marginTop: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#e8f0fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={18} color="#1a73e8" />
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Historial de Asistencias
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {filteredHistoricalDates.length} de {historicalAttendanceDates.length} fechas registradas
              </p>
            </div>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              style={selectPillStyle}
            >
              <option value="all">Todos los bimestres</option>
              {Object.entries(periodDates).map(([key, dates]) => (
                <option key={key} value={key}>
                  {PERIOD_LABELS[key] || `Bimestre ${key}`} ({new Date(dates.start).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - {new Date(dates.end).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            background: 'var(--bg-color-surface)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle('60px', 'center')}></th>
                    <th style={thStyle()}>Fecha</th>
                    <th style={thStyle('110px', 'center')}>Presentes</th>
                    <th style={thStyle('110px', 'center')}>Tardanzas</th>
                    <th style={thStyle('110px', 'center')}>Faltas</th>
                    <th style={thStyle('120px', 'center')}>Justificados</th>
                    <th style={thStyle('120px', 'center')}>% Asistencia</th>
                    <th style={thStyle('70px', 'center')}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoricalDates.map((dateStr) => {
                    const summary = getAttendanceSummaryForDate(dateStr, filteredStudents);
                    const attendanceRate = summary.total > 0
                      ? Math.round(((summary.P + summary.T + summary.J) / summary.total) * 100)
                      : 0;
                    const isExpanded = expandedDates[dateStr];
                    const rateColor = attendanceRate >= 80 ? '#188038' : attendanceRate >= 60 ? '#e37400' : '#d93025';
                    const rateBg = attendanceRate >= 80 ? '#e6f4ea' : attendanceRate >= 60 ? '#fef7e0' : '#fce8e6';
                    const countPillStyle = (color, bg) => ({
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem 0.7rem',
                      borderRadius: '12px',
                      background: bg,
                      color: color,
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      minWidth: '40px'
                    });

                    return (
                      <React.Fragment key={dateStr}>
                        <tr
                          style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                          onClick={() => toggleDateExpand(dateStr)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-muted)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                        >
                          <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ display: 'inline-flex', color: 'var(--text-secondary)' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500, padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={countPillStyle('#188038', '#e6f4ea')}>
                              {summary.P}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={countPillStyle('#e37400', '#fef7e0')}>
                              {summary.T}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={countPillStyle('#d93025', '#fce8e6')}>
                              {summary.F}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={countPillStyle('#9334e6', '#f3e8fd')}>
                              {summary.J}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{
                              ...countPillStyle(rateColor, rateBg),
                              minWidth: '52px'
                            }}>
                              {attendanceRate}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Eliminar asistencia del ${new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE')}?`))
                                  deleteAttendanceDate(dateStr);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#d93025',
                                padding: '6px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#fce8e6'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                              title="Eliminar esta fecha"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" style={{ padding: 0, background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{ padding: '1rem 1.5rem' }}>
                                <h4 style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  color: 'var(--text-secondary)',
                                  marginBottom: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  Detalle por Estudiante
                                </h4>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                  gap: '0.5rem'
                                }}>
                                  {filteredStudents.map(student => {
                                    const records = getAttendanceForDate(dateStr);
                                    const status = unwrapStatus(records[student.id]);
                                    if (!status) return null;

                                    const statusConfig = STATUS_OPTIONS.find(opt => opt.value === status);
                                    return (
                                      <div key={student.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        background: 'var(--bg-color-surface)',
                                        border: '1px solid var(--border-color)'
                                      }}>
                                        <span style={{
                                          fontSize: '0.85rem',
                                          fontWeight: 500,
                                          color: 'var(--text-primary)',
                                          flex: 1,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          marginRight: '0.5rem'
                                        }}>
                                          {student.name}
                                        </span>
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '0.2rem 0.6rem',
                                          borderRadius: '12px',
                                          background: statusConfig?.bg || 'var(--hover-bg)',
                                          color: statusConfig?.color || 'var(--text-secondary)',
                                          fontWeight: 500,
                                          fontSize: '0.75rem',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusConfig?.color || 'var(--text-secondary)' }} />
                                          {statusConfig?.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedClass && historicalAttendanceDates.length === 0 && attendanceStats && (
        <div style={{
          marginTop: '2rem',
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#e8f0fe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <History size={26} color="#1a73e8" />
          </div>
          <h4 style={{ fontWeight: 500, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            No hay historial de asistencias
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Las asistencias que tomes aparecerán aquí como historial
          </p>
        </div>
      )}

      {selectedClass && filteredHistoricalDates.length === 0 && historicalAttendanceDates.length > 0 && (
        <div style={{
          marginTop: '2rem',
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#fef7e0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Calendar size={26} color="#e37400" />
          </div>
          <h4 style={{ fontWeight: 500, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Sin registros en este bimestre
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            No hay fechas de asistencia registradas en {PERIOD_LABELS[selectedPeriod] || `Bimestre ${selectedPeriod}`} para {selectedClass}
          </p>
        </div>
      )}
    </div>
  );
}
