import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Sun, Bell, BookOpen, Star, Edit2, Trash2, Save, Download } from 'lucide-react';
import CALENDARIO_CIVICO from '../data/calendario-civico';

const EVENT_COLORS = {
  holiday: { bg: '#fde8e8', text: '#c0392b', border: '#e74c3c', icon: '#e74c3c', dot: '#e74c3c' },
  meeting: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', icon: '#3b82f6', dot: '#3b82f6' },
  event: { bg: '#d1fae5', text: '#065f46', border: '#10b981', icon: '#10b981', dot: '#10b981' },
  exam: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', icon: '#f59e0b', dot: '#f59e0b' },
  other: { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6', icon: '#8b5cf6', dot: '#8b5cf6' },
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

function EventTooltip({ ev, position }) {
  if (!ev || !position) return null;
  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
  const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
  return (
    <div style={{
      position: 'fixed', left: position.x, top: position.y - 12,
      transform: 'translate(-50%, -100%)',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#f1f5f9',
      padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.78rem',
      zIndex: 9999, boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08), 0 0 20px ${colors.border}30`,
      lineHeight: 1.5, textAlign: 'left',
      pointerEvents: 'none', minWidth: '200px', maxWidth: '320px',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '8px',
          background: `${colors.border}25`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={14} color={colors.icon} />
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>{ev.title}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: ev.description ? '6px' : 0 }}>
        <div style={{
          padding: '2px 8px', borderRadius: '6px', background: `${colors.border}20`,
          color: colors.icon, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          {EVENT_TYPE_LABELS[ev.type] || 'Otro'}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
          {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      {ev.description && (
        <div style={{ color: '#cbd5e1', fontSize: '0.7rem', marginTop: '4px', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
          {ev.description.length > 100 ? ev.description.substring(0, 100) + '...' : ev.description}
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
        width: '10px', height: '10px', background: '#0f172a',
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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadCivicCalendar = async () => {
    const existingTitles = new Set(events.map(e => e.title));
    const toAdd = CALENDARIO_CIVICO.filter(ev => !existingTitles.has(ev.title));
    if (toAdd.length === 0) { alert('El Calendario Civico ya esta cargado'); return; }
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
      cells.push({ day: i, date: formatDate(d), isOutside: false, isToday: d.toDateString() === today.toDateString() });
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

  function showTooltip(ev, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ ev, x: rect.left + rect.width / 2, y: rect.top });
  }

  function hideTooltip() { setTooltip(null); }

  const totalEvents = Object.values(eventsByDate).reduce((sum, arr) => sum + arr.length, 0);
  const todayStr = formatDate(new Date());
  const todayEvents = eventsByDate[todayStr] || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #e67e22 40%, #f39c12 100%)',
        borderRadius: '24px', padding: isMobile ? '1.5rem 1.25rem' : '2.25rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(245, 158, 11, 0.35)'
      }}>
        <div style={{ position: 'absolute', top: '-60%', right: '-15%', width: '350px', height: '350px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40%', left: '-8%', width: '250px', height: '250px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '20%', right: '25%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <CalendarIcon size={30} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Calendario Escolar</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: '4px 0 0', fontWeight: 500 }}>Gestiona feriados, reuniones y eventos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '0.5rem 1rem', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{totalEvents}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eventos</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '0.5rem 1rem', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{todayEvents.length}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div style={{
        background: 'var(--bg-color-surface)', borderRadius: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}>
        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={prevMonth} style={{
              width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-main)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            ><ChevronLeft size={18} /></button>
            <h3 style={{
              fontSize: isMobile ? '1.05rem' : '1.3rem', fontWeight: 800, margin: '0 4px',
              minWidth: isMobile ? 'auto' : '180px', color: 'var(--text-primary)', letterSpacing: '-0.01em'
            }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} style={{
              width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-main)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            ><ChevronRight size={18} /></button>
            <button onClick={goToday} style={{
              height: '36px', padding: '0 14px', borderRadius: '10px', border: '1px solid var(--border-color)',
              background: 'var(--bg-color-main)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease', letterSpacing: '0.01em'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >Hoy</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => openAddForm(formatDate(new Date()))} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #f59e0b, #e67e22)',
              color: 'white', border: 'none', padding: isMobile ? '0.55rem 0.8rem' : '0.6rem 1rem',
              borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.82rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.35)'; }}
            >
              <Plus size={isMobile ? 14 : 16} /> {isMobile ? 'Nuevo' : 'Nuevo Evento'}
            </button>
            <button onClick={loadCivicCalendar} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', border: 'none', padding: isMobile ? '0.55rem 0.8rem' : '0.6rem 1rem',
              borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.82rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.35)'; }}
            >
              <Download size={isMobile ? 14 : 16} /> {isMobile ? 'Civico' : 'Calendario Civico'}
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', minWidth: 0 }}>
          {/* Day names */}
          {DAYS.map((d, idx) => (
            <div key={'h' + idx} style={{
              textAlign: 'center', padding: isMobile ? '0.6rem 0.2rem' : '0.85rem 0.5rem',
              fontWeight: 800, fontSize: isMobile ? '0.6rem' : '0.7rem', color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '2px solid var(--border-color)',
              background: 'var(--bg-color-main)'
            }}>{d}</div>
          ))}
          {/* Calendar cells */}
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.date] || [];
            const maxShow = isMobile ? 0 : 3;
            const remaining = dayEvents.length - maxShow;
            return (
              <div key={idx} onClick={() => openAddForm(cell.date)} style={{
                minHeight: isMobile ? '48px' : '110px', padding: isMobile ? '0.3rem' : '0.5rem',
                overflow: 'visible', boxSizing: 'border-box',
                borderBottom: (idx < 35) ? '1px solid var(--border-color)' : 'none',
                background: cell.isToday ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: cell.isOutside ? 0.3 : 1,
                position: 'relative',
                borderLeft: dayEvents.length > 0 && !cell.isOutside ? `3px solid ${EVENT_COLORS[dayEvents[0].type]?.dot || '#10b981'}` : 'none'
              }}
                onMouseEnter={e => {
                  if (!cell.isOutside) {
                    e.currentTarget.style.background = cell.isToday
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(245, 158, 11, 0.06) 100%)'
                      : 'rgba(99, 102, 241, 0.04)';
                    e.currentTarget.style.zIndex = '2';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = cell.isToday ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)' : 'transparent';
                  e.currentTarget.style.zIndex = '1';
                }}
              >
                {/* Day number */}
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.82rem', fontWeight: cell.isToday ? 900 : 600,
                  color: cell.isToday ? 'white' : 'var(--text-primary)',
                  width: isMobile ? '24px' : '30px', height: isMobile ? '24px' : '30px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: '10px',
                  background: cell.isToday ? 'linear-gradient(135deg, #f59e0b, #e67e22)' : 'transparent',
                  marginBottom: '4px',
                  boxShadow: cell.isToday ? '0 3px 10px rgba(245, 158, 11, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}>{cell.day}</div>

                {/* Events */}
                {dayEvents.slice(0, maxShow).map(ev => {
                  const Icon = EVENT_TYPE_ICONS[ev.type] || CalendarIcon;
                  const colors = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
                  return (
                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditForm(ev); }}
                      onMouseEnter={e => showTooltip(ev, e)}
                      onMouseMove={e => showTooltip(ev, e)}
                      onMouseLeave={hideTooltip}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '8px', marginBottom: '3px',
                        background: colors.bg, color: colors.text,
                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        border: `1px solid ${colors.border}30`,
                        transition: 'all 0.15s ease', lineHeight: 1.4
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                        background: `${colors.border}20`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={10} color={colors.icon} />
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div style={{
                    fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700,
                    paddingLeft: '4px', marginTop: '1px'
                  }}>
                    +{remaining} mas
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
        padding: '1rem 1.5rem', background: 'var(--bg-color-surface)', borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)'
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipos:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key];
          const Icon = EVENT_TYPE_ICONS[key];
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: colors.text,
              background: colors.bg, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${colors.border}25`
            }}>
              <Icon size={13} color={colors.icon} /> {label}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      <EventTooltip ev={tooltip?.ev} position={tooltip ? { x: tooltip.x, y: tooltip.y } : null} />

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '1rem', zIndex: 1000
        }} onClick={() => setShowForm(false)}>
          <div style={{
            maxWidth: '460px', width: '100%', background: 'var(--bg-color-surface)',
            borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)',
            position: 'relative', border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #e67e22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}>
                  {editingEvent ? <Edit2 size={22} color="white" /> : <Plus size={22} color="white" />}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)',
                background: 'var(--bg-color-main)', color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Titulo</label>
                <input className="input-field" type="text" placeholder="Ej. Dia del Maestro"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha</label>
                  <input className="input-field" type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo</label>
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
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descripcion (opcional)</label>
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
                  padding: '0.7rem 1rem', borderRadius: '12px',
                  background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem'
                }}>
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '0.7rem 1.25rem', borderRadius: '12px',
                  background: 'var(--bg-color-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem'
                }}>Cancelar</button>
                <button onClick={handleSave} style={{
                  padding: '0.7rem 1.25rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #e67e22)',
                  color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
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
