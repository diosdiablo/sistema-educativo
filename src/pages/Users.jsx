import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserCog, Trash2, Edit2, UserPlus, X, Save, Shield, User, BookOpen, Plus, LayoutGrid, Users as UsersIcon } from 'lucide-react';

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

  const gradientColors = [
    ['#667eea', '#764ba2'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777']
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
              <UserCog size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Gestión de Usuarios</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Administra las cuentas de acceso al sistema</p>
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
            onClick={() => handleOpenModal()}
          >
            <UserPlus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabla moderna */}
      <div className="table-container" style={{ overflowX: 'auto', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <table className="styled-table" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ 
                minWidth: '200px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} />
                  Nombre
                </div>
              </th>
              <th style={{ 
                minWidth: '150px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} />
                  Usuario
                </div>
              </th>
              <th style={{ 
                minWidth: '130px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutGrid size={16} />
                  Rol
                </div>
              </th>
              <th style={{ 
                minWidth: '160px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <UsersIcon size={16} />
                  Acciones
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => {
              const [color1, color2] = gradientColors[idx % gradientColors.length];
              const isAdmin = user.role === 'admin' || user.username === 'admin';
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: isAdmin ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${color1}, ${color2})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {isAdmin ? <Shield size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        {user.id === currentUser.id && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}> (Tú)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ 
                      background: `linear-gradient(135deg, ${color1}15, ${color2}15)`, 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      color: color1,
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {user.username}
                    </code>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '6px 12px', borderRadius: '20px',
                      background: isAdmin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isAdmin ? '#10b981' : '#f59e0b',
                      fontWeight: 700,
                      border: `1px solid ${isAdmin ? '#10b98140' : '#f59e0b40'}`
                    }}>
                      {isAdmin ? 'Administrador' : 'Docente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenAssignmentModal(user)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Asignar Grados y Materias"
                      >
                        <BookOpen size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#8b5cf6',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Editar usuario"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: user.id === currentUser.id ? 'rgba(100,100,100,0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: user.id === currentUser.id ? '1px solid rgba(100,100,100,0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          color: user.id === currentUser.id ? '#999' : '#ef4444',
                          cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { if (user.id !== currentUser.id) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                        onMouseLeave={(e) => { if (user.id !== currentUser.id) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                        disabled={user.id === currentUser.id}
                        title="Eliminar usuario"
                      >
                        <Trash2 size={18} />
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
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={24} color="white" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', fontSize: '0.875rem', border: '1px solid #ef444440' }}>
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
                    background: '#f1f5f9', color: 'var(--text-secondary)',
                    border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                  }} 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" 
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
                    border: 'none', borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', fontWeight: 600
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
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #3b82f620, #2563eb20)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={20} color="white" />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Asignar Materias</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Docente: <strong>{userForAssignment.name}</strong></p>
              </div>
              <button onClick={() => setIsAssignmentModalOpen(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
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
                  style={{ 
                    padding: '0.65rem', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                    border: 'none', color: 'white', cursor: 'pointer',
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
                    const [color1, color2] = gradientColors[idx % gradientColors.length];
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: `linear-gradient(135deg, ${color1}, ${color2})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <BookOpen size={16} color="white" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{subjectObj?.name || 'Materia Desconocida'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{classObj?.name || 'Grado Desconocido'}</div>
                          </div>
                        </div>
                        <button type="button" 
                          onClick={() => handleRemoveAssignment(idx)} 
                          style={{ 
                            color: '#ef4444', padding: '6px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px', cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
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
                  background: '#f1f5f9', color: 'var(--text-secondary)',
                  border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={handleSaveAssignments} 
                style={{ 
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                  border: 'none', borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', fontWeight: 600
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