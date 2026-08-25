import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, Edit2, X, Search, Users, GraduationCap, UserCheck, Save, Shuffle, ExternalLink, Camera } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

// Sistema de estudiantes - Gestión de alumnos

export default function Students() {
  const navigate = useNavigate();
  const { students, classes, addStudent, deleteStudent, importStudentsBulk, updateStudent, clearAllStudents, isAdmin, currentUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    name: '', gradeLevel: '', dni: '', birthDate: '', address: '', phone: '',
    guardianName: '', guardianDni: '', guardianPhone: '', photo_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('Todos');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomStudent, setRandomStudent] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const maskPhone = (phone) => {
    if (!phone) return '-';
    const cleanPhone = phone.toString().replace(/\s/g, '');
    if (cleanPhone.length <= 3) return cleanPhone;
    return '******' + cleanPhone.slice(-3);
  };

  const handleClearAll = () => {
    setShowConfirmModal(true);
  };

  const pickRandomStudent = () => {
    if (filteredStudents.length === 0) return;
    setShowRandomModal(true);
    setIsPicking(true);
    
    let count = 0;
    let finalStudent = null;
    const interval = setInterval(() => {
      const r = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];
      setRandomStudent(r);
      finalStudent = r;
      count++;
      if (count >= 15) {
        clearInterval(interval);
        setTimeout(() => {
          setRandomStudent(finalStudent);
          setIsPicking(false);
        }, 50);
      }
    }, 80);
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
      guardianPhone: '',
      photo_url: ''
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
      guardianPhone: student.guardianPhone || '',
      photo_url: student.photo_url || ''
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

  const cleanClassFilter = (studentGrade) => {
    return (studentGrade || '').trim().toLowerCase();
  };

  const filteredStudents = useMemo(() => {
    let baseList = students;
    if (!isAdmin) {
      baseList = students.filter(s => assignedClassNames.some(c => 
        cleanClassFilter(s.gradeLevel) === c.toLowerCase() || cleanClassFilter(s.classId) === c.toLowerCase()
      ));
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      baseList = baseList.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.dni || '').includes(q)
      );
    }
    
    if (filterClass === 'Todos') {
      return baseList.sort((a, b) => {
        const numGradeA = parseInt(a.gradeLevel?.match(/\d+/)?.[0] || '0');
        const numGradeB = parseInt(b.gradeLevel?.match(/\d+/)?.[0] || '0');
        if (numGradeA !== numGradeB) return numGradeA - numGradeB;
        
        const sectionA = a.gradeLevel?.replace(/.*grado\s*/i, '').trim() || '';
        const sectionB = b.gradeLevel?.replace(/.*grado\s*/i, '').trim() || '';
        if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
        
        const lastNameA = a.name.split(',')[0]?.trim().toLowerCase() || a.name.toLowerCase();
        const lastNameB = b.name.split(',')[0]?.trim().toLowerCase() || b.name.toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });
    }
    
    const cleanFilter = filterClass.trim().toLowerCase();
    return baseList.filter(s => 
      cleanClassFilter(s.gradeLevel) === cleanFilter || cleanClassFilter(s.classId) === cleanFilter
    ).sort((a, b) => {
      const lastNameA = a.name.split(',')[0]?.trim().toLowerCase() || a.name.toLowerCase();
      const lastNameB = b.name.split(',')[0]?.trim().toLowerCase() || b.name.toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
  }, [students, filterClass, searchTerm, isAdmin, assignedClassNames]);

  const availableClassesForFilter = useMemo(() => {
    if (isAdmin) return classes;
    return classes.filter(c => assignedClassNames.includes(c.name));
  }, [isAdmin, classes, assignedClassNames]);

  const classTints = [
    ['#e6f4ea', '#188038'],
    ['#e8f0fe', '#1967d2'],
    ['#fef7e0', '#b06000'],
    ['#fce8e6', '#c5221f'],
    ['#f3e8fd', '#7627bb'],
    ['#e4f7fb', '#007b83']
  ];

  return (
    <>
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
            <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Estudiantes</h2>
            <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Gestiona el registro de alumnos</p>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-secondary)',
              pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Nombre o DNI..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '2.2rem',
                paddingRight: searchTerm ? '2rem' : '1rem',
                minWidth: '190px',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color-surface)',
                fontWeight: 500,
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute', right: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: '4px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            aria-label="Filtrar por grado"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color-surface)',
              fontWeight: 500,
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px'
            }}
          >
            <option value="Todos">{isAdmin ? 'Todos los grados' : 'Mis grados'}</option>
            {availableClassesForFilter.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          {isAdmin && students.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-color-surface)', color: '#d93025', border: '1px solid var(--border-color)',
                padding: '0.55rem 1rem', borderRadius: '20px', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem'
              }}
            >
              <Trash2 size={16} /> Vaciar
            </button>
          )}

          <button
            onClick={pickRandomStudent}
            disabled={filteredStudents.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-color-surface)', color: filteredStudents.length === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border-color)',
              padding: '0.55rem 1rem', borderRadius: '20px', fontWeight: 500, cursor: filteredStudents.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem'
            }}
          >
            <Shuffle size={16} /> Sorteo
          </button>

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
                background: 'var(--bg-color-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
                padding: '0.55rem 1rem', borderRadius: '20px', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Excel
            </button>
          )}

          {isAdmin && (
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#1a73e8', color: 'white', border: 'none',
                padding: '0.55rem 1.25rem', borderRadius: '20px', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem'
              }}
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={16} /> Nuevo
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div style={{
            background: 'var(--bg-color-surface)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isEditing ? '#fef7e0' : '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isEditing ? <Edit2 size={20} color="#b06000" /> : <UserCheck size={20} color="#188038" />}
                </div>
                <div>
                  <h3 style={{ fontWeight: 500, margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{isEditing ? 'Editar Estudiante' : 'Agregar Estudiante'}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Ingresa los datos del alumno</p>
                </div>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    background: 'var(--bg-color-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
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
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Foto del Estudiante</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: newStudent.photo_url ? `url(${newStudent.photo_url}) center/cover` : 'var(--hover-bg)',
                    border: '2px dashed var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {!newStudent.photo_url && <Camera size={24} color="#9aa0a6" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={photoInputRef}
                      id="student-photo-input"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setPhotoUploading(true);
                        const localPreview = await new Promise(resolve => {
                          const reader = new FileReader();
                          reader.onload = ev => resolve(ev.target.result);
                          reader.readAsDataURL(file);
                        });
                        setNewStudent(prev => ({...prev, photo_url: localPreview}));
                        const ext = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        try {
                          const { data, error } = await supabase.storage
                            .from('student-photos')
                            .upload(fileName, file, { contentType: file.type, upsert: true });
                          if (!error && data?.path) {
                            const { data: { publicUrl } } = supabase.storage
                              .from('student-photos')
                              .getPublicUrl(data.path);
                            setNewStudent(prev => ({...prev, photo_url: publicUrl }));
                          }
                        } catch {}
                        setPhotoUploading(false);
                      }}
                    />
                    <label htmlFor="student-photo-input" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1rem', borderRadius: '10px',
                      background: 'var(--hover-bg)', border: '1px solid var(--border-color)',
                      cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)'
                    }}>
                      {photoUploading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="spinner" style={{ width: 14, height: 14, border: '2px solid var(--border-color)', borderTopColor: '#188038', borderRadius: '50%', display: 'inline-block' }} /> Subiendo...
                        </span>
                      ) : (
                        <><Camera size={16} /> {newStudent.photo_url ? 'Cambiar foto' : 'Subir foto'}</>
                      )}
                    </label>
                    {newStudent.photo_url && (
                      <button type="button" onClick={() => setNewStudent(prev => ({...prev, photo_url: ''}))} style={{
                        marginLeft: '0.5rem', padding: '0.6rem 1rem', borderRadius: '10px',
                        background: '#fce8e6', border: 'none',
                        cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', color: '#d93025'
                      }}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#188038', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  background: isEditing ? '#e37400' : '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '20px',
                  fontWeight: 500,
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

        {/* Tabla */}
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="table-container" style={{ borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ tableLayout: 'auto', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  width: '60px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>N°</th>
                <th style={{
                  width: '64px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>Foto</th>
                <th style={{
                  minWidth: '120px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>DNI</th>
                <th style={{
                  minWidth: '200px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>Apellidos y Nombre</th>
                <th style={{
                  minWidth: '150px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>Grado</th>
                <th style={{
                  minWidth: '150px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>Nacimiento</th>
                <th style={{
                  minWidth: '140px',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No hay estudiantes registrados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const [tintBg, tintFg] = classTints[idx % classTints.length];
                  return (
                    <tr key={student.id}>
                      <td style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            objectFit: 'cover', border: '1px solid var(--border-color)'
                          }} />
                        ) : (
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--hover-bg)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto'
                          }}>
                            <Camera size={16} color="#9aa0a6" />
                          </div>
                        )}
                      </td>
                      <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <code style={{
                          background: 'var(--hover-bg)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          {student.dni || '-'}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{student.name}</td>
                      <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          background: tintBg,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: tintFg
                        }}>
                          <GraduationCap size={14} />
                          {student.gradeLevel || 'Sin asignar'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{student.birthDate || '-'}</td>
                      <td style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            style={{
                              padding: '8px',
                              borderRadius: '50%',
                              background: '#e8f0fe',
                              border: 'none',
                              color: '#1967d2',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onClick={() => navigate(`/students/${student.id}`)}
                            title="Ficha del Estudiante"
                          >
                            <ExternalLink size={18} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                style={{
                                  padding: '8px',
                                  borderRadius: '50%',
                                  background: '#fef7e0',
                                  border: 'none',
                                  color: '#b06000',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onClick={() => handleEdit(student)}
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                style={{
                                  padding: '8px',
                                  borderRadius: '50%',
                                  background: '#fce8e6',
                                  border: 'none',
                                  color: '#d93025',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
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
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--nav-active-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={24} color="var(--nav-active-fg)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Detalles del Estudiante</h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            {viewingStudent.photo_url && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img src={viewingStudent.photo_url} alt="" style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  objectFit: 'cover', border: '1px solid var(--border-color)'
                }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>DNI</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.dni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>APELLIDOS Y NOMBRE</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewingStudent.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>GRADO Y SECCIÓN</span>
                <span style={{ fontWeight: 500, color: '#188038' }}>{viewingStudent.gradeLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>FECHA DE NACIMIENTO</span>
                <span>{viewingStudent.birthDate || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>APODERADO</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.guardianName || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>DNI APODERADO</span>
                <span>{viewingStudent.guardianDni || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.75rem', borderBottom: '1px solid var(--hover-bg)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>DIRECCIÓN</span>
                <span style={{ fontSize: '0.9rem' }}>{viewingStudent.address || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>TELÉFONO</span>
                <span style={{ fontWeight: 600 }}>{viewingStudent.phone || '-'}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                className="btn-primary"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '20px'
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
            background: 'var(--bg-color-surface)',
            borderRadius: '16px',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--danger-tint-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <Trash2 size={32} color="var(--danger-color)" />
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>¿Confirmar acción?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Estás a punto de eliminar a <strong>TODOS</strong> los estudiantes de manera definitiva. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '20px',
                  background: 'var(--bg-color-surface)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500
                }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '20px'
                }}
                onClick={confirmClearAll}
              >
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sorteo de Estudiante */}
      {showRandomModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', padding: '1rem',
          zIndex: 1200
        }} onClick={() => !isPicking && setShowRandomModal(false)}>
          <div style={{
            maxWidth: '500px', width: '100%',
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2.5rem',
            position: 'relative',
            textAlign: 'center',
            overflow: 'hidden'
          }} className="animate-fade-in" onClick={(e) => e.stopPropagation()}>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: isPicking ? '#e3740015' : '#18803815',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Shuffle size={36} color={isPicking ? '#e37400' : '#188038'} style={{ transform: isPicking ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.5s ease' }} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {isPicking ? 'Sorteando...' : '¡Estudiante Seleccionado!'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {isPicking ? 'El sorteo está en curso' : `Sección: ${filterClass === 'Todos' ? 'Todas las secciones' : filterClass}`}
              </p>

              {/* Estudiante */}
              {randomStudent && (
                <div style={{
                  background: 'var(--bg-color-surface)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: isPicking ? '2px dashed var(--border-color)' : '1px solid #188038',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isPicking ? '#e3740015' : '#188038',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    transition: 'all 0.3s ease'
                  }}>
                    {isPicking ? (
                      <Users size={28} color="#e37400" />
                    ) : (
                      <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                        {randomStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    color: isPicking ? 'var(--text-secondary)' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}>
                    {randomStudent.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: isPicking ? 'var(--border-color)' : 'var(--text-secondary)', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <GraduationCap size={14} />
                    {randomStudent.gradeLevel}
                  </div>
                  {randomStudent.dni && !isPicking && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      marginTop: '0.5rem',
                      fontFamily: 'monospace'
                    }}>
                      DNI: {randomStudent.dni}
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '20px',
                    background: 'var(--bg-color-surface)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setShowRandomModal(false)}
                >
                  Cerrar
                </button>
                {!isPicking && (
                  <button
                    className="btn-primary"
                    style={{
                      flex: 1, padding: '0.8rem', borderRadius: '20px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onClick={pickRandomStudent}
                  >
                    <Shuffle size={18} /> Sortear de nuevo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}