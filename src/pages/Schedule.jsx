import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Clock, X, Save, Edit3, User, Upload } from 'lucide-react';

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
    subjectId: '',
    color: '#10b981'
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

  const colors = [
    // Verdes
    { name: 'Esmeralda',   value: '#10b981' },
    { name: 'Verde Lima',  value: '#84cc16' },
    { name: 'Bosque',      value: '#16a34a' },
    { name: 'Menta',       value: '#2dd4bf' },
    // Azules
    { name: 'Azul',        value: '#3b82f6' },
    { name: 'Celeste',     value: '#38bdf8' },
    { name: 'Índigo',      value: '#6366f1' },
    { name: 'Marino',      value: '#1d4ed8' },
    // Morados / Rosas
    { name: 'Violeta',     value: '#8b5cf6' },
    { name: 'Malva',       value: '#a855f7' },
    { name: 'Rosa',        value: '#ec4899' },
    { name: 'Fucsia',      value: '#e879f9' },
    // Cálidos
    { name: 'Rojo',        value: '#ef4444' },
    { name: 'Coral',       value: '#f97316' },
    { name: 'Ámbar',       value: '#f59e0b' },
    { name: 'Amarillo',    value: '#eab308' },
    // Neutros / Especiales
    { name: 'Slate',       value: '#64748b' },
    { name: 'Gris Azul',   value: '#4b6a8a' },
    { name: 'Cobre',       value: '#c2410c' },
    { name: 'Lima Oscuro', value: '#65a30d' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h2 className="page-title">Horario Escolar</h2>
          <p className="page-subtitle">
            {isAdmin ? `Gestionando horario de: ${viewedUser?.name}` : 'Organiza tus sesiones de clase semanales'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <User size={18} style={{ color: 'var(--text-secondary)' }} />
              <select 
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <option value="all">📋 Todos los Docentes</option>
                <option value={currentUser.id}>Mi Horario (Admin)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Only show 'Agregar Bloque' if we're in a specific teacher/user view */}
          {(!isAdmin || selectedUserId !== 'all') && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleOpenModal()}>
              <Plus size={18} /> Agregar Bloque
            </button>
          )}
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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

      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="styled-table" style={{ tableLayout: 'fixed', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '150px', backgroundColor: '#f8fafc' }}>Hora</th>
              {DAYS.map(day => (
                <th key={day} style={{ textAlign: 'center' }}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(time => (
              <tr key={time} style={{ height: time.includes('DESCANSO') ? '40px' : '90px' }}>
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
                      {item ? (
                        <div style={{ 
                          backgroundColor: item.color, 
                          color: 'white',
                          padding: '8px', 
                          borderRadius: '8px',
                          borderLeft: `5px solid ${classes.find(c => c.id === item.classId)?.color || item.color}`,
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
                      ) : (
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
          <div className="card shadow-glass animate-fade-in" style={{ maxWidth: '450px', width: '100%', borderTop: `6px solid ${formData.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem' }}>{editingItem ? 'Editar Bloque' : 'Asignar Bloque'}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Horario para: {viewedUser?.name || currentUser?.name}</p>
              </div>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* When admin is in 'all' view and opens a block via add button, pick teacher first */}
              {isAdmin && !editingItem && (
                <div>
                  <label className="input-label">Docente</label>
                  <select className="input-field" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                    <option value={currentUser.id}>Yo (Admin)</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Día</label>
                  <select className="input-field" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Horario</label>
                  <select className="input-field" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Grado y Sección</label>
                <select 
                  className="input-field" 
                  value={formData.classId} 
                  onChange={e => {
                    const selectedClass = classes.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData, 
                      classId: e.target.value,
                      color: selectedClass?.color || formData.color
                    });
                  }}
                  required
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
                <label className="input-label">Área Curricular</label>
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

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                {editingItem && (
                  <button 
                    type="button" 
                    className="btn-danger" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
                  className="btn-primary" 
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
