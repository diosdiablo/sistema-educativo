import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Lock, Mail, ArrowRight, RefreshCw, Eye, EyeOff, School } from 'lucide-react';
import Logo from '../assets/logo.png';

export default function Login() {
  const { login, register, users, setUsers, setCurrentUser } = useStore();
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: '300px', height: '300px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
        borderRadius: '50%', filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: '250px', height: '250px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
        borderRadius: '50%', filter: 'blur(60px)'
      }} />

      <div style={{
        maxWidth: '440px', width: '100%',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}>
            <img src={Logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            color: '#1e293b',
            marginBottom: '0.25rem',
            letterSpacing: '-0.025em'
          }}>
            Portal Agro 110
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {isLoginView ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.875rem 1rem', marginBottom: '1.5rem',
            background: '#fef2f2', color: '#dc2626',
            borderRadius: '12px', fontSize: '0.875rem',
            border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Lock size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!isLoginView && (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                  borderRadius: '12px', border: '1px solid #e2e8f0',
                  fontSize: '0.95rem', outline: 'none',
                  transition: 'all 0.2s',
                  background: '#f8fafc'
                }}
              />
              <School style={{ 
                position: 'absolute', left: '0.875rem', top: '50%', 
                transform: 'translateY(-50%)', color: '#94a3b8' 
              }} size={18} />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '12px', border: '1px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: '#f8fafc'
              }}
            />
            <Mail style={{ 
              position: 'absolute', left: '0.875rem', top: '50%', 
              transform: 'translateY(-50%)', color: '#94a3b8' 
            }} size={18} />
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '12px', border: '1px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: '#f8fafc'
              }}
            />
            <Lock style={{ 
              position: 'absolute', left: '0.875rem', top: '50%', 
              transform: 'translateY(-50%)', color: '#94a3b8' 
            }} size={18} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#94a3b8',
                padding: '0.25rem'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isLoginView && (
            <button
              type="button"
              style={{
                background: 'none', border: 'none',
                color: '#f59e0b', fontSize: '0.85rem',
                fontWeight: 600, cursor: 'pointer',
                alignSelf: 'flex-end', marginTop: '-0.5rem'
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button 
            type="submit" 
            style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '0.5rem', width: '100%', padding: '0.875rem',
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {isLoginView ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </p>
          <button 
            type="button" 
            onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
            style={{
              background: 'none', border: 'none', color: '#f59e0b',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              marginTop: '0.25rem'
            }}
          >
            {isLoginView ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>

        {users.length === 0 && (
          <div style={{ 
            marginTop: '1.5rem', paddingTop: '1.5rem', 
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <button 
              type="button" 
              onClick={handleResetUsers}
              style={{
                background: 'none', border: 'none', color: '#94a3b8',
                fontWeight: 500, cursor: 'pointer', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                margin: '0 auto', padding: '0.5rem'
              }}
            >
              <RefreshCw size={14} /> Crear usuario admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}