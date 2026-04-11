import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Clock, X, Save, Edit3, User, Calendar, LayoutGrid } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIMES = [
  '12:30 - 01:15', '01:15 - 02:00', '02:00 - 02:45', '02:45 - 03:30',
  '03:30 - 04:00 (DESCANSO)',
  '04:00 - 04:40', '04:40 - 05:20', '05:20 - 06:00 (TURNO TARDE)'
];

export default function Schedule() {
  const { classes, subjects, schedule, saveScheduleItem, deleteScheduleItem, currentUser, isAdmin, users } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [selectedUserId, setSelectedUserId] = useState(isAdmin ? 'all' : currentUser?.id);

  const [formData, setFormData] = useState({
    day: 'Lunes',
    time: TIMES[0],
    classId: '',
    subjectId: '',
    color: '#10b981'
  });

  const teachers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  const viewedUser = useMemo(() => {
    if (!isAdmin) return currentUser;
    if (selectedUserId === 'all') return null;
    const found = users.find(u => u.id === selectedUserId);
    return found || currentUser;
  }, [selectedUserId, isAdmin, currentUser, users]);

  const filteredSchedule = useMemo(() => {
    if (isAdmin && selectedUserId === 'all') return schedule;
    return schedule.filter(s => s.userId === viewedUser?.id);
  }, [schedule, viewedUser, isAdmin, selectedUserId]);

  const availableClasses = useMemo(() => {
    if (isAdmin || viewedUser?.role === 'admin') return classes;
    if (!viewedUser?.assignments || viewedUser.assignments.length === 0) return [];
    const classIds = [...new Set(viewedUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [viewedUser, classes, isAdmin]);

  const getAvailableSubjectsForClass = (classId) => {
    if (isAdmin || viewedUser?.role === 'admin') return subjects;
    if (!viewedUser?.assignments) return [];
    const subjectIds = viewedUser.assignments
      .filter(a => a.classId === classId)
      .map(a => a.subjectId);
    return subjects.filter(s => subjectIds.includes(s.id));
  };

  const handleOpenModal = (day = 'Lunes', time = TIMES[0], item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        day: item.day,
        time: item.time,
        classId: item.classId,
        subjectId: item.subjectId,
        color: item.color || '#10b981'
      });
    } else {
      setEditingItem(null);
      setFormData({
        day,
        time,
        classId: '',
        subjectId: '',
        color: '#10b981'
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.classId && formData.subjectId) {
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

  const colors = [
    { name: 'Esmeralda',   value: '#10b981' },
    { name: 'Verde Lima',  value: '#84cc16' },
    { name: 'Bosque',      value: '#16a34a' },
    { name: 'Menta',       value: '#2dd4bf' },
    { name: 'Azul',        value: '#3b82f6' },
    { name: 'Celeste',     value: '#38bdf8' },
    { name: 'Índigo',      value: '#6366f1' },
    { name: 'Marino',      value: '#1d4ed8' },
    { name: 'Violeta',     value: '#8b5cf6' },
    { name: 'Malva',       value: '#a855f7' },
    { name: 'Rosa',        value: '#ec4899' },
    { name: 'Fucsia',      value: '#e879f9' },
    { name: 'Rojo',        value: '#ef4444' },
    { name: 'Coral',       value: '#f97316' },
    { name: 'Ámbar',       value: '#f59e0b' },
    { name: 'Amarillo',    value: '#eab308' },
    { name: 'Slate',       value: '#64748b' },
    { name: 'Gris Azul',   value: '#4b6a8a' },
    { name: 'Cobre',       value: '#c2410c' },
    { name: 'Lima Oscuro', value: '#65a30d' },
  ];

  const headerGradient = ['#06b6d4', '#0891b2'];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #22d3ee 100%)',
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
              <Calendar size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Horario Escolar</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>
                {isAdmin ? `Gestionando: ${viewedUser?.name || 'Todos los docentes'}` : 'Organiza tus sesiones de clase'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isAdmin && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', 
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <User size={18} />
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ 
                    background: 'transparent', border: 'none', color: 'white', 
                    outline: 'none', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all" style={{ color: '#1e293b' }}>Todos los Docentes</option>
                  <option value={currentUser.id} style={{ color: '#1e293b' }}>Mi Horario (Admin)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} style={{ color: '#1e293b' }}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            {(!isAdmin || selectedUserId !== 'all') && (
              <button 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'white', color: '#0891b2', border: 'none',
                  padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, 
                  cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
                onClick={() => handleOpenModal()}
              >
                <Plus size={18} /> Agregar Bloque
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de horario moderno */}
      <div className="table-container" style={{ 
        overflowX: 'auto', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'white'
      }}>
        <table className="styled-table" style={{ tableLayout: 'fixed', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ 
                width: '150px', 
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Clock size={16} />
                  Hora
                </div>
              </th>
              {DAYS.map((day, idx) => (
                <th key={day} style={{ 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(time => (
              <tr key={time} style={{ height: time.includes('DESCANSO') ? '40px' : '100px' }}>
                <td style={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  backgroundColor: '#f8fafc',
                  color: time.includes('DESCANSO') ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textAlign: 'center'
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
                        if (isAdmin && selectedUserId === 'all') return;
                        handleOpenModal(day, time, item);
                      }}
                      style={{ 
                        cursor: (isAdmin && selectedUserId === 'all') ? 'default' : 'pointer',
                        padding: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item ? (
                        <div style={{ 
                          backgroundColor: item.color, 
                          color: 'white', 
                          padding: '10px', 
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          position: 'relative'
                        }}>
                          {isAdmin && selectedUserId === 'all' && (
                            <span style={{ fontSize: '0.6rem', opacity: 0.9, fontWeight: 700, marginBottom: '2px' }}>
                              👤 {users.find(u => u.id === item.userId)?.name || 'Desconocido'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.2 }}>
                            {classes.find(c => c.id === item.classId)?.name || 'Grado...'}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.2 }}>
                            {subjects.find(s => s.id === item.subjectId)?.name || 'Área...'}
                          </span>
                        </div>
                      ) : (
                        !(isAdmin && selectedUserId === 'all') && (
                          <div style={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            color: '#cbd5e1',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#cbd5e1'; }}
                          >
                            <Plus size={20} />
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

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1100
        }}>
          <div style={{ 
            maxWidth: '480px', width: '100%', 
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: `${formData.color}20`,
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: formData.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LayoutGrid size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{editingItem ? 'Editar Bloque' : 'Asignar Bloque'}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{viewedUser?.name || currentUser?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isAdmin && !editingItem && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Docente</label>
                  <select 
                    className="input-field" 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                  >
                    <option value={currentUser.id}>Yo (Admin)</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Día</label>
                  <select className="input-field" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Horario</label>
                  <select className="input-field" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Grado y Sección</label>
                <select 
                  className="input-field" 
                  value={formData.classId} 
                  onChange={e => setFormData({...formData, classId: e.target.value, subjectId: ''})}
                  required
                >
                  <option value="">Seleccionar Grado</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Área Curricular</label>
                <select 
                  className="input-field" 
                  value={formData.subjectId} 
                  onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  required
                >
                  <option value="">Seleccionar Área</option>
                  {getAvailableSubjectsForClass(formData.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Color del Bloque
                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: formData.color, fontWeight: 500 }}>
                    — {colors.find(c => c.value === formData.color)?.name}
                  </span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 28px)', gap: '6px' }}>
                  {colors.map(c => (
                    <div 
                      key={c.value}
                      title={c.name}
                      onClick={() => setFormData({...formData, color: c.value})}
                      style={{ 
                        width: '28px', height: '28px', borderRadius: '8px', 
                        backgroundColor: c.value, cursor: 'pointer',
                        outline: formData.color === c.value ? `3px solid ${c.value}` : '2px solid transparent',
                        outlineOffset: '2px',
                        boxShadow: formData.color === c.value
                          ? `0 0 0 2px white, 0 0 0 4px ${c.value}`
                          : '0 2px 4px rgba(0,0,0,0.15)',
                        transform: formData.color === c.value ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                {editingItem && (
                  <button 
                    type="button" 
                    style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    onClick={() => { 
                      if (window.confirm('¿Eliminar este bloque horario?')) {
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
                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: formData.color, color: 'white', border: 'none',
                    padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${formData.color}40`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
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