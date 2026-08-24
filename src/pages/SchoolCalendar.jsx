import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Sun, Bell, BookOpen, Star, Edit2, Trash2, Save, Download } from 'lucide-react';
import CALENDARIO_CIVICO from '../data/calendario-civico';

const EVENT_COLORS = {
  holiday: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: '#ef4444', gradient: ['#ef4444', '#dc2626'] },
  meeting: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] },
  event: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: '#10b981', gradient: ['#10b981', '#059669'] },
  exam: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  other: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
};

const EVENT_TYPE_LABELS = {
  holiday: 'Feriado',
  meeting: 'Reunion',
  event: 'Evento',
  exam: 'Examen',
  other: 'Otro',
};

const EVENT_TYPE_ICONS = {
  holiday: Sun,
  meeting: Bell,
  event: Star,
  exam: BookOpen,
  other: CalendarIcon,
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export default function SchoolCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, seedEvents } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({ title: '', date: '', type: 'event', description: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadCivicCalendar = async () => {
    const existingTitles = new Set(events.map(e => e.title));
    const toAdd = CALENDARIO_CIVICO.filter(ev => !existingTitles.has(ev.title));
    if (toAdd.length === 0) {
      alert('El Calendario Civico ya esta cargado');
      return;
    }
    await seedEvents(toAdd);
    alert(`Se agregaron ${toAdd.length} fechas del Calendario Civico Escolar`);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1);
      cells.push({ day: d.getDate(), date: formatDate(d), isOutside: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const today = new Date();
      cells.push({
        day: i, date: formatDate(d), isOutside: false,
        isToday: d.toDateString() === today.toDateString(),
      });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ day: d.getDate(), date: formatDate(d), isOutside: true });
    }
    return cells;
  }, [year, month]);

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      const isDuplicate = map[ev.date].some(e => e.title === ev.title && e.type === ev.type);
      if (!isDuplicate) map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }
  function goToday() { setCurrentDate(new Date()); }

  function openAddForm(dateStr) {
    setEditingEvent(null);
    setSelectedDate(dateStr);
    setFormData({ title: '', date: dateStr || formatDate(new Date()), type: 'event', description: '' });
    setShowForm(true);
  }

  function openEditForm(ev) {
    setEditingEvent(ev);
    setSelectedDate(ev.date);
    setFormData({ title: ev.title, date: ev.date, type: ev.type, description: ev.description || '' });
    setShowForm(true);
  }

  function handleSave() {
    if (!formData.title.trim()) return;
    if (editingEvent) {
      updateEvent(editingEvent.id, formData);
    } else {
      addEvent(formData);
    }
    setShowForm(false);
    setEditingEvent(null);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
        borderRadius: '24px', padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', backdropFilter: 'blur(10px)'
          }}>
            <CalendarIcon size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Calendario Escolar</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona feriados, reuniones y eventos importantes</p>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={prevMonth} style={{
              padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            ><ChevronLeft size={20} /></button>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, margin: 0, minWidth: isMobile ? 'auto' : '180px', color: 'var(--text-primary)' }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} style={{
              padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            ><ChevronRight size={20} /></button>
            <button onClick={goToday} style={{
              padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-surface)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >Hoy</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => openAddForm(formatDate(new Date()))} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none', padding: isMobile ? '0.5rem 0.75rem' : '0.65rem 1.1rem',
              borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus size={isMobile ? 14 : 18} /> {isMobile ? 'Evento' : 'Nuevo Evento'}
            </button>
            <button onClick={loadCivicCalendar} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', border: 'none', padding: isMobile ? '0.5rem 0.75rem' : '0.65rem 1.1rem',
              borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Download size={isMobile ? 14 : 18} /> {isMobile ? 'Civico' : 'Calendario Civico'}
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', minWidth: 0 }}>
          {/* Day names */}
          {DAYS.map((d, idx) => (
            <div key={'h' + idx} style={{
              textAlign: 'center', padding: isMobile ? '0.5rem 0.2rem' : '0.75rem 0.5rem',
              fontWeight: 700, fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border-color)',
              borderRight: (idx % 7 !== 6) ? '1px solid var(--border-color)' : 'none'
            }}>{d}</div>
          ))}
          {/* Calendar cells */}
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.date] || [];
            const maxShow = isMobile ? 0 : 2;
            const remaining = dayEvents.length - maxShow;
            return (
              <div key={idx} onClick={() => openAddForm(cell.date)} style={{
                minHeight: isMobile ? '44px' : '100px', padding: isMobile ? '0.25rem' : '0.5rem',
                overflow: 'hidden', boxSizing: 'border-box',
                borderRight: (idx % 7 !== 6) ? '1px solid var(--border-color)' : 'none',
                borderBottom: (idx < 35) ? '1px solid var(--border-color)' : 'none',
                background: cell.isToday ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s ease',
                opacity: cell.isOutside ? 0.35 : 1,
                position: 'relative', borderRadius: '0'
              }}
                onMouseEnter={e => { if (!cell.isOutside) e.currentTarget.style.background = cell.isToday ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-color-main)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = cell.isToday ? 'rgba(245, 158, 11, 0.06)' : 'transparent'; }}
              >
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: cell.isToday ? 800 : 600,
                  color: cell.isToday ? '#d97706' : 'var(--text-primary)',
                  width: isMobile ? '22px' : '28px', height: isMobile ? '22px' : '28px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: cell.isToday ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  marginBottom: '0.25rem'
                }}>{cell.day}</div>
                {dayEvents.slice(0, maxShow).map(ev => {
                  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
                  const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  return (
                    <div key={ev.id} className="event-tooltip-wrapper" onClick={(e) => { e.stopPropagation(); openEditForm(ev); }} style={{
                      position: 'relative', display: 'flex', alignItems: 'center', gap: '3px',
                      padding: '2px 6px', borderRadius: '6px', marginBottom: '2px',
                      background: colors.bg, color: colors.text,
                      fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      border: `1px solid ${colors.border}20`,
                      transition: 'all 0.15s ease'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${colors.border}60`; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${colors.border}20`; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Icon size={10} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                      {/* Tooltip */}
                      <div className="event-tooltip" style={{
                        display: 'none', position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                        transform: 'translateX(-50%)', background: '#1e293b', color: '#f1f5f9',
                        padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.72rem',
                        whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.5, textAlign: 'left',
                        pointerEvents: 'none', minWidth: '150px'
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon size={11} /> {ev.title}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                          {EVENT_TYPE_LABELS[ev.type] || 'Otro'} - {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {ev.description && (
                          <div style={{ color: '#cbd5e1', fontSize: '0.65rem', marginTop: '3px', maxWidth: '250px', whiteSpace: 'normal' }}>
                            {ev.description.length > 80 ? ev.description.substring(0, 80) + '...' : ev.description}
                          </div>
                        )}
                        <div style={{
                          position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                          width: '10px', height: '10px', background: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.1)',
                          borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, paddingLeft: '6px' }}>
                    +{remaining} mas
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="dashboard-card" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipos:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key];
          const Icon = EVENT_TYPE_ICONS[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: colors.text }}>
              <Icon size={13} /> {label}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1000
        }} onClick={() => setShowForm(false)}>
          <div style={{
            maxWidth: '450px', width: '100%', background: 'var(--bg-color-surface)',
            borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', border: '1px solid var(--border-color)'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {editingEvent ? <Edit2 size={22} color="white" /> : <Plus size={22} color="white" />}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem'
              }}><X size={22} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Titulo</label>
                <input className="input-field" type="text" placeholder="Ej. Dia del Maestro"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</label>
                <input className="input-field" type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo</label>
                <select className="input-field" value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%' }}>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Descripcion (opcional)</label>
                <textarea className="input-field" placeholder="Descripcion del evento..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {editingEvent && (
                <button onClick={() => { if (window.confirm('Eliminar este evento?')) { deleteEvent(editingEvent.id); setShowForm(false); } }} style={{
                  padding: '0.75rem 1rem', borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
                }}>
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '0.75rem 1.25rem', borderRadius: '12px',
                  background: 'var(--bg-color-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                }}>Cancelar</button>
                <button onClick={handleSave} style={{
                  padding: '0.75rem 1.25rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}>
                  <Save size={16} /> {editingEvent ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
