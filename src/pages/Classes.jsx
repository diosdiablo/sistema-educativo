import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, GraduationCap, X, LayoutGrid, BookOpen } from 'lucide-react';

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

  return (
    <div className="animate-fade-in">
      {/* Barra de herramientas */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Grados y Secciones</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Gestiona las aulas disponibles del sistema · {classes.length} registrados</p>
        </div>
        <button 
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.25rem',
            borderRadius: '20px',
            fontSize: '0.875rem'
          }}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          Nuevo Grado
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--nav-active-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={20} color="var(--nav-active-fg)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 500, margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Agregar Nuevo Grado</h3>
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
                borderRadius: '50%',
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
                padding: '0.6rem 1.25rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              Guardar Grado
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      {classes.length === 0 ? (
        <div style={{
          background: 'var(--surface-muted)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--bg-color-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <LayoutGrid size={36} color="var(--text-secondary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No hay grados registrados
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Comienza agregando el primer grado o sección para tu institución
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ marginTop: '1.5rem', padding: '0.55rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem' }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Agregar Primer Grado
          </button>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="styled-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '120px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGrid size={16} />
                    ID
                  </div>
                </th>
                <th style={{ minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={16} />
                    Grado y Sección
                  </div>
                </th>
                <th style={{ minWidth: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} />
                    Color
                  </div>
                </th>
                <th style={{ minWidth: '120px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
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
                        padding: '0.45rem 0.9rem',
                        borderRadius: '10px',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <GraduationCap size={18} color="var(--nav-active-fg)" />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: c.color || '#188038',
                          border: '1px solid var(--border-color)'
                        }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.color || '#188038'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        style={{
                          background: 'var(--danger-tint-bg)',
                          border: '1px solid transparent',
                          borderRadius: '10px',
                          padding: '0.55rem',
                          cursor: 'pointer',
                          color: 'var(--danger-tint-fg)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que deseas eliminar el grado "${c.name}"? Se perderán las asociaciones de este grado.`)) {
                            deleteClass(c.id);
                          }
                        }}
                      >
                        <Trash2 size={17} />
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