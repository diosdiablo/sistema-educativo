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
        background: 'var(--bg-color-surface)',
        borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Registro de Conducta</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Anota comportamientos positivos y negativos por estudiante</p>
        </div>
      </div>

      {!selectedClass ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem'
        }}>
          {availableClasses.map(c => {
            const classStudents = students.filter(s => (s.gradeLevel || '').trim().toLowerCase() === c.name.trim().toLowerCase() || s.classId === c.id).length;
            return (
              <button key={c.id} onClick={() => setSelectedClass(c.name)} style={{
                padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)',
                background: 'var(--bg-color-surface)', cursor: 'pointer',
                transition: 'box-shadow 0.2s, border-color 0.2s', color: 'var(--text-primary)',
                textAlign: 'left'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', marginBottom: '0.75rem',
                  background: 'var(--nav-active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={20} color="var(--nav-active-fg)" />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {classStudents} estudiante{classStudents !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
            marginBottom: '1.5rem', padding: '0.9rem 1.25rem', background: 'var(--bg-color-surface)',
            borderRadius: '12px', border: '1px solid var(--border-color)'
          }}>
            <button onClick={() => setSelectedClass('')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-color-surface)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem',
              borderRadius: '20px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}>← Cambiar sección</button>

            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'center',
              padding: '0.45rem 0.9rem', background: 'var(--surface-muted)', borderRadius: '20px', flex: 1, maxWidth: '250px',
              border: '1px solid var(--border-color)'
            }}>
              <Search size={16} color="var(--text-secondary)" />
              <input type="text" placeholder="Buscar estudiante..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-color-surface)', color: 'var(--text-primary)' }}>
                <option value="all">Todas</option>
                <option value="positive">Solo positivas</option>
                <option value="negative">Solo negativas</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#188038', fontWeight: 600, fontSize: '0.82rem', background: '#18803815', padding: '0.35rem 0.8rem', borderRadius: '16px' }}>
                <ThumbsUp size={15} /> {totalPositive} positivas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger-color)', fontWeight: 600, fontSize: '0.82rem', background: 'var(--danger-tint-bg)', padding: '0.35rem 0.8rem', borderRadius: '16px' }}>
                <ThumbsDown size={15} /> {totalNegative} negativas
              </span>
            </div>
          </div>

          {filteredStudents.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => {
            const records = (studentBehavior[student.id] || []).filter(r => filterType === 'all' || r.type === filterType);
            return (
              <div key={student.id} style={{
                background: 'var(--bg-color-surface)', borderRadius: '12px', marginBottom: '1rem',
                border: '1px solid var(--border-color)', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                  background: 'var(--surface-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'var(--nav-active-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--nav-active-fg)', fontWeight: 500, fontSize: '1rem'
                    }}>{student.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {records.filter(r => r.type === 'positive').length} positivas · {records.filter(r => r.type === 'negative').length} negativas
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setAddingFor(student.id); setNewRecord({ type: 'positive', description: '', date: new Date().toISOString().split('T')[0] }); }} className="btn-primary" style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.45rem 1rem', borderRadius: '20px', fontSize: '0.82rem'
                  }}><Plus size={15} /> Agregar</button>
                </div>

                {addingFor === student.id && (
                  <div style={{
                    padding: '1rem 1.25rem', background: 'var(--surface-muted)',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setNewRecord(prev => ({ ...prev, type: 'positive' }))} style={{
                          flex: 1, padding: '0.5rem', borderRadius: '20px',
                          fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
                          border: newRecord.type === 'positive' ? '1px solid #188038' : '1px solid var(--border-color)',
                          background: newRecord.type === 'positive' ? '#18803815' : 'var(--bg-color-surface)',
                          color: newRecord.type === 'positive' ? '#188038' : 'var(--text-secondary)'
                        }}><ThumbsUp size={14} style={{ marginRight: '0.35rem' }} /> Positivo</button>
                        <button onClick={() => setNewRecord(prev => ({ ...prev, type: 'negative' }))} style={{
                          flex: 1, padding: '0.5rem', borderRadius: '20px',
                          fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
                          border: newRecord.type === 'negative' ? '1px solid #d93025' : '1px solid var(--border-color)',
                          background: newRecord.type === 'negative' ? 'var(--danger-tint-bg)' : 'var(--bg-color-surface)',
                          color: newRecord.type === 'negative' ? 'var(--danger-tint-fg)' : 'var(--text-secondary)'
                        }}><ThumbsDown size={14} style={{ marginRight: '0.35rem' }} /> Negativo</button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="date" value={newRecord.date}
                          onChange={e => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                          style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-color-surface)', color: 'var(--text-primary)' }} />
                        <input type="text" placeholder="Describe el comportamiento..." value={newRecord.description}
                          onChange={e => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                          className="input-field"
                          style={{ flex: 1 }}
                          onKeyDown={e => { if (e.key === 'Enter') handleAdd(student.id); }} />
                        <button onClick={() => handleAdd(student.id)} disabled={!newRecord.description.trim()} className="btn-primary" style={{
                          padding: '0.5rem 1.15rem', borderRadius: '20px', fontSize: '0.85rem'
                        }}>Guardar</button>
                        <button onClick={() => setAddingFor(null)} style={{
                          padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)',
                          background: 'var(--bg-color-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                        }}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {records.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Sin registros de conducta
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {records.map(r => (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 1.25rem', borderBottom: '1px solid var(--border-color)'
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: r.type === 'positive' ? '#18803815' : 'var(--danger-tint-bg)'
                        }}>
                          {r.type === 'positive' ? <ThumbsUp size={15} color="#188038" /> : <ThumbsDown size={15} color="var(--danger-tint-fg)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={12} />
                            {new Date(r.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {r.userName && <span>· {r.userName}</span>}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm('¿Eliminar este registro?')) deleteBehaviorRecord(r.id); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem',
                          color: 'var(--text-secondary)', flexShrink: 0
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