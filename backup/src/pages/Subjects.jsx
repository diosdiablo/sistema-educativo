import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, BookOpen, X, Target, LayoutGrid, Users, GraduationCap } from 'lucide-react';

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

  const gradientColors = [
    ['#667eea', '#764ba2'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777'],
    ['#14b8a6', '#0d9488'],
    ['#3b82f6', '#2563eb']
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
              <BookOpen size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Áreas Curriculares</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona las materias y sus competencias de evaluación</p>
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
            Nueva Área
          </button>
        </div>
      </div>

      {/* Formulario moderno */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>Agregar Nueva Área Curricular</h3>
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '0.75rem 1.5rem',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {subjects.length === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
            borderRadius: '20px',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '2px dashed #cbd5e1',
            gridColumn: '1 / -1'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <BookOpen size={40} color="white" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No hay áreas curriculares
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
              Comienza agregando las áreas o materias de tu institución
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              Agregar Primera Área
            </button>
          </div>
        ) : (
          subjects.map((subject, idx) => {
            const [color1, color2] = gradientColors[idx % gradientColors.length];
            return (
              <div key={subject.id} style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${color1}20`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '150px',
                  height: '150px',
                  background: `linear-gradient(135deg, ${color1}10, ${color2}10)`,
                  borderRadius: '50%'
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 15px ${color1}40`
                    }}>
                      <BookOpen size={22} color="white" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{subject.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{subject.competencies?.length || 0} competencias</p>
                    </div>
                  </div>
                  <button 
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que deseas eliminar el área completa "${subject.name}" con todas sus competencias?`)) {
                        deleteSubject(subject.id);
                      }
                    }}
                    title="Eliminar Área Completa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {/* Competencias */}
                <div style={{ flex: 1, marginBottom: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '0.5rem 0.75rem',
                    background: `linear-gradient(135deg, ${color1}10, ${color2}10)`,
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <Target size={16} color={color1} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Competencias</span>
                  </div>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(subject.competencies || []).map((comp, compIdx) => (
                      <li key={comp.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        background: '#f8fafc',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: `linear-gradient(135deg, ${color1}, ${color2})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0
                          }}>
                            {compIdx + 1}
                          </div>
                          <span style={{ flex: 1, lineHeight: 1.4, color: 'var(--text-primary)' }}>{comp.name}</span>
                        </div>
                        <button 
                          style={{ 
                            color: '#ef4444', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            padding: '0.2rem',
                            opacity: 0.7,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'scale(1)'; }}
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
                        background: '#f8fafc', 
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        Sin competencias definidas
                      </li>
                    )}
                  </ul>
                </div>

                {/* Input para nueva competencia */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
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
                      alignItems: 'center',
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                      border: 'none'
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