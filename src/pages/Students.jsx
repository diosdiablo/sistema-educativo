import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, Edit2, Check, Eye, X, Filter, ChevronDown } from 'lucide-react';
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
    // Eliminar espacios para contar dígitos correctamente
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
    // Definir la clase por defecto si está vacía
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
        // Reset file input
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
    
    if (filterClass === 'Todos') return baseList;
    return baseList.filter(s => s.gradeLevel === filterClass);
  }, [students, filterClass, isAdmin, assignedClassNames]);

  const availableClassesForFilter = useMemo(() => {
    if (isAdmin) return classes;
    return classes.filter(c => assignedClassNames.includes(c.name));
  }, [isAdmin, classes, assignedClassNames]);

  return (
    <>
      <div className="animate-fade-in">
      <div style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Filter size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Estudiantes</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona el registro de alumnos</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && students.length > 0 && (
            <button 
              onClick={handleClearAll}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Trash2 size={18} /> Vaciar Lista
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
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'white', color: '#22c55e', border: 'none',
                padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Upload size={18} /> Subir Excel
            </button>
          )}
          
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'white', color: '#22c55e', border: 'none',
              padding: '0.75rem 1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={18} /> Nuevo Alumno
            </button>
          )}

          <div style={{ 
            marginLeft: '1rem', 
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filtrar por Grado
            </span>
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setIsFilterHovered(true)}
              onMouseLeave={() => setIsFilterHovered(false)}
            >
              <Filter size={14} style={{ 
                position: 'absolute', 
                left: '12px', 
                color: isFilterHovered ? 'var(--accent-hover)' : 'var(--accent-primary)', 
                pointerEvents: 'none',
                transition: 'color var(--transition-fast)'
              }} />
              <select 
                className="input-field" 
                style={{ 
                  paddingLeft: '2.5rem', 
                  minWidth: '220px', 
                  border: isFilterHovered ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  boxShadow: isFilterHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
              >
                <option value="Todos">Ver todos {isAdmin ? 'los grados' : 'mis grados'}</option>
                {availableClassesForFilter.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      {showForm && (
        <form className="card animate-fade-in" style={{ marginBottom: '2rem', border: isEditing ? '2px solid var(--accent-primary)' : 'none' }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>{isEditing ? 'Editar Estudiante' : 'Agregar Estudiante Manualmente'}</h3>
            {isEditing && (
              <button type="button" className="btn-secondary" onClick={resetForm} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Cancelar Edición
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
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Información del Apoderado</h4>
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
            <button type="submit" className="btn-primary">
              {isEditing ? 'Actualizar Estudiante' : 'Guardar Estudiante'}
            </button>
          </div>
        </form>
      )}

      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="styled-table">
            <thead>
              <tr>
                <th style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem'
                }}>DNI</th>
                <th style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem'
                }}>Apellidos y Nombre</th>
                <th style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem'
                }}>Grado y Seccion</th>
                <th style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem'
                }}>Fecha de Nacimiento</th>
                <th style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem'
                }}>Acciones</th>
              </tr>
            </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No hay estudiantes registrados.</td></tr>
            ) : (
              filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{student.dni || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td style={{ fontSize: '0.9rem' }}>{student.gradeLevel || 'Sin asignar'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{student.birthDate || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '0.4rem', border: 'none' }} 
                          onClick={() => setViewingStudent(student)}
                          title="Ver Información Completa"
                        >
                          <Eye size={18} color="var(--accent-primary)" />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem', border: 'none' }} 
                              onClick={() => handleEdit(student)}
                              title="Editar Información"
                            >
                              <Edit2 size={18} color="var(--warning-color)" />
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem', border: 'none' }} 
                              onClick={() => { if(window.confirm('¿Eliminar estudiante?')) deleteStudent(student.id); }}
                              title="Eliminar Estudiante"
                            >
                              <Trash2 size={18} color="var(--danger-color)" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {viewingStudent && (
        <div className="modal-overlay animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', padding: '4rem 1rem',
          zIndex: 1000
        }}>
          <div className="card shadow-glass" style={{ maxWidth: '450px', width: '100%', borderTop: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>Detalles del Estudiante</h3>
              <button 
                onClick={() => setViewingStudent(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DNI</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.dni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>APELLIDOS Y NOMBRE</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>GRADO Y SECCIÓN</span>
                <span>{viewingStudent.gradeLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>FECHA DE NACIMIENTO</span>
                <span>{viewingStudent.birthDate || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>APODERADO (ASOCIADO)</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.guardianName || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DNI ASOCIADO</span>
                <span>{viewingStudent.guardianDni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
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
                className="btn-primary" 
                style={{ width: '100%', padding: '0.75rem' }} 
                onClick={() => setViewingStudent(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="modal-overlay animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start',
          zIndex: 1100,
          padding: '4rem 1rem'
        }}>
          <div className="card shadow-glass animate-fade-in" style={{ 
            maxWidth: '400px', 
            width: '100%', 
            textAlign: 'center', 
            padding: '2rem',
            borderTop: '6px solid var(--danger-color)',
            borderRadius: '20px'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <Trash2 size={32} color="var(--danger-color)" />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>¿Confirmar acción?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Estás a punto de eliminar a <strong>TODOS</strong> los estudiantes de la lista de manera definitiva. Esta acción no se puede deshacer.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.8rem', border: '1px solid var(--border-color)' }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, padding: '0.8rem', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.3)' }}
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
