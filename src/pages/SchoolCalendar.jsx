import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Sun, Bell, BookOpen, Star, Edit2, Trash2, Save, Download } from 'lucide-react';
import CALENDARIO_CIVICO from '../data/calendario-civico';

const EVENT_COLORS = {
  holiday: { solid: '#ef4444', soft: '#ef444420', text: '#ef4444' },
  meeting: { solid: '#3b82f6', soft: '#3b82f620', text: '#3b82f6' },
  event: { solid: '#10b981', soft: '#10b98120', text: '#10b981' },
  exam: { solid: '#f59e0b', soft: '#f59e0b20', text: '#f59e0b' },
  other: { solid: '#8b5cf6', soft: '#8b5cf620', text: '#8b5cf6' },
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

function EventTooltip({ ev, targetRef }) {
  if (!ev || !targetRef) return null;
  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
  const rect = targetRef.getBoundingClientRect();
  return (
    <div style={{
      position: 'fixed',
      left: Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160),
      top: rect.top - 6,
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
    </div>
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
  const tooltipTargetRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadCivicCalendar = async () => {
    const existingTitles = new Set(events.map(e => e.title));
    const toAdd = CALENDARIO_CIVICO.filter(ev => !existingTitles.has(ev.title));
    if (toAdd.length === 0) { alert('El Calendario Cívico ya está cargado'); return; }
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
        day: i, date: formatDate(d), isOutside: false,
        isToday: d.toDateString() === today.toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
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
    if (editingEvent) { updateEvent(editingEvent.id, formData); }
    else { addEvent(formData); }
    setShowForm(false);
    setEditingEvent(null);
  }

  const showTooltip = useCallback((ev, e) => {
    tooltipTargetRef.current = e.currentTarget;
    setTooltip(ev);
  }, []);

  const hideTooltip = useCallback(() => {
    tooltipTargetRef.current = null;
    setTooltip(null);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
        borderRadius: '20px', padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
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
      <div style={{
        background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden'
      }}>
        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={prevMonth} style={{
              padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: '#64748b', transition: 'all 0.15s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            ><ChevronLeft size={18} /></button>
            <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: 700, margin: '0 4px', minWidth: isMobile ? 'auto' : '170px', color: '#1e293b' }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} style={{
              padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: '#64748b', transition: 'all 0.15s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            ><ChevronRight size={18} /></button>
            <button onClick={goToday} style={{
              padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              color: '#64748b', transition: 'all 0.15s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >Hoy</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => openAddForm(formatDate(new Date()))} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none', padding: isMobile ? '0.45rem 0.7rem' : '0.6rem 1rem',
              borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.82rem',
              boxShadow: '0 3px 12px rgba(245, 158, 11, 0.3)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus size={isMobile ? 14 : 16} /> {isMobile ? 'Evento' : 'Nuevo Evento'}
            </button>
            <button onClick={loadCivicCalendar} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', border: 'none', padding: isMobile ? '0.45rem 0.7rem' : '0.6rem 1rem',
              borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.82rem',
              boxShadow: '0 3px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Download size={isMobile ? 14 : 16} /> {isMobile ? 'Cívico' : 'Calendario Cívico'}
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="cal-grid">
          {DAYS.map((d, idx) => (
            <div key={'h' + idx} className="cal-dow" style={{ fontSize: isMobile ? '0.62rem' : undefined }}>{d}</div>
          ))}
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.date] || [];
            const maxShow = isMobile ? 0 : 3;
            const remaining = dayEvents.length - maxShow;
            const classes = ['cal-cell'];
            if (cell.isToday) classes.push('cal-today');
            else if (cell.isWeekend) classes.push('cal-weekend');
            if (cell.isOutside) classes.push('cal-outside');
            return (
              <div key={idx} className={classes.join(' ')} onClick={() => openAddForm(cell.date)}>
                <div className="cal-daynum">{cell.day}</div>

                {isMobile && dayEvents.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {dayEvents.slice(0, 4).map(ev => (
                      <div key={ev.id} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: EVENT_COLORS[ev.type]?.solid || '#8b5cf6'
                      }} />
                    ))}
                  </div>
                )}

                {!isMobile && dayEvents.slice(0, maxShow).map(ev => {
                  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
                  const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  return (
                    <div key={ev.id} className="cal-chip"
                      onClick={(e) => { e.stopPropagation(); openEditForm(ev); }}
                      onMouseEnter={e => showTooltip(ev, e)}
                      onMouseMove={e => showTooltip(ev, e)}
                      onMouseLeave={hideTooltip}
                      style={{ background: colors.solid }}
                    >
                      <Icon size={10} style={{ flexShrink: 0 }} />
                      <span>{ev.title}</span>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div className="cal-more">+{remaining} más</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{
        display: 'flex', gap: '1rem', marginTop: '1rem',
        padding: '0.85rem 1.25rem', background: 'white', borderRadius: '14px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#94a3b8' }}>Tipos:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: colors.text }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: colors.solid, display: 'inline-block' }} />
              {label}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      <EventTooltip ev={tooltip} targetRef={tooltipTargetRef.current} />

      {/* Modal de evento */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1rem', zIndex: 1000
        }} onClick={() => setShowForm(false)}>
          <div style={{
            maxWidth: '420px', width: '100%', background: 'white',
            borderRadius: '20px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', maxHeight: '90vh', overflow: 'auto'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {editingEvent ? <Edit2 size={20} color="white" /> : <Plus size={20} color="white" />}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Título</label>
                <input className="input-field" type="text" placeholder="Ej. Día del Maestro"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Fecha</label>
                  <input className="input-field" type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Tipo</label>
                  <select className="input-field" value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%' }}>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Descripción (opcional)</label>
                <textarea className="input-field" placeholder="Descripción del evento..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
              {editingEvent && (
                <button onClick={() => { if (window.confirm('¿Eliminar este evento?')) { deleteEvent(editingEvent.id); setShowForm(false); } }} style={{
                  padding: '0.65rem 0.9rem', borderRadius: '10px',
                  background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem'
                }}>
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '0.65rem 1.1rem', borderRadius: '10px',
                  background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem'
                }}>Cancelar</button>
                <button onClick={handleSave} style={{
                  padding: '0.65rem 1.1rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem',
                  boxShadow: '0 3px 12px rgba(245, 158, 11, 0.3)'
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
