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
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '15%', right: '8%',
        width: '200px', height: '200px',
        border: '2px solid rgba(147,51,234,0.1)',
        transform: 'rotate(45deg)',
        borderRadius: '24px'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '6%',
        width: '150px', height: '150px',
        border: '2px solid rgba(236,72,153,0.08)',
        transform: 'rotate(15deg)',
        borderRadius: '12px'
      }} />
      <div style={{
        position: 'absolute', top: '25%', left: '12%',
        width: '80px', height: '80px',
        border: '2px solid rgba(99,102,241,0.1)',
        transform: 'rotate(60deg)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
      }} />
      <div style={{
        position: 'absolute', bottom: '30%', right: '15%',
        width: '60px', height: '60px',
        border: '2px solid rgba(16,185,129,0.08)',
        transform: 'rotate(30deg)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
      }} />
      <div style={{
        position: 'absolute', top: '8%', right: '25%',
        width: '40px', height: '40px',
        background: 'rgba(147,51,234,0.08)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '12%', left: '20%',
        width: '30px', height: '30px',
        background: 'rgba(236,72,153,0.06)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '45%', left: '3%',
        width: '4px', height: '100px',
        background: 'linear-gradient(to bottom, rgba(147,51,234,0.2), transparent)',
        borderRadius: '2px'
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '4%',
        width: '3px', height: '70px',
        background: 'linear-gradient(to bottom, transparent, rgba(236,72,153,0.2))',
        borderRadius: '2px'
      }} />

      <div style={{
        maxWidth: '440px', width: '100%',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: '2.75rem 2.5rem',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            display: 'inline-flex', padding: '1rem', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(99,102,241,0.2))',
            marginBottom: '1.25rem',
            border: '1px solid rgba(147,51,234,0.15)',
            boxShadow: '0 8px 32px rgba(147,51,234,0.15)'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #9333ea, #6366f1, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src={Logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(10)' }} />
            </div>
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, color: '#ffffff',
            marginBottom: '0.35rem', letterSpacing: '-0.025em'
          }}>
            Portal Agro 110
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Inicia sesión para continuar
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.875rem 1rem', marginBottom: '1.5rem',
            background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
            borderRadius: '12px', fontSize: '0.875rem',
            border: '1px solid rgba(239,68,68,0.2)',
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
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(147,51,234,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,51,234,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.25s ease',
                background: 'rgba(255,255,255,0.03)',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            <Mail style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)'
            }} size={18} />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(147,51,234,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,51,234,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.25s ease',
                background: 'rgba(255,255,255,0.03)',
                color: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            <Lock style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)'
            }} size={18} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
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
              background: loading ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #9333ea, #6366f1, #ec4899)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 32px rgba(147,51,234,0.3)',
              transition: 'all 0.25s ease',
              backgroundSize: '200% 200%',
              animation: loading ? 'none' : 'gradientShift 3s ease infinite',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(147,51,234,0.4)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(147,51,234,0.3)'; } }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button onClick={() => navigate('/parent')} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            transition: 'color 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <Users size={14} /> Acceso para padres de familia
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}