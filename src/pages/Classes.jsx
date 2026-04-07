import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2 } from 'lucide-react';

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Grados y Secciones</h2>
          <p className="page-subtitle">Gestiona las aulas disponibles</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Nuevo Grado/Sección
        </button>
      </div>

      {showForm && (
        <form className="card animate-fade-in" style={{ marginBottom: '2rem' }} onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Agregar Aula</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Nombre del grado y sección (Ej. 1ro Secundaria - A)" 
              value={newClass} 
              onChange={e => setNewClass(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Grado y Sección</th>
              <th>Color</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
              {classes.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No hay grados registrados.</td></tr>
              ) : (
              classes.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.id.slice(-5)}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '6px', 
                        backgroundColor: c.color || '#10b981',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {c.color || '#10b981'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn-danger" 
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas eliminar el grado "${c.name}"? Se perderán las asociaciones de este grado.`)) {
                          deleteClass(c.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
