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
      background: '#f0fdfa',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '-8%', right: '-4%',
        width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '12%', left: '6%',
        width: '180px', height: '180px',
        border: '2px solid rgba(13,148,136,0.08)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '18%', right: '8%',
        width: '120px', height: '120px',
        border: '2px solid rgba(234,179,8,0.08)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '35%', right: '12%',
        width: '60px', height: '60px',
        background: 'rgba(13,148,136,0.06)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '35%', left: '10%',
        width: '40px', height: '40px',
        background: 'rgba(234,179,8,0.06)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '22%', right: '20%',
        width: '20px', height: '20px',
        border: '2px solid rgba(13,148,136,0.1)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '25%', left: '22%',
        width: '16px', height: '16px',
        border: '2px solid rgba(234,179,8,0.1)',
        borderRadius: '50%'
      }} />

      <div style={{
        maxWidth: '420px', width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 60px rgba(13,148,136,0.08), 0 8px 20px rgba(0,0,0,0.04)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', padding: '0.75rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(234,179,8,0.08))',
            marginBottom: '1rem'
          }}>
            <img src={Logo} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <h1 style={{
            fontSize: '1.65rem', fontWeight: 800,
            color: '#134e4a',
            marginBottom: '0.25rem',
            letterSpacing: '-0.025em'
          }}>
            Portal Agro 110
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Inicia sesión para continuar
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
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '14px', border: '1.5px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: '#f8fafc',
                color: '#1e293b',
                boxSizing: 'border-box'
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
              onFocus={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '14px', border: '1.5px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s',
                background: '#f8fafc',
                color: '#1e293b',
                boxSizing: 'border-box'
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

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '0.5rem', width: '100%', padding: '0.875rem',
              marginTop: '0.5rem',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(13,148,136,0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,148,136,0.35)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.25)'; } }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button onClick={() => navigate('/parent')} style={{
            background: 'none', border: 'none', color: '#94a3b8',
            fontSize: '0.85rem', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            transition: 'color 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0d9488'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Users size={14} /> Acceso para padres de familia
          </button>
        </div>
      </div>
    </div>
  );
}