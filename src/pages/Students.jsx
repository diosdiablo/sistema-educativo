import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, Edit2, Check, Eye, X, Filter, ChevronDown, Users, GraduationCap, UserCheck, Calendar, Phone, MapPin, FileText, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Students() {
  const { students, classes, addStudent, deleteStudent, importStudentsBulk, updateStudent, clearAllStudents, isAdmin, currentUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    name: '', gradeLevel: '', dni: '', birthDate: '', address: '', phone: '',
    guardianName: '', guardianDni: '', guardianPhone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [filterClass, setFilterClass] = useState('Todos');
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  const maskPhone = (phone) => {
    if (!phone) return '-';
    const cleanPhone = phone.toString().replace(/\s/g, '');
    if (cleanPhone.length <= 3) return cleanPhone;
    return '******' + cleanPhone.slice(-3);
  };

  const handleClearAll = () => {
    setShowConfirmModal(true);
  };

  const confirmClearAll = () => {
    clearAllStudents();
    setShowConfirmModal(false);
  };

  useEffect(() => {
    if (classes.length > 0 && !newStudent.gradeLevel) {
      setNewStudent(prev => ({ ...prev, gradeLevel: classes[0].name }));
    }
  }, [classes, newStudent.gradeLevel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStudent.name && newStudent.gradeLevel) {
      if (isEditing) {
        updateStudent(currentStudentId, newStudent);
      } else {
        addStudent(newStudent);
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setNewStudent({ 
      name: '', 
      gradeLevel: classes.length > 0 ? classes[0].name : '', 
      dni: '', 
      birthDate: '',
      address: '', 
      phone: '',
      guardianName: '',
      guardianDni: '',
      guardianPhone: ''
    });
    setIsEditing(false);
    setCurrentStudentId(null);
    setShowForm(false);
  };

  const handleEdit = (student) => {
    setNewStudent({
      name: student.name,
      gradeLevel: student.gradeLevel,
      dni: student.dni || '',
      birthDate: student.birthDate || '',
      address: student.address || '',
      phone: student.phone || '',
      guardianName: student.guardianName || '',
      guardianDni: student.guardianDni || '',
      guardianPhone: student.guardianPhone || ''
    });
    setIsEditing(true);
    setCurrentStudentId(student.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (jsonData.length > 0) {
          importStudentsBulk(jsonData);
          alert(`¡Análisis completado! Se han procesado los datos del archivo Excel.`);
        } else {
          alert('El archivo Excel parece estar vacío o no se pudo leer correctamente.');
        }
      } catch (error) {
        console.error("Error leyendo Excel:", error);
        alert('Hubo un error al procesar el archivo Excel. Asegúrate de que no esté dañado.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const assignedClassNames = useMemo(() => {
    if (isAdmin) return classes.map(c => c.name);
    if (!currentUser?.assignments) return [];
    const classIds = [...new Set(currentUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id)).map(c => c.name);
  }, [isAdmin, currentUser, classes]);

  const filteredStudents = useMemo(() => {
    let baseList = students;
    if (!isAdmin) {
      baseList = students.filter(s => assignedClassNames.includes(s.gradeLevel));
    }
    
    if (filterClass === 'Todos') {
      return baseList.sort((a, b) => {
        const lastNameA = a.name.split(',')[0]?.trim().toLowerCase() || a.name.toLowerCase();
        const lastNameB = b.name.split(',')[0]?.trim().toLowerCase() || b.name.toLowerCase();
        if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
        
        const numGradeA = parseInt(a.gradeLevel?.match(/\d+/)?.[0] || '0');
        const numGradeB = parseInt(b.gradeLevel?.match(/\d+/)?.[0] || '0');
        return numGradeA - numGradeB;
      });
    }
    return baseList.filter(s => s.gradeLevel === filterClass);
  }, [students, filterClass, isAdmin, assignedClassNames]);

  const availableClassesForFilter = useMemo(() => {
    if (isAdmin) return classes;
    return classes.filter(c => assignedClassNames.includes(c.name));
  }, [isAdmin, classes, assignedClassNames]);

  const gradientColors = [
    ['#22c55e', '#16a34a'],
    ['#3b82f6', '#2563eb'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777']
  ];

  return (
    <>
      <div className="animate-fade-in">
        {/* Header con gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #4ade80 100%)',
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
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <Users size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Estudiantes</h2>
                <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona el registro de alumnos</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && students.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                    padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Trash2 size={18} /> Vaciar
                </button>
              )}

              <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
              />
              {isAdmin && (
                <button 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                    padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={18} /> Excel
                </button>
              )}
              
              {isAdmin && (
                <button 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'white', color: '#16a34a', border: 'none',
                    padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus size={18} /> Nuevo
                </button>
              )}

              <div style={{ 
                marginLeft: '0.5rem',
                paddingLeft: '1rem',
                borderLeft: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Filtrar
                </span>
                <div 
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={() => setIsFilterHovered(true)}
                  onMouseLeave={() => setIsFilterHovered(false)}
                >
                  <Filter size={14} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    color: isFilterHovered ? '#16a34a' : '#22c55e', 
                    pointerEvents: 'none'
                  }} />
                  <select 
                    className="input-field" 
                    style={{ 
                      paddingLeft: '2.5rem', 
                      minWidth: '180px', 
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                  >
                    <option value="Todos">{isAdmin ? 'Todos los grados' : 'Mis grados'}</option>
                    {availableClassesForFilter.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario moderno */}
        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: isEditing ? '2px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.2)'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isEditing ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isEditing ? <Edit2 size={20} color="white" /> : <UserCheck size={20} color="white" />}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>{isEditing ? 'Editar Estudiante' : 'Agregar Estudiante'}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Ingresa los datos del alumno</p>
                </div>
              </div>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="input-label">DNI (8 dígitos)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Documento Identidad" 
                  value={newStudent.dni} 
                  maxLength={8}
                  onChange={e => setNewStudent({...newStudent, dni: e.target.value.replace(/\D/g, '')})} 
                  required
                />
              </div>
              <div>
                <label className="input-label">Apellidos y Nombre</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Perez Juan" 
                  value={newStudent.name} 
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="input-label">Grado y Sección</label>
                <select 
                  className="input-field" 
                  value={newStudent.gradeLevel} 
                  onChange={e => setNewStudent({...newStudent, gradeLevel: e.target.value})} 
                  required
                >
                  <option value="" disabled>Selecciona un Grado</option>
                  {availableClassesForFilter.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Fecha de Nacimiento</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="DD/MM/AAAA" 
                  value={newStudent.birthDate} 
                  onChange={e => setNewStudent({...newStudent, birthDate: e.target.value})} 
                />
              </div>
              <div>
                <label className="input-label">Dirección</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Av. Principal 123" 
                  value={newStudent.address} 
                  onChange={e => setNewStudent({...newStudent, address: e.target.value})} 
                />
              </div>
              <div>
                <label className="input-label">Teléfono/Celular</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="999 999 999" 
                  value={newStudent.phone} 
                  onChange={e => setNewStudent({...newStudent, phone: e.target.value})} 
                />
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} /> Información del Apoderado
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="input-label">Nombre del Apoderado</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Padre, madre o tutor" 
                      value={newStudent.guardianName} 
                      onChange={e => setNewStudent({...newStudent, guardianName: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="input-label">DNI Apoderado (8 dígitos)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="DNI del tutor" 
                      value={newStudent.guardianDni} 
                      maxLength={8}
                      onChange={e => setNewStudent({...newStudent, guardianDni: e.target.value.replace(/\D/g, '')})} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Teléfono Apoderado</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Celular del tutor" 
                      value={newStudent.guardianPhone} 
                      onChange={e => setNewStudent({...newStudent, guardianPhone: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button 
                type="submit"
                onClick={handleSubmit}
                style={{
                  background: isEditing ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={18} />
                {isEditing ? 'Actualizar' : 'Guardar Estudiante'}
              </button>
            </div>
          </div>
        )}

        {/* Tabla moderna */}
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="table-container" style={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <table className="styled-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ 
                  minWidth: '120px', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} />
                    DNI
                  </div>
                </th>
                <th style={{ 
                  minWidth: '200px', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} />
                    Apellidos y Nombre
                  </div>
                </th>
                <th style={{ 
                  minWidth: '150px', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={16} />
                    Grado
                  </div>
                </th>
                <th style={{ 
                  minWidth: '150px', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} />
                    Nacimiento
                  </div>
                </th>
                <th style={{ 
                  minWidth: '140px', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <UserCheck size={16} />
                    Acciones
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No hay estudiantes registrados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const [color1, color2] = gradientColors[idx % gradientColors.length];
                  return (
                    <tr key={student.id}>
                      <td>
                        <code style={{ 
                          background: '#f1f5f9', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          color: '#64748b',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          {student.dni || '-'}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${color1}15, ${color2}15)`,
                          border: `1px solid ${color1}30`,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: color1
                        }}>
                          <GraduationCap size={14} />
                          {student.gradeLevel || 'Sin asignar'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.birthDate || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            style={{ 
                              padding: '8px', 
                              borderRadius: '10px', 
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            onClick={() => setViewingStudent(student)}
                            title="Ver Información"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button 
                                style={{ 
                                  padding: '8px', 
                                  borderRadius: '10px', 
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  color: '#f59e0b',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                onClick={() => handleEdit(student)}
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                style={{ 
                                  padding: '8px', 
                                  borderRadius: '10px', 
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                onClick={() => { if(window.confirm('¿Eliminar estudiante?')) deleteStudent(student.id); }}
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Modal de ver estudiante */}
      {viewingStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', padding: '4rem 1rem',
          zIndex: 1000
        }}>
          <div style={{ 
            maxWidth: '450px', width: '100%', 
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #22c55e20, #16a34a20)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={24} color="white" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Detalles del Estudiante</h3>
              </div>
              <button 
                onClick={() => setViewingStudent(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DNI</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.dni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>APELLIDOS Y NOMBRE</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewingStudent.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>GRADO Y SECCIÓN</span>
                <span style={{ fontWeight: 600, color: '#22c55e' }}>{viewingStudent.gradeLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>FECHA DE NACIMIENTO</span>
                <span>{viewingStudent.birthDate || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>APODERADO</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.guardianName || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DNI APODERADO</span>
                <span>{viewingStudent.guardianDni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DIRECCIÓN</span>
                <span style={{ fontSize: '0.9rem' }}>{viewingStudent.address || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TELÉFONO</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.phone || '-'}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                style={{ 
                  width: '100%', padding: '0.75rem',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: 600, cursor: 'pointer'
                }}
                onClick={() => setViewingStudent(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start',
          zIndex: 1100,
          padding: '4rem 1rem'
        }}>
          <div style={{ 
            maxWidth: '400px', 
            width: '100%', 
            textAlign: 'center', 
            padding: '2rem',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '120px', height: '120px',
              background: 'linear-gradient(135deg, #ef444420, #dc262620)',
              borderRadius: '50%'
            }} />
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <Trash2 size={32} color="#ef4444" />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>¿Confirmar acción?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Estás a punto de eliminar a <strong>TODOS</strong> los estudiantes de manera definitiva. Esta acción no se puede deshacer.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                style={{ 
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: '#f1f5f9', color: 'var(--text-secondary)',
                  border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button 
                style={{ 
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                  boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.3)'
                }}
                onClick={confirmClearAll}
              >
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}