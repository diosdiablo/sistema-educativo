import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Users, ThumbsUp, ThumbsDown, Plus, Trash2, Calendar, Search, Filter } from 'lucide-react';

export default function Behavior() {
  const { students, classes, behavior, currentUser, isAdmin, addBehaviorRecord, deleteBehaviorRecord } = useStore();

  const availableClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (!currentUser?.assignments) return [];
    const classIds = [...new Set(currentUser.assignments.map(a => a.classId))];
    return classes.filter(c => classIds.includes(c.id));
  }, [isAdmin, currentUser, classes]);

  const [selectedClass, setSelectedClass] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanSelected = selectedClass.trim().toLowerCase();
    return students.filter(s => {
      const cleanGrade = (s.gradeLevel || '').trim().toLowerCase();
      const cleanClass = (s.classId || '').trim().toLowerCase();
      return cleanGrade === cleanSelected || cleanClass === cleanSelected;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  const studentBehavior = useMemo(() => {
    const map = {};
    behavior.forEach(r => {
      if (!map[r.studentId]) map[r.studentId] = [];
      map[r.studentId].push(r);
    });
    Object.keys(map).forEach(k => map[k].sort((a, b) => new Date(b.date) - new Date(a.date)));
    return map;
  }, [behavior]);

  const [addingFor, setAddingFor] = useState(null);
  const [newRecord, setNewRecord] = useState({ type: 'positive', description: '', date: new Date().toISOString().split('T')[0] });

  const handleAdd = async (studentId) => {
    if (!newRecord.description.trim()) return;
    const student = students.find(s => s.id === studentId);
    await addBehaviorRecord({
      studentId, studentName: student?.name,
      classId: student?.classId || selectedClass,
      type: newRecord.type,
      description: newRecord.description.trim(),
      date: newRecord.date,
      userId: currentUser?.id,
      userName: currentUser?.name
    });
    setAddingFor(null);
    setNewRecord({ type: 'positive', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const totalPositive = useMemo(() => {
    if (!selectedClass) return 0;
    return behavior.filter(r => r.type === 'positive' && filteredStudents.some(s => s.id === r.studentId)).length;
  }, [behavior, selectedClass, filteredStudents]);

  const totalNegative = useMemo(() => {
    if (!selectedClass) return 0;
    return behavior.filter(r => r.type === 'negative' && filteredStudents.some(s => s.id === r.studentId)).length;
  }, [behavior, selectedClass, filteredStudents]);

  return (
    <div className="animate-fade-in">
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%',
          width: '300px', height: '300px',
          background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '56px', background: 'rgba(255,255,255,0.2)',
            borderRadius: '14px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', backdropFilter: 'blur(10px)'
          }}>
            <ThumbsUp size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Registro de Conducta</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Anota comportamientos positivos y negativos por estudiante</p>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'
        }}>
          {availableClasses.map(c => (
            <button key={c.id} onClick={() => setSelectedClass(c.name)} style={{
              padding: '1.25rem', borderRadius: '16px', border: '2px solid #e2e8f0',
              background: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
              transition: 'all 0.2s', color: '#1e293b'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><Users size={24} /></div>
              {c.name}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
            marginBottom: '1.5rem', padding: '1rem', background: 'white',
            borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <button onClick={() => setSelectedClass('')} style={{
              background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem',
              borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              color: '#64748b'
            }}>← Cambiar sección</button>

            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'center',
              padding: '0.35rem 0.75rem', background: '#f1f5f9', borderRadius: '10px', flex: 1, maxWidth: '250px'
            }}>
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Buscar estudiante..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={16} color="#94a3b8" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white' }}>
                <option value="all">Todas</option>
                <option value="positive">Solo positivas</option>
                <option value="negative">Solo negativas</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 600 }}>
                <ThumbsUp size={16} /> {totalPositive} positivas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626', fontWeight: 600 }}>
                <ThumbsDown size={16} /> {totalNegative} negativas
              </span>
            </div>
          </div>

          {filteredStudents.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => {
            const records = (studentBehavior[student.id] || []).filter(r => filterType === 'all' || r.type === filterType);
            return (
              <div key={student.id} style={{
                background: 'white', borderRadius: '16px', marginBottom: '1rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
                  background: '#fafbfc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '1rem'
                    }}>{student.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {records.filter(r => r.type === 'positive').length} positivas · {records.filter(r => r.type === 'negative').length} negativas
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setAddingFor(student.id); setNewRecord({ type: 'positive', description: '', date: new Date().toISOString().split('T')[0] }); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                  }}><Plus size={16} /> Agregar</button>
                </div>

                {addingFor === student.id && (
                  <div style={{
                    padding: '1rem 1.25rem', background: '#fefce8',
                    borderBottom: '1px solid #fde68a'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setNewRecord(prev => ({ ...prev, type: 'positive' }))} style={{
                          flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                          fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                          background: newRecord.type === 'positive' ? '#16a34a' : '#e2e8f0',
                          color: newRecord.type === 'positive' ? 'white' : '#64748b'
                        }}><ThumbsUp size={14} style={{ marginRight: '0.35rem' }} /> Positivo</button>
                        <button onClick={() => setNewRecord(prev => ({ ...prev, type: 'negative' }))} style={{
                          flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                          fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                          background: newRecord.type === 'negative' ? '#dc2626' : '#e2e8f0',
                          color: newRecord.type === 'negative' ? 'white' : '#64748b'
                        }}><ThumbsDown size={14} style={{ marginRight: '0.35rem' }} /> Negativo</button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="date" value={newRecord.date}
                          onChange={e => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                        <input type="text" placeholder="Describe el comportamiento..." value={newRecord.description}
                          onChange={e => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                          style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAdd(student.id); }} />
                        <button onClick={() => handleAdd(student.id)} disabled={!newRecord.description.trim()} style={{
                          padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                          background: !newRecord.description.trim() ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: !newRecord.description.trim() ? 'not-allowed' : 'pointer'
                        }}>Guardar</button>
                        <button onClick={() => setAddingFor(null)} style={{
                          padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                          background: 'white', color: '#64748b', cursor: 'pointer'
                        }}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {records.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Sin registros de conducta
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {records.map(r => (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 1.25rem', borderBottom: '1px solid #f8fafc'
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: r.type === 'positive' ? '#dcfce7' : '#fee2e2'
                        }}>
                          {r.type === 'positive' ? <ThumbsUp size={16} color="#16a34a" /> : <ThumbsDown size={16} color="#dc2626" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>{r.description}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={12} />
                            {new Date(r.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {r.userName && <span>· {r.userName}</span>}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm('¿Eliminar este registro?')) deleteBehaviorRecord(r.id); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                          color: '#94a3b8', flexShrink: 0
                        }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}