import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Clock, X, Save, Edit3, User, Upload, CalendarDays } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIMES = [
  '12:30 - 01:15', '01:15 - 02:00', '02:00 - 02:45', '02:45 - 03:30',
  '03:30 - 04:00 (DESCANSO)',
  '04:00 - 04:40', '04:40 - 05:20', '05:20 - 06:00 (TURNO TARDE)'
];

export default function Schedule() {
  const { classes, subjects, schedule, saveScheduleItem, deleteScheduleItem, currentUser, isAdmin, users, syncToSupabaseManual, isOnline } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Admin starts in 'all' view to see everyone's schedule
  const [selectedUserId, setSelectedUserId] = useState(isAdmin ? 'all' : currentUser?.id);

  const [formData, setFormData] = useState({
    day: 'Lunes',
    time: TIMES[0],
    classId: '',
    subjectId: ''
  });

  // Filter teachers only (non-admin users)
  const teachers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  // The user whose schedule is being viewed/edited (null = all)
  const viewedUser = useMemo(() => {
    if (!isAdmin) return currentUser;
    if (selectedUserId === 'all') return null;
    const found = users.find(u => u.id === selectedUserId);
    return found || currentUser;
  }, [selectedUserId, isAdmin, currentUser, users]);

  // Filter schedule - 'all' shows everything for admin
  const filteredSchedule = useMemo(() => {
    if (isAdmin && selectedUserId === 'all') return schedule;
    return schedule.filter(s => s.userId === viewedUser?.id);
  }, [schedule, viewedUser, isAdmin, selectedUserId]);

  // Filter available classes for modal based on teacher assignments
  // Admin can always pick any class for any teacher
  const availableClasses = useMemo(() => {
    if (isAdmin || viewedUser?.role === 'admin') return classes;
    if (!viewedUser?.assignments || viewedUser.assignments.length === 0) return [];
    const classIds = [...new Set(viewedUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [viewedUser, classes, isAdmin]);

  const getAvailableSubjectsForClass = (classId) => {
    if (isAdmin || viewedUser?.role === 'admin') return subjects;
    if (!viewedUser?.assignments || viewedUser.assignments.length === 0) return subjects;
    const subjectIds = viewedUser.assignments
      .filter(a => a.classId === classId)
      .map(a => a.subjectId);
    const assigned = subjects.filter(s => subjectIds.includes(s.id));
    return assigned.length > 0 ? assigned : subjects;
  };

  const handleOpenModal = (day = 'Lunes', time = TIMES[0], item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        day: item.day,
        time: item.time,
        classId: item.classId,
        subjectId: item.subjectId
      });
    } else {
      setEditingItem(null);
      setFormData({
        day,
        time,
        classId: '',
        subjectId: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.classId && formData.subjectId) {
      // When admin saves from 'all' view, must have picked a specific teacher
      const targetUserId = viewedUser ? viewedUser.id : currentUser.id;
      saveScheduleItem({
        ...formData,
        userId: targetUserId,
        id: editingItem?.id
      });
      setShowModal(false);
    }
  };

  const getSlotContent = (day, time) => {
    return filteredSchedule.find(s => s.day === day && s.time === time);
  };

  return (
    <div className="animate-fade-in">
      {/* Header moderno */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        color: 'white'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
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
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
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
              <CalendarDays size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Horario Escolar</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>
                {isAdmin ? `Gestionando horario de: ${viewedUser?.name}` : 'Organiza tus sesiones de clase semanales'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAdmin && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'rgba(255,255,255,0.2)', 
                padding: '0.6rem 1rem', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <User size={18} />
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'white', 
                    outline: 'none', 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all" style={{ color: '#1e293b' }}>📋 Todos los Docentes</option>
                  <option value={currentUser.id} style={{ color: '#1e293b' }}>Mi Horario (Admin)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} style={{ color: '#1e293b' }}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Only show 'Agregar Bloque' if we're in a specific teacher/user view */}
            {(!isAdmin || selectedUserId !== 'all') && (
              <button className="btn-primary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'white',
                color: '#0ea5e9',
                border: 'none',
                fontWeight: 600
              }} onClick={() => handleOpenModal()}>
                <Plus size={18} /> Agregar Bloque
              </button>
            )}
            <button 
              className="btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              onClick={async () => {
                if (!isOnline) { alert('Sin conexión a internet'); return; }
                setSyncing(true);
                await syncToSupabaseManual();
                setSyncing(false);
                alert('Horario guardado en Supabase');
              }}
              disabled={syncing}
            >
              <Upload size={18} /> {syncing ? 'Guardando...' : 'Guardar Horario'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de horario */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="styled-table" style={{ tableLayout: 'fixed', minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={{ 
                  width: '180px', 
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: 'white',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
                    Hora
                  </div>
                </th>
                {DAYS.map((day, idx) => {
                  const dayColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
                  return (
                    <th key={day} style={{ 
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${dayColors[idx]} 0%, ${dayColors[idx]}cc 100%)`,
                      color: 'white',
                      padding: '1.25rem',
                      fontWeight: 600
                    }}>{day}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TIMES.map(time => (
                <tr key={time} style={{ height: time.includes('DESCANSO') ? '50px' : '100px' }}>
                  <td style={{ 
                    fontWeight: 600, 
                    fontSize: '0.85rem', 
                    backgroundColor: '#f8fafc',
                    color: time.includes('DESCANSO') ? '#64748b' : '#1e293b',
                    textAlign: 'center',
                    padding: '1rem'
                  }}>
                    {time}
                  </td>
                  {DAYS.map(day => {
                  const item = getSlotContent(day, time);
                  const isBreak = time.includes('DESCANSO');
                  
                  if (isBreak) {
                    return <td key={day} style={{ backgroundColor: '#f1f5f9', textAlign: 'center' }}></td>;
                  }

                  return (
                    <td 
                      key={day} 
                      onClick={() => {
                        // In 'all' view without a specific teacher selected, can't add
                        if (isAdmin && selectedUserId === 'all') return;
                        handleOpenModal(day, time, item);
                      }}
                      style={{ 
                        cursor: (isAdmin && selectedUserId === 'all') ? 'default' : 'pointer',
                        padding: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item ? (() => {
                        const classColor = classes.find(c => c.id === item.classId)?.color || '#10b981';
                        return (
                        <div style={{ 
                          backgroundColor: classColor, 
                          color: 'white',
                          padding: '8px', 
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}>
                          {isAdmin && selectedUserId === 'all' && (
                            <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 700, marginBottom: '2px' }}>
                              👤 {users.find(u => u.id === item.userId)?.name || 'Desconocido'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {classes.find(c => c.id === item.classId)?.name || 'Grado...'}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>
                            {subjects.find(s => s.id === item.subjectId)?.name || 'Área...'}
                          </span>
                        </div>
                        );
                      })() : (
                        !(isAdmin && selectedUserId === 'all') && (
                          <div style={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px dashed #e2e8f0',
                            borderRadius: '8px',
                            color: '#cbd5e1'
                          }}>
                            <Plus size={16} />
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1100
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '2rem',
            maxWidth: '480px', 
            width: '100%', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            borderTop: `6px solid ${classes.find(c => c.id === formData.classId)?.color || '#0ea5e9'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{editingItem ? 'Editar Bloque' : 'Asignar Bloque'}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Horario para: <strong>{viewedUser?.name || currentUser?.name}</strong></p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* When admin is in 'all' view and opens a block via add button, pick teacher first */}
              {isAdmin && !editingItem && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Docente</label>
                  <select 
                    className="input-field" 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                    style={{ padding: '0.875rem', borderRadius: '10px', borderColor: '#e2e8f0' }}
                  >
                    <option value={currentUser.id}>Yo (Admin)</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Día</label>
                  <select 
                    className="input-field" 
                    value={formData.day} 
                    onChange={e => setFormData({...formData, day: e.target.value})}
                    style={{ padding: '0.875rem', borderRadius: '10px', borderColor: '#e2e8f0' }}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Horario</label>
                  <select 
                    className="input-field" 
                    value={formData.time} 
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    style={{ padding: '0.875rem', borderRadius: '10px', borderColor: '#e2e8f0' }}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Grado y Sección</label>
                <select 
                  className="input-field" 
                  value={formData.classId} 
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                  required
                  style={{ padding: '0.875rem', borderRadius: '10px', borderColor: '#e2e8f0' }}
                >
                  <option value="">Seleccionar Grado</option>
                  {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.color ? '●' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Área Curricular</label>
                <select 
                  className="input-field" 
                  value={formData.subjectId} 
                  onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  required
                  style={{ padding: '0.875rem', borderRadius: '10px', borderColor: '#e2e8f0' }}
                >
                  <option value="">Seleccionar Área</option>
                  {getAvailableSubjectsForClass(formData.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                {editingItem && (
                  <button 
                    type="button" 
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #ef444420',
                      padding: '1rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => { 
                      if (window.confirm('¿Estás seguro de que deseas eliminar este bloque horario?')) {
                        deleteScheduleItem(editingItem.id); 
                        setShowModal(false); 
                      }
                    }}
                  >
                    <Trash2 size={18} /> Eliminar
                  </button>
                )}
                <button 
                  type="submit" 
                  style={{ 
                    flex: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Save size={18} /> {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
