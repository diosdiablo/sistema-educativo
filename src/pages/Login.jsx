import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { GraduationCap, User, Lock, Mail, ArrowRight, UserPlus, RefreshCw } from 'lucide-react';
import Logo from '../assets/logo.png';

export default function Login() {
  const { login, register, users, setUsers, setCurrentUser } = useStore();
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLoginView) {
      const success = login(username, password);
      if (!success) {
        setError('Usuario o contraseña incorrectos.');
      }
    } else {
      if (!name || !username || !password) {
        setError('Por favor, completa todos los campos.');
        return;
      }
      const success = register(name, username, password);
      if (!success) {
        setError('Este nombre de usuario ya está registrado.');
      }
    }
  };

  const handleResetUsers = () => {
    if (window.confirm('¿Crear usuario admin por defecto?\nUsuario: admin\nContraseña: admin123')) {
      const adminUser = { id: '1', name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', assignments: [] };
      setUsers([adminUser]);
      setCurrentUser(adminUser);
    }
  };

  return (
    <div className="login-container animate-fade-in" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', width: '100vw', background: 'var(--bg-color-main)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999
    }}>
      <div className="card login-card" style={{
        maxWidth: '420px', width: '90%', padding: '2.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: '#ffffff', border: '1px solid var(--border-color)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', padding: '1rem', borderRadius: '50%',
            background: '#ffffff', marginBottom: '1rem',
            border: '2px solid var(--sidebar-bg)'
          }}>
            <img src={Logo} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sidebar-bg)', marginBottom: '0.5rem' }}>
            Portal Agro 110
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isLoginView ? 'Inicia sesión para continuar' : 'Crea una cuenta para administrar'}
          </p>
        </div>

        {error && (
          <div style={{
            width: '100%', padding: '0.75rem', marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
            borderLeft: '4px solid #ef4444', borderRadius: '4px', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {!isLoginView && (
            <div className="input-group" style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Nombre Completo" 
                style={{ width: '100%', paddingLeft: '3rem' }}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group" style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Nombre de Usuario" 
              style={{ width: '100%', paddingLeft: '3rem' }}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Contraseña" 
              style={{ width: '100%', paddingLeft: '3rem' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
            {isLoginView ? 'Ingresar' : 'Registrarse'} 
            {isLoginView ? <ArrowRight size={20} /> : <UserPlus size={20} />}
          </button>
        </form>

        {users.length === 0 && (
          <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            </p>
            <button 
              type="button" 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              style={{ 
                background: 'none', border: 'none', color: 'var(--accent-primary)', 
                fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.875rem' 
              }}
            >
              {isLoginView ? 'Crear una cuenta nueva' : 'Iniciar sesión aquí'}
            </button>
            <div style={{ marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={handleResetUsers}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-secondary)', 
                  fontWeight: 500, cursor: 'pointer', fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  margin: '0 auto'
                }}
              >
                <RefreshCw size={12} /> Crear usuario admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
