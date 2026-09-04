import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, Edit2, UserPlus, X, Save, Shield, User, BookOpen, Plus, LayoutGrid } from 'lucide-react';

export default function Users() {
  const { users, currentUser, updateUser, deleteUser, register, classes, subjects } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForAssignment, setUserForAssignment] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'teacher'
  });
  
  const [tempAssignments, setTempAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ classId: '', subjectId: '' });
  const [error, setError] = useState('');

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role || (user.username === 'admin' ? 'admin' : 'teacher')
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', role: 'teacher' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenAssignmentModal = (user) => {
    setUserForAssignment(user);
    setTempAssignments(user.assignments ? [...user.assignments] : []);
    setNewAssignment({ classId: '', subjectId: '' });
    setIsAssignmentModalOpen(true);
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newAssignment.classId || !newAssignment.subjectId) {
      alert('Por favor selecciona un grado y una materia.');
      return;
    }
    const exists = tempAssignments.some(
      a => a.classId === newAssignment.classId && a.subjectId === newAssignment.subjectId
    );
    if (exists) {
      alert('Esta asignación ya existe.');
      return;
    }
    setTempAssignments(prev => [...prev, { ...newAssignment }]);
    setNewAssignment({ classId: '', subjectId: '' });
  };

  const handleRemoveAssignment = (index) => {
    setTempAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAssignments = () => {
    updateUser(userForAssignment.id, { assignments: tempAssignments });
    setIsAssignmentModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.username || !formData.password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      const success = register(formData.name, formData.username, formData.password, formData.role);
      if (!success) {
        setError('El nombre de usuario ya existe.');
        return;
      }
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario mientras estás conectado.');
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      deleteUser(id);
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Gestión de Usuarios</h2>
          <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Administra las cuentas de acceso al sistema · {users.length} usuarios</p>
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
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="styled-table" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} />
                  Nombre
                </div>
              </th>
              <th style={{ minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} />
                  Usuario
                </div>
              </th>
              <th style={{ minWidth: '130px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutGrid size={16} />
                  Rol
                </div>
              </th>
              <th style={{ minWidth: '160px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isAdmin = user.role === 'admin' || user.username === 'admin';
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '38px', height: '38px', borderRadius: '50%', 
                        background: isAdmin ? '#18803815' : 'var(--nav-active-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isAdmin ? '#188038' : 'var(--nav-active-fg)'
                      }}>
                        {isAdmin ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
                        {user.id === currentUser.id && (
                          <span style={{ fontSize: '0.7rem', color: '#188038', fontWeight: 600 }}> (Tú)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ 
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}>
                      {user.username}
                    </code>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '5px 12px', borderRadius: '20px',
                      background: isAdmin ? '#18803815' : (user.role === 'assistant' ? '#0d948815' : '#e3740015'),
                      color: isAdmin ? '#188038' : (user.role === 'assistant' ? '#0d9488' : '#e37400'),
                      fontWeight: 500
                    }}>
                      {isAdmin ? 'Administrador' : (user.role === 'assistant' ? 'Auxiliar' : 'Docente')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenAssignmentModal(user)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'var(--nav-active-bg)',
                          border: '1px solid transparent',
                          color: 'var(--nav-active-fg)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--nav-active-bg)'; e.currentTarget.style.color = 'var(--nav-active-fg)'; }}
                        title="Asignar Grados y Materias"
                      >
                        <BookOpen size={17} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'var(--surface-muted)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        title="Editar usuario"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: user.id === currentUser.id ? 'var(--surface-muted)' : 'var(--danger-tint-bg)',
                          border: '1px solid transparent',
                          color: user.id === currentUser.id ? 'var(--text-secondary)' : 'var(--danger-tint-fg)',
                          cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                          opacity: user.id === currentUser.id ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { if (user.id !== currentUser.id) { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; } }}
                        onMouseLeave={(e) => { if (user.id !== currentUser.id) { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; } }}
                        disabled={user.id === currentUser.id}
                        title="Eliminar usuario"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Edit/Create Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ 
            width: '100%', maxWidth: '480px', 
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--nav-active-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={24} color="var(--nav-active-fg)" />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)' }}>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'var(--danger-tint-bg)', color: 'var(--danger-tint-fg)', borderRadius: '10px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre Completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Usuario</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej. jperez"
                    disabled={editingUser && editingUser.username === 'admin'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rol</label>
                  <select 
                    className="input-field" 
                    value={formData.role || 'teacher'}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="admin">Administrador</option>
                    <option value="teacher">Docente</option>
                    <option value="assistant">Auxiliar de Educación</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Contraseña</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" 
                  style={{ 
                    flex: 1, padding: '0.75rem', borderRadius: '12px', 
                    background: 'var(--surface-muted)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
                  }} 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" 
                  className="btn-primary"
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '0.75rem', borderRadius: '12px'
                  }}
                >
                  <Save size={18} /> {editingUser ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && userForAssignment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ 
            width: '100%', maxWidth: '550px', 
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--nav-active-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={20} color="var(--nav-active-fg)" />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)' }}>Asignar Materias</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Docente: <strong>{userForAssignment.name}</strong></p>
              </div>
              <button onClick={() => setIsAssignmentModalOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--surface-muted)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nueva Asignación</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Grado/Sección</label>
                  <select 
                    className="input-field"
                    value={newAssignment.classId}
                    onChange={e => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Materia</label>
                  <select 
                    className="input-field"
                    value={newAssignment.subjectId}
                    onChange={e => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button type="button" 
                  className="btn-primary"
                  style={{ 
                    padding: '0.65rem', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onClick={handleAddAssignment}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Asignaciones Actuales ({tempAssignments.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tempAssignments.length > 0 ? (
                  tempAssignments.map((asg, idx) => {
                    const classObj = classes.find(c => c.id === asg.classId);
                    const subjectObj = subjects.find(s => s.id === asg.subjectId);
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: 'var(--surface-muted)', borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--nav-active-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <BookOpen size={16} color="var(--nav-active-fg)" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{subjectObj?.name || 'Materia Desconocida'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{classObj?.name || 'Grado Desconocido'}</div>
                          </div>
                        </div>
                        <button type="button" 
                          onClick={() => handleRemoveAssignment(idx)} 
                          style={{ 
                            color: 'var(--danger-tint-fg)', padding: '6px',
                            background: 'var(--danger-tint-bg)', border: 'none',
                            borderRadius: '8px', cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--surface-muted)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    Añade asignaciones usando el formulario de arriba.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button type="button" 
                onClick={() => setIsAssignmentModalOpen(false)} 
                style={{ 
                  flex: 1, padding: '0.75rem', borderRadius: '12px', 
                  background: 'var(--surface-muted)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={handleSaveAssignments} 
                className="btn-primary"
                style={{ 
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '0.75rem', borderRadius: '12px'
                }}
              >
                <Save size={18} /> Guardar ({tempAssignments.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}