import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, ListChecks } from 'lucide-react';

export default function Subjects() {
  const { subjects, addSubject, deleteSubject, addCompetency, deleteCompetency } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  
  const [newComps, setNewComps] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newSubject.trim()) {
      addSubject(newSubject.trim());
      setNewSubject('');
      setShowForm(false);
    }
  };

  const handleAddCompetency = (subjectId) => {
    const val = newComps[subjectId];
    if (val && val.trim()) {
      addCompetency(subjectId, val.trim());
      setNewComps({ ...newComps, [subjectId]: '' });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Áreas y Competencias</h2>
          <p className="page-subtitle">Gestiona las materias y sus criterios de evaluación integrados</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Nueva Área
        </button>
      </div>

      {showForm && (
        <form className="card animate-fade-in" style={{ marginBottom: '2rem' }} onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem' }}>Agregar Área Curricular</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Nombre de la materia (Ej. Educación Física)" 
              value={newSubject} 
              onChange={e => setNewSubject(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {subjects.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No hay áreas curriculares registradas en el sistema.
          </div>
        ) : (
          subjects.map(subject => (
            <div key={subject.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{subject.name}</h3>
                <button 
                  className="btn-danger" 
                  style={{ padding: '0.4rem' }} 
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar el área completa "${subject.name}" con todas sus competencias?`)) {
                      deleteSubject(subject.id);
                    }
                  }} 
                  title="Eliminar Área Completa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListChecks size={16} /> Competencias ({subject.competencies?.length || 0})
                </h4>
                
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(subject.competencies || []).map(comp => (
                    <li key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ flex: 1, paddingRight: '0.5rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>{comp.name}</span>
                      <button 
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', opacity: 0.8 }} 
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la competencia "${comp.name}"?`)) {
                            deleteCompetency(subject.id, comp.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {(!subject.competencies || subject.competencies.length === 0) && (
                    <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      Sin competencias definidas.
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nueva competencia..." 
                  style={{ padding: '0.6rem', fontSize: '0.875rem' }}
                  value={newComps[subject.id] || ''}
                  onChange={(e) => setNewComps({...newComps, [subject.id]: e.target.value})}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCompetency(subject.id); }}
                />
                <button className="btn-primary" style={{ padding: '0.6rem', display: 'flex', alignItems: 'center' }} onClick={() => handleAddCompetency(subject.id)}>
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
