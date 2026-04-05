import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserCog, Trash2, Edit2, UserPlus, X, Save, Shield, User, BookOpen, Plus } from 'lucide-react';

export default function Users() {
  const { users, currentUser, updateUser, deleteUser, register, classes, subjects } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForAssignment, setUserForAssignment] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'teacher'
  });
  
  // Assignment state - uses local temp list to allow multi-add before saving
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
      const success = register(formData.name, formData.username, formData.password);
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
      <header className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra las cuentas de acceso al sistema</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </header>

      <div className="table-container shadow-glass">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: user.username === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: user.username === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}>
                      {user.username === 'admin' ? <Shield size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      {user.id === currentUser.id && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', fontWeight: 600 }}> (Tú)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-primary)' }}>
                    {user.username}
                  </code>
                </td>
                <td>
                  <span style={{ 
                    fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px',
                    background: user.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: user.role === 'admin' ? 'var(--success-color)' : 'var(--text-secondary)',
                    fontWeight: 600, border: '1px solid currentColor'
                  }}>
                    {user.role === 'admin' ? 'Administrador' : 'Docente'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleOpenAssignmentModal(user)}
                      style={{ padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)', transition: 'all 0.2s', background: 'rgba(59, 130, 246, 0.1)' }}
                      className="nav-item-hover"
                      title="Asignar Grados y Materias"
                    >
                      <BookOpen size={18} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(user)}
                      style={{ padding: '8px', borderRadius: '8px', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                      className="nav-item-hover"
                      title="Editar usuario"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      style={{ 
                        padding: '8px', borderRadius: '8px', 
                        color: user.id === currentUser.id ? 'rgba(255,255,255,0.1)' : 'var(--danger-color)',
                        cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer'
                      }}
                      disabled={user.id === currentUser.id}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Edit/Create Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nombre Completo</label>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Usuario</label>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rol</label>
                  <select 
                    className="input-field" 
                    value={formData.role || 'teacher'}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="admin">Administrador</option>
                    <option value="teacher">Docente</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contraseña</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="nav-item" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Save size={18} /> {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Asignar Materias y Grados</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Docente: {userForAssignment.name}</p>
              </div>
              <button onClick={() => setIsAssignmentModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Nueva Asignación</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Grado/Sección</label>
                  <select 
                    className="input-field"
                    value={newAssignment.classId}
                    onChange={e => setNewAssignment({ ...newAssignment, classId: e.target.value })}
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
                  >
                    <option value="">Seleccionar...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button type="button" className="btn-primary" onClick={handleAddAssignment} style={{ padding: '0.75rem' }}>
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Asignaciones Actuales</h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tempAssignments.length > 0 ? (
                  tempAssignments.map((asg, idx) => {
                    const classObj = classes.find(c => c.id === asg.classId);
                    const subjectObj = subjects.find(s => s.id === asg.subjectId);
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{subjectObj?.name || 'Materia Desconocida'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{classObj?.name || 'Grado Desconocido'}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveAssignment(idx)} style={{ color: 'var(--danger-color)', padding: '5px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Añade asignaciones usando el formulario de arriba.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setIsAssignmentModalOpen(false)} className="nav-item" style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveAssignments} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} /> Guardar Cambios ({tempAssignments.length} asignaciones)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
