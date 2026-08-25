import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Sun, Moon, Bell, BookOpen, AlertTriangle, Star, Edit2, Trash2, Save, Download } from 'lucide-react';
import CALENDARIO_CIVICO from '../data/calendario-civico';

const EVENT_COLORS = {
  holiday: { bg: '#D50000', text: '#ffffff', dark: '#990000' },
  meeting: { bg: '#039BE5', text: '#ffffff', dark: '#0277bd' },
  event: { bg: '#0B8043', text: '#ffffff', dark: '#095c32' },
  exam: { bg: '#F4511E', text: '#ffffff', dark: '#c33c10' },
  other: { bg: '#8E24AA', text: '#ffffff', dark: '#6a1b9a' },
};

const EVENT_TYPE_LABELS = {
  holiday: 'Feriado',
  meeting: 'Reunión',
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
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function EventTooltip({ data }) {
  if (!data) return null;
  const { ev, x, y } = data;
  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
  const clampedX = Math.min(Math.max(x, 160), window.innerWidth - 160);
  return createPortal(
    <div style={{
      position: 'fixed',
      left: clampedX,
      top: y - 10,
      transform: 'translate(-50%, -100%)',
      background: '#1e293b', color: '#f1f5f9',
      padding: '0.55rem 0.85rem', borderRadius: '10px', fontSize: '0.75rem',
      zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      lineHeight: 1.4, textAlign: 'left',
      pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: '320px',
    }}>
      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Icon size={12} /> {ev.title}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '2px' }}>
        {EVENT_TYPE_LABELS[ev.type] || 'Otro'} · {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      {ev.description && (
        <div style={{ color: '#cbd5e1', fontSize: '0.65rem', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', whiteSpace: 'normal' }}>
          {ev.description.length > 90 ? ev.description.substring(0, 90) + '...' : ev.description}
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
        width: '8px', height: '8px', background: '#1e293b'
      }} />
    </div>,
    document.body
  );
}

export default function SchoolCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, seedEvents } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({ title: '', date: '', type: 'event', description: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadCivicCalendar = async () => {
    const existingTitles = new Set(events.map(e => e.title));
    const toAdd = CALENDARIO_CIVICO.filter(ev => !existingTitles.has(ev.title));
    if (toAdd.length === 0) {
      alert('El Calendario Cívico ya está cargado');
      return;
    }
    await seedEvents(toAdd);
    alert(`Se agregaron ${toAdd.length} fechas del Calendario Cívico Escolar`);
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
        day: i,
        date: formatDate(d),
        isOutside: false,
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
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() {
    setTooltip(null);
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setTooltip(null);
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setTooltip(null);
    setCurrentDate(new Date());
  }

  function openAddForm(dateStr) {
    setEditingEvent(null);
    setSelectedDate(dateStr);
    setFormData({ title: '', date: dateStr || formatDate(new Date()), type: 'event', description: '' });
    setShowForm(true);
  }

  function openEditForm(ev) {
    setTooltip(null);
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

  const showTooltip = useCallback((ev, e) => {
    setTooltip({ ev, x: e.clientX, y: e.clientY });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Calendar card */}
      <div style={{ background: 'var(--bg-color-surface)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexWrap: 'wrap' }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 400, margin: 0,
              color: 'var(--text-primary)', letterSpacing: '-0.02em'
            }}>
              {MONTHS[month]} <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>{year}</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button onClick={prevMonth} title="Mes anterior" style={{
                padding: '0.45rem', borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: 'var(--text-secondary)', transition: 'background 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              ><ChevronLeft size={22} /></button>
              <button onClick={nextMonth} title="Mes siguiente" style={{
                padding: '0.45rem', borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: 'var(--text-secondary)', transition: 'background 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              ><ChevronRight size={22} /></button>
            </div>
            <button onClick={goToday} style={{
              padding: '0.45rem 1rem', borderRadius: '20px',
              border: '1px solid var(--border-color)', background: 'var(--bg-color-surface)', cursor: 'pointer',
              fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)',
              transition: 'box-shadow 0.2s ease, background 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67,0.3)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
            >Hoy</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => openAddForm(formatDate(new Date()))} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--bg-color-surface)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', padding: isMobile ? '0.45rem 0.75rem' : '0.55rem 1.1rem',
              borderRadius: '20px', fontWeight: 500, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              boxShadow: '0 1px 2px rgba(60,64,67,0.15)',
              transition: 'box-shadow 0.2s ease, background 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(60,64,67,0.3)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.15)'; e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
            >
              <Plus size={isMobile ? 14 : 18} /> {isMobile ? 'Evento' : 'Nuevo Evento'}
            </button>
            <button onClick={loadCivicCalendar} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--bg-color-surface)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', padding: isMobile ? '0.45rem 0.75rem' : '0.55rem 1.1rem',
              borderRadius: '20px', fontWeight: 500, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              boxShadow: '0 1px 2px rgba(60,64,67,0.15)',
              transition: 'box-shadow 0.2s ease, background 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(60,64,67,0.3)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.15)'; e.currentTarget.style.background = 'var(--bg-color-surface)'; }}
            >
              <Download size={isMobile ? 14 : 18} /> {isMobile ? 'Cívico' : 'Calendario Cívico'}
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          width: '100%', minWidth: 0,
          borderTop: '1px solid var(--border-color)'
        }}>
          {/* Day names */}
          {DAYS.map((d, idx) => (
            <div key={'h' + idx} style={{
              textAlign: 'center', padding: isMobile ? '0.3rem' : '0.6rem',
              fontWeight: 500, fontSize: isMobile ? '0.6rem' : '0.72rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
              boxSizing: 'border-box',
              borderBottom: '1px solid var(--border-color)',
              borderRight: (idx % 7 !== 6) ? '1px solid var(--border-color)' : 'none'
            }}>{d}</div>
          ))}
          {/* Calendar cells */}
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.date] || [];
            const maxShow = isMobile ? 1 : 3;
            const remaining = dayEvents.length - maxShow;
            return (
              <div key={idx} onClick={() => openAddForm(cell.date)} style={{
                minHeight: isMobile ? '44px' : '96px', padding: isMobile ? '2px 3px' : '4px 5px',
                overflow: 'hidden', boxSizing: 'border-box',
                borderRight: (idx % 7 !== 6) ? '1px solid var(--border-color)' : 'none',
                borderBottom: '1px solid var(--border-color)',
                background: cell.isToday ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                cursor: 'pointer', transition: 'background 0.15s ease',
                position: 'relative'
              }}
                onMouseEnter={e => { if (!cell.isToday) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = cell.isToday ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)'; }}
              >
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: cell.isToday ? 700 : 400,
                  color: cell.isToday ? '#ffffff' : (cell.isOutside ? 'var(--text-secondary)' : 'var(--text-primary)'),
                  width: isMobile ? '18px' : '24px', height: isMobile ? '18px' : '24px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: cell.isToday ? '#1a73e8' : 'transparent',
                  marginBottom: '2px'
                }}>{cell.day}</div>
                {dayEvents.slice(0, maxShow).map(ev => {
                  const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  return (
                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditForm(ev); }} style={{
                      padding: isMobile ? '1px 4px' : '1.5px 6px', borderRadius: '4px', marginBottom: '2px',
                      background: colors.bg, color: colors.text,
                      fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 500, cursor: 'pointer',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      transition: 'filter 0.15s ease'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.88)'; showTooltip(ev, e); }}
                      onMouseMove={e => showTooltip(ev, e)}
                      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; hideTooltip(); }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '5px' }}>
                    +{remaining} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div style={{
        display: 'flex', gap: '1rem', marginTop: '0.75rem',
        padding: '0.75rem 1.25rem', background: 'var(--bg-color-surface)', borderRadius: '12px',
        border: '1px solid var(--border-color)', flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipos de evento:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.bg, display: 'inline-block' }} />
              {label}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      <EventTooltip data={tooltip} />

      {/* Modal de evento */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1000
        }} onClick={() => setShowForm(false)}>
          <div style={{
            maxWidth: '450px', width: '100%', background: 'var(--bg-color-surface)',
            borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'var(--nav-active-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {editingEvent ? <Edit2 size={22} color="var(--nav-active-fg)" /> : <Plus size={22} color="var(--nav-active-fg)" />}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem'
              }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Título</label>
                <input className="input-field" type="text" placeholder="Ej. Día del Maestro"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Fecha</label>
                <input className="input-field" type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Tipo</label>
                <select className="input-field" value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%' }}>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Descripción (opcional)</label>
                <textarea className="input-field" placeholder="Descripción del evento..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {editingEvent && (
                <button onClick={() => { if (window.confirm('¿Eliminar este evento?')) { deleteEvent(editingEvent.id); setShowForm(false); } }} style={{
                  padding: '0.75rem 1rem', borderRadius: '20px',
                  background: 'var(--danger-tint-bg)', color: 'var(--danger-tint-fg)', border: 'none',
                  fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Trash2 size={18} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '0.75rem 1.25rem', borderRadius: '20px',
                  background: 'var(--bg-color-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                  fontWeight: 500, cursor: 'pointer'
                }}>Cancelar</button>
                <button onClick={handleSave} className="btn-primary" style={{
                  padding: '0.75rem 1.25rem', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Save size={18} /> {editingEvent ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
