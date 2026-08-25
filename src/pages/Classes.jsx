import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, GraduationCap, X, Users, LayoutGrid, BookOpen } from 'lucide-react';

export default function Classes() {
  const { classes, addClass, deleteClass } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newClass.trim()) {
      addClass(newClass.trim());
      setNewClass('');
      setShowForm(false);
    }
  };

  const gradientColors = [
    ['#3f51b5', '#7627bb'],
    ['#188038', '#146c2e'],
    ['#e37400', '#b06000'],
    ['#d93025', '#b3261e'],
    ['#7627bb', '#6a1b9a'],
    ['#c2185b', '#ad1457']
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: '#c2185b',
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
              <GraduationCap size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Grados y Secciones</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona las aulas disponibles del sistema</p>
            </div>
          </div>
          <button 
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} />
            Nuevo Grado
          </button>
        </div>
      </div>

      {/* Formulario moderno */}
      {showForm && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(26, 115, 232, 0.2)'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#7627bb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>Agregar Nuevo Grado</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Ingresa el nombre del grado y sección</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input 
                type="text" 
                className="input-field"
                placeholder="Ej. 1ro Secundaria - A" 
                value={newClass} 
                onChange={e => setNewClass(e.target.value)} 
                required 
                style={{ width: '100%' }}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ 
                background: '#7627bb',
                border: 'none',
                padding: '0.75rem 1.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              Guardar Grado
            </button>
          </form>
        </div>
      )}

      {/* Tabla moderna */}
      {classes.length === 0 ? (
        <div style={{
          background: 'var(--surface-muted)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#7627bb',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <LayoutGrid size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No hay grados registrados
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Comienza agregando el primer grado o sección para tu institución
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ marginTop: '1.5rem', background: '#7627bb' }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Agregar Primer Grado
          </button>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <table className="styled-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ 
                  minWidth: '120px', 
                  background: '#7627bb', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGrid size={16} />
                    ID
                  </div>
                </th>
                <th style={{ 
                  minWidth: '250px', 
                  background: '#7627bb', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={16} />
                    Grado y Sección
                  </div>
                </th>
                <th style={{ 
                  minWidth: '150px', 
                  background: '#7627bb', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} />
                    Color
                  </div>
                </th>
                <th style={{ 
                  minWidth: '120px', 
                  background: '#7627bb', 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Users size={16} />
                    Acciones
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, idx) => {
                const [color1, color2] = gradientColors[idx % gradientColors.length];
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {c.id.slice(-8)}
                    </td>
                    <td>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        background: `${color1}15`,
                        border: `1px solid ${color1}30`
                      }}>
                        <GraduationCap size={18} color={color1} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          background: c.color || '#188038',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.color || '#188038'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        style={{
                          background: 'rgba(217, 48, 37, 0.1)',
                          border: '1px solid rgba(217, 48, 37, 0.3)',
                          borderRadius: '10px',
                          padding: '0.6rem',
                          cursor: 'pointer',
                          color: '#d93025',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(217, 48, 37, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(217, 48, 37, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que deseas eliminar el grado "${c.name}"? Se perderán las asociaciones de este grado.`)) {
                            deleteClass(c.id);
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}