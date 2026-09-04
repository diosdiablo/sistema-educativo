import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, X, Save, User, LayoutGrid } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState('teacher');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [formData, setFormData] = useState({
    day: 'Lunes',
    time: TIMES[0],
    classId: '',
    subjectId: '',
    color: '#039BE5',
    userId: ''
  });

  const teachers = useMemo(() => users.filter(u => u.role === 'teacher' || u.role === 'Docente'), [users]);

  const viewedUser = useMemo(() => {
    if (selectedUserId === 'all') return null;
    const found = users.find(u => u.id === selectedUserId);
    return found || currentUser;
  }, [selectedUserId, currentUser, users]);

  const filteredSchedule = useMemo(() => {
    if (selectedUserId === 'all') {
      return schedule;
    }
    return schedule.filter(s => s.userId === viewedUser?.id);
  }, [schedule, viewedUser, selectedUserId]);

  const readOnlyAll = isAdmin && selectedUserId === 'all';
  const readOnlyForeign = !isAdmin && viewedUser && viewedUser.id !== currentUser?.id;

  const sectionSchedule = useMemo(() => {
    if (!selectedSectionId) return [];
    return schedule.filter(s =>
      s.classId === selectedSectionId &&
      s.classId !== '__ATENCION__' &&
      s.classId !== '__TRABAJO__'
    );
  }, [schedule, selectedSectionId]);

  const getSectionSlot = (day, time) => sectionSchedule.filter(s => s.day === day && s.time === time);

  const availableClasses = useMemo(() => {
    if (isAdmin || viewedUser?.role === 'admin') return classes;
    if (!viewedUser?.assignments || viewedUser.assignments.length === 0) return [];
    const classIds = [...new Set(viewedUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [viewedUser, classes, isAdmin]);

  const getAvailableSubjectsForClass = (classId) => {
    if (classId === '__ATENCION__' || classId === '__TRABAJO__') return [];
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
        color: item.color || '#039BE5',
        userId: item.userId
      });
    } else {
      setEditingItem(null);
      setFormData({
        day,
        time,
        classId: '',
        subjectId: '',
        color: '#039BE5',
        userId: selectedUserId === 'all' ? '' : viewedUser?.id || currentUser?.id
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const isSpecial = formData.classId === '__ATENCION__' || formData.classId === '__TRABAJO__';
    if (formData.classId && (isSpecial || formData.subjectId)) {
      let targetUserId;
      if (selectedUserId === 'all' && formData.userId) {
        targetUserId = formData.userId;
      } else if (viewedUser) {
        targetUserId = viewedUser.id;
      } else {
        targetUserId = currentUser.id;
      }
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
    { name: 'Tomate',     value: '#D50000' },
    { name: 'Flamenco',   value: '#E67C73' },
    { name: 'Mandarina',  value: '#F4511E' },
    { name: 'Banana',     value: '#F6BF26' },
    { name: 'Salvia',     value: '#33B679' },
    { name: 'Albahaca',   value: '#0B8043' },
    { name: 'Pavo Real',  value: '#039BE5' },
    { name: 'Arándano',   value: '#3F51B5' },
    { name: 'Uva',        value: '#8E24AA' },
    { name: 'Lavanda',    value: '#7986CB' },
    { name: 'Grafito',    value: '#616161' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)', borderRadius: '12px',
        padding: '1rem 1.5rem', marginBottom: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Horario Escolar
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
            {viewMode === 'section'
              ? (selectedSectionId
                  ? `Horario de la sección: ${classes.find(c => c.id === selectedSectionId)?.name || ''}`
                  : 'Vista por sección: selecciona un grado para ver el horario completo')
              : (readOnlyForeign
                  ? `Viendo horario de: ${viewedUser?.name || ''} (solo lectura)`
                  : (isAdmin ? `Gestionando: ${viewedUser?.name || 'Todos los docentes'}` : 'Organiza tus sesiones de clase'))}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-color-surface)', padding: '0.45rem 0.9rem',
            borderRadius: '20px', border: '1px solid var(--border-color)'
          }}>
            <LayoutGrid size={16} color="#5f6368" />
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                outline: 'none', fontWeight: 500, fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <option value="teacher">Vista por Docente</option>
              <option value="section">Vista por Sección</option>
            </select>
          </div>

          {viewMode === 'teacher' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-color-surface)', padding: '0.45rem 0.9rem',
              borderRadius: '20px', border: '1px solid var(--border-color)'
            }}>
              <User size={16} color="#5f6368" />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  outline: 'none', fontWeight: 500, fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {isAdmin && <option value="all">Todos los Docentes</option>}
                <option value={currentUser.id}>{isAdmin ? 'Mi Horario (Admin)' : 'Mi Horario'}</option>
                {teachers.filter(t => t.id !== currentUser.id).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'section' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg-color-surface)', padding: '0.45rem 0.9rem',
              borderRadius: '20px', border: '1px solid var(--border-color)'
            }}>
              <LayoutGrid size={16} color="#5f6368" />
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  outline: 'none', fontWeight: 500, fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">Seleccionar Sección</option>
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'teacher' && !readOnlyForeign && (
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--bg-color-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
              padding: '0.55rem 1.1rem', borderRadius: '20px', fontWeight: 500,
              cursor: 'pointer', fontSize: '0.85rem',
              boxShadow: '0 1px 2px rgba(60,64,67,0.15)',
              transition: 'box-shadow 0.2s ease, background 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(60,64,67,0.3)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.15)'; e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} /> Agregar Bloque
          </button>
          )}
        </div>
      </div>

      {/* Grid de horario */}
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-color-surface)',
          overflow: 'hidden'
        }}>
        <table style={{ tableLayout: 'fixed', minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                width: '110px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.7rem 0.5rem',
                textAlign: 'center'
              }}>
                Hora
              </th>
              {DAYS.map((day, idx) => (
                <th key={day} style={{
                  textAlign: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  borderLeft: idx > 0 ? '1px solid var(--border-color)' : 'none',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.7rem 0.5rem'
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(time => {
              const isBreak = time.includes('DESCANSO');
              if (isBreak) {
                return (
                  <tr key={time} style={{ height: '36px' }}>
                    <td style={{
                      fontSize: '0.68rem', fontWeight: 400, color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-muted)', textAlign: 'center',
                      borderTop: '1px solid var(--border-color)'
                    }}>{time}</td>
                    <td colSpan={DAYS.length} style={{
                      backgroundColor: 'var(--surface-muted)', textAlign: 'center',
                      fontSize: '0.66rem', color: '#bdc1c6', fontStyle: 'italic',
                      letterSpacing: '0.1em', borderTop: '1px solid var(--border-color)'
                    }}>D E S C A N S O</td>
                  </tr>
                );
              }
              if (viewMode === 'section') {
                return (
                  <tr key={time} style={{ height: '92px' }}>
                    <td style={{
                      fontSize: '0.72rem',
                      fontWeight: 400,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      {time}
                    </td>
                    {DAYS.map(day => {
                      const items = getSectionSlot(day, time);
                      return (
                        <td
                          key={day}
                          style={{
                            padding: '2px',
                            verticalAlign: 'top',
                            borderTop: '1px solid var(--border-color)',
                            borderLeft: '1px solid var(--border-color)'
                          }}
                        >
                          {items.length > 0 ? (
                            <div style={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}>
                              {items.map((item, i) => (
                                <div key={i} style={{
                                  backgroundColor: item.color,
                                  color: 'white',
                                  borderRadius: '6px',
                                  padding: '3px 5px',
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  overflow: 'hidden'
                                }}>
                                  <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.15, display: 'block' }}>
                                    {subjects.find(s => s.id === item.subjectId)?.name || 'Área...'}
                                  </span>
                                  <span style={{ fontSize: '0.55rem', opacity: 0.92, fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                    {users.find(u => u.id === item.userId)?.name || 'Desconocido'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--surface-muted)',
                              borderRadius: '6px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.7rem'
                            }}>
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              }
              return (
                <tr key={time} style={{ height: '92px' }}>
                  <td style={{
                    fontSize: '0.72rem',
                    fontWeight: 400,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {time}
                  </td>
                {DAYS.map(day => {
                  const item = getSlotContent(day, time);
                  const readOnly = readOnlyAll || readOnlyForeign;

                  return (
                    <td
                      key={day}
                      onClick={() => {
                        if (readOnly) return;
                        handleOpenModal(day, time, item);
                      }}
                      style={{
                        cursor: readOnly ? 'default' : 'pointer',
                        padding: 0,
                        verticalAlign: 'top',
                        borderTop: '1px solid var(--border-color)',
                        borderLeft: '1px solid var(--border-color)',
                        position: 'relative',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => { if (!item && !readOnly) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
                    >
                      {item ? (
                        <div style={{
                          backgroundColor: item.color,
                          color: 'white',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                          position: 'absolute',
                          top: '3px', left: '4px', right: '4px', bottom: '3px',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                          transition: 'filter 0.15s ease'
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.88)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                        >
                          {isAdmin && selectedUserId === 'all' && (
                            <span style={{ fontSize: '0.6rem', opacity: 0.85, fontWeight: 500, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {users.find(u => u.id === item.userId)?.name || 'Desconocido'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.25, letterSpacing: '0.02em', display: 'block' }}>
                            {item.classId === '__ATENCION__' ? 'ATENCION AL PADRE DE FAMILIA' : item.classId === '__TRABAJO__' ? 'TRABAJO COLEGIADO' : classes.find(c => c.id === item.classId)?.name || 'Grado...'}
                          </span>
                          {(item.classId !== '__ATENCION__' && item.classId !== '__TRABAJO__') && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2, opacity: 0.95, display: 'block' }}>
                              {subjects.find(s => s.id === item.subjectId)?.name || 'Área...'}
                            </span>
                          )}
                        </div>
                      ) : (
                        !readOnly && (
                          <div style={{
                            position: 'absolute',
                            top: '3px', left: '4px', right: '4px', bottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            transition: 'border-color 0.15s ease, color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <Plus size={18} />
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
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
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
              {isAdmin && !editingItem && selectedUserId !== 'all' && (
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
              {isAdmin && selectedUserId === 'all' && !editingItem && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Docente</label>
                  <select 
                    className="input-field" 
                    value={formData.userId || ''} 
                    onChange={e => setFormData({...formData, userId: e.target.value})}
                  >
                    <option value="">Seleccionar Docente</option>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Grado y Sección / Actividad</label>
                <select 
                  className="input-field" 
                  value={formData.classId} 
                  onChange={e => setFormData({...formData, classId: e.target.value, subjectId: ''})}
                >
                  <option value="">Seleccionar Grado</option>
                  <option value="__ATENCION__">ATENCION AL PADRE DE FAMILIA</option>
                  <option value="__TRABAJO__">TRABAJO COLEGIADO</option>
                  <optgroup label="Grados">
                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Área Curricular</label>
                <select 
                  className="input-field" 
                  value={formData.subjectId} 
                  onChange={e => setFormData({...formData, subjectId: e.target.value})}
                >
                  <option value="">Seleccionar Área</option>
                  {formData.classId === '__ATENCION__' && <option value="__ATENCION__">ATENCION AL PADRE DE FAMILIA</option>}
                  {formData.classId === '__TRABAJO__' && <option value="__TRABAJO__">TRABAJO COLEGIADO</option>}
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
                      background: 'var(--danger-tint-bg)', color: 'var(--danger-tint-fg)', border: 'none',
                      padding: '0.75rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
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
                    padding: '0.7rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 500,
                    transition: 'filter 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
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