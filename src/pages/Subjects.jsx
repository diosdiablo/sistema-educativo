import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, BookOpen, X, Target } from 'lucide-react';

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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Áreas Curriculares</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Gestiona las materias y sus competencias de evaluación · {subjects.length} áreas</p>
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
          Nueva Área
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
                <h3 style={{ fontWeight: 500, margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Agregar Nueva Área Curricular</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Ingresa el nombre de la materia o área</p>
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
                placeholder="Ej. Educación Física, Comunicación, Matemática" 
                value={newSubject} 
                onChange={e => setNewSubject(e.target.value)} 
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
              Guardar Área
            </button>
          </form>
        </div>
      )}

      {/* Grid de tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {subjects.length === 0 ? (
          <div style={{
            background: 'var(--surface-muted)',
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            gridColumn: '1 / -1'
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
              <BookOpen size={36} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No hay áreas curriculares
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
              Comienza agregando las áreas o materias de tu institución
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.55rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem' }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              Agregar Primera Área
            </button>
          </div>
        ) : (
          subjects.map((subject) => {
            return (
              <div key={subject.id} style={{
                background: 'var(--bg-color-surface)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--nav-active-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BookOpen size={22} color="var(--nav-active-fg)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{subject.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{subject.competencies?.length || 0} competencias</p>
                    </div>
                  </div>
                  <button 
                    style={{
                      background: 'var(--danger-tint-bg)',
                      border: '1px solid transparent',
                      borderRadius: '10px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--danger-tint-fg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que deseas eliminar el área completa "${subject.name}" con todas sus competencias?`)) {
                        deleteSubject(subject.id);
                      }
                    }}
                    title="Eliminar Área Completa"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                
                {/* Competencias */}
                <div style={{ flex: 1, marginBottom: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--nav-active-bg)',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <Target size={16} color="var(--nav-active-fg)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Competencias</span>
                  </div>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(subject.competencies || []).map((comp, compIdx) => (
                      <li key={comp.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        background: 'var(--surface-muted)',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--nav-active-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            color: 'var(--nav-active-fg)',
                            flexShrink: 0
                          }}>
                            {compIdx + 1}
                          </div>
                          <span style={{ flex: 1, lineHeight: 1.4, color: 'var(--text-primary)' }}>{comp.name}</span>
                        </div>
                        <button 
                          style={{ 
                            color: 'var(--danger-tint-fg)', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            padding: '0.2rem',
                            opacity: 0.6
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
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
                      <li style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)', 
                        fontStyle: 'italic', 
                        padding: '1rem', 
                        textAlign: 'center', 
                        background: 'var(--surface-muted)', 
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)'
                      }}>
                        Sin competencias definidas
                      </li>
                    )}
                  </ul>
                </div>

                {/* Input para nueva competencia */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Nueva competencia..." 
                    style={{ padding: '0.6rem', fontSize: '0.875rem', flex: 1 }}
                    value={newComps[subject.id] || ''}
                    onChange={(e) => setNewComps({...newComps, [subject.id]: e.target.value})}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCompetency(subject.id); }}
                  />
                  <button 
                    className="btn-primary" 
                    style={{ 
                      padding: '0.6rem', 
                      display: 'flex', 
                      alignItems: 'center'
                    }} 
                    onClick={() => handleAddCompetency(subject.id)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}