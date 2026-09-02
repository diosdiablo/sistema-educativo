import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Users } from 'lucide-react';
import Logo from '../assets/logo.png';

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (!success) {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      background: 'var(--surface-muted)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem', overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '420px', width: '100%',
        background: 'var(--bg-color-surface)',
        borderRadius: '16px',
        padding: '2.5rem',
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={Logo} alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '1rem' }} />
          <h1 style={{
            fontSize: '1.65rem', fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
            letterSpacing: '-0.02em'
          }}>
            Portal Agro 110
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inicia sesión para continuar
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.875rem 1rem', marginBottom: '1.5rem',
            background: 'var(--danger-tint-bg)', color: 'var(--danger-tint-fg)',
            borderRadius: '12px', fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Lock size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '8px', border: '1px solid var(--border-color)',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-color-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
            <Mail style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)'
            }} size={18} />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '8px', border: '1px solid var(--border-color)',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-color-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
            <Lock style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)'
            }} size={18} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-secondary)',
                padding: '0.25rem'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '0.5rem', width: '100%', padding: '0.875rem',
              marginTop: '0.5rem',
              background: loading ? 'var(--hover-bg)' : 'var(--accent-primary)',
              color: loading ? 'var(--text-secondary)' : 'white', border: 'none', borderRadius: '20px',
              fontWeight: 500, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button onClick={() => navigate('/parent')} style={{
            background: 'none', border: 'none', color: 'var(--accent-primary)',
            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
          }}>
            <Users size={14} /> Acceso para padres de familia
          </button>
        </div>
      </div>
    </div>
  );
}