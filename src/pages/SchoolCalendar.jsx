import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Sun, Moon, Bell, BookOpen, AlertTriangle, Star, Edit2, Trash2, Save, Download } from 'lucide-react';
import CALENDARIO_CIVICO from '../data/calendario-civico';

const EVENT_COLORS = {
  holiday: { bg: '#ef444420', text: '#ef4444', border: '#ef4444' },
  meeting: { bg: '#3b82f620', text: '#3b82f6', border: '#3b82f6' },
  event: { bg: '#10b98120', text: '#10b981', border: '#10b981' },
  exam: { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b' },
  other: { bg: '#8b5cf620', text: '#8b5cf6', border: '#8b5cf6' },
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

export default function SchoolCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useStore();
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

  const loadCivicCalendar = () => {
    const existingTitles = new Set(events.map(e => e.title));
    let count = 0;
    CALENDARIO_CIVICO.forEach(ev => {
      if (!existingTitles.has(ev.title)) {
        addEvent(ev);
        count++;
      }
    });
    if (count > 0) {
      alert(`Se agregaron ${count} fechas del Calendario Cívico Escolar`);
    } else {
      alert('El Calendario Cívico ya está cargado');
    }
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
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

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
        borderRadius: '20px', padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '200px', height: '200px',
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
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
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={prevMonth} style={{
              padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: '#64748b', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
            ><ChevronLeft size={20} /></button>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, margin: 0, minWidth: isMobile ? 'auto' : '180px' }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} style={{
              padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: '#64748b', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
            ><ChevronRight size={20} /></button>
            <button onClick={goToday} style={{
              padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              color: '#64748b', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
            >Hoy</button>
          </div>
          <button onClick={() => openAddForm(formatDate(new Date()))} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white', border: 'none', padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1.25rem',
            borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.3)'; }}
          >
            <Plus size={isMobile ? 14 : 18} /> {isMobile ? 'Evento' : 'Nuevo Evento'}
          </button>
          <button onClick={loadCivicCalendar} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', border: 'none', padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1.25rem',
            borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)'; }}
          >
            <Download size={isMobile ? 14 : 18} /> {isMobile ? 'Cívico' : 'Calendario Cívico'}
          </button>
        </div>

        {/* Day names */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          minWidth: isMobile ? '560px' : 'auto'
        }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: 'center', padding: isMobile ? '0.5rem 0.1rem' : '0.75rem 0.25rem',
              fontWeight: 700, fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#94a3b8',
              borderBottom: '1px solid #f1f5f9'
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          minWidth: isMobile ? '560px' : 'auto'
        }}>
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.date] || [];
            const maxShow = isMobile ? 0 : 2;
            const remaining = dayEvents.length - maxShow;
            return (
              <div key={idx} onClick={() => openAddForm(cell.date)} style={{
                minHeight: isMobile ? '40px' : '90px', padding: isMobile ? '0.2rem' : '0.5rem',
                borderRight: (idx % 7 !== 6) ? '1px solid #f1f5f9' : 'none',
                borderBottom: (idx < 35) ? '1px solid #f1f5f9' : 'none',
                background: cell.isToday ? 'rgba(245, 158, 11, 0.05)' : 'white',
                cursor: 'pointer', transition: 'background 0.15s ease',
                opacity: cell.isOutside ? 0.4 : 1,
                position: 'relative'
              }}
                onMouseEnter={e => { if (!cell.isOutside) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = cell.isToday ? 'rgba(245, 158, 11, 0.05)' : 'white'; }}
              >
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: cell.isToday ? 800 : 600,
                  color: cell.isToday ? '#d97706' : '#1e293b',
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
                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditForm(ev); }} style={{
                      display: 'flex', alignItems: 'center', gap: '3px',
                      padding: '2px 6px', borderRadius: '6px', marginBottom: '2px',
                      background: colors.bg, color: colors.text,
                      fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      border: `1px solid ${colors.border}30`,
                      transition: 'all 0.15s ease'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.border; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${colors.border}30`; }}
                    >
                      <Icon size={10} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, paddingLeft: '6px' }}>
                    +{remaining} más
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div style={{
        display: 'flex', gap: '1rem', marginTop: '1rem',
        padding: '1rem 1.5rem', background: 'white', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Tipos de evento:</span>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key];
          const Icon = EVENT_TYPE_ICONS[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: colors.text }}>
              <Icon size={14} /> {label}
            </div>
          );
        })}
      </div>

      {/* Modal de evento */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1000
        }} onClick={() => setShowForm(false)}>
          <div style={{
            maxWidth: '450px', width: '100%', background: 'white',
            borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {editingEvent ? <Edit2 size={22} color="white" /> : <Plus size={22} color="white" />}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem'
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
                <button onClick={() => { deleteEvent(editingEvent.id); setShowForm(false); }} style={{
                  padding: '0.75rem 1rem', borderRadius: '12px',
                  background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Trash2 size={18} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '0.75rem 1.25rem', borderRadius: '12px',
                  background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                  fontWeight: 600, cursor: 'pointer'
                }}>Cancelar</button>
                <button onClick={handleSave} style={{
                  padding: '0.75rem 1.25rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
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
