import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Save } from 'lucide-react';

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

  // Leer grado de la URL si existe
  useEffect(() => {
    const classParam = searchParams.get('class');
    if (classParam && availableClasses.some(c => c.name === classParam)) {
      setSelectedClass(classParam);
    }
  }, [searchParams, availableClasses]);
  
  // Find records for the selected date
  const selectedDateRecord = attendance.find(a => a.date === date);
  const [currentRecords, setCurrentRecords] = useState(selectedDateRecord?.records || {});

  // Update effect when date changes
  useEffect(() => {
    setCurrentRecords(selectedDateRecord?.records || {});
  }, [date, selectedDateRecord]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.gradeLevel === selectedClass);
  }, [students, selectedClass]);

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

  const getStatusConfig = (status) => STATUS_OPTIONS.find(s => s.value === status) || null;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h2 className="page-title">Asistencia</h2>
          <p className="page-subtitle">Registro y control diario</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="input-field" 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)} 
            style={{ minWidth: '200px' }}
          >
            <option value="">-- Selecciona una Sección --</option>
            {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <input 
            type="date" 
            className="input-field" 
            value={date} 
            onChange={e => {
              setDate(e.target.value);
              const rec = attendance.find(a => a.date === e.target.value)?.records || {};
              setCurrentRecords(rec);
            }} 
            style={{ width: 'auto' }}
          />

          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: !selectedClass ? 0.5 : 1 }}
          >
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Grado y Sección</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {!selectedClass ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Por favor, selecciona una sección primero para tomar lista.
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>
                  No hay estudiantes matriculados en esta sección.
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{student.gradeLevel}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {STATUS_OPTIONS.map(opt => {
                        const isSelected = currentRecords[student.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(student.id, isSelected ? '' : opt.value)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              border: `2px solid ${isSelected ? opt.color : 'transparent'}`,
                              background: isSelected ? opt.bg : '#f1f5f9',
                              color: isSelected ? opt.color : '#64748b',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSelected ? `0 0 0 3px ${opt.color}20` : 'none',
                            }}
                          >
                            <span style={{ fontSize: '0.9rem' }}>{opt.icon}</span>
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
  );
}
