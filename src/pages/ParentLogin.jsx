import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../assets/logo.png';

export default function ParentLogin() {
  const navigate = useNavigate();
  const { students, recordParentLogin } = useStore();
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleanDni = dni.trim();
    if (!cleanDni) { setError('Ingresa tu DNI'); return; }
    const hijos = students.filter(s => s.guardianDni === cleanDni || s.guardian_dni === cleanDni);
    if (hijos.length === 0) { setError('No se encontraron hijos con ese DNI'); return; }
    sessionStorage.setItem('edu_parent_dni', cleanDni);
    recordParentLogin(cleanDni);
    navigate('/parent/dashboard');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      background: 'var(--bg-color)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem', overflow: 'hidden'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-color-surface)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-color)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', padding: '0.75rem',
            borderRadius: '18px',
            background: 'var(--surface-muted)',
            marginBottom: '1rem'
          }}>
            <img src={Logo} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Portal para Padres
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ingresa tu DNI para consultar notas y asistencia de tus hijos
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', background: 'var(--danger-tint-bg)', color: 'var(--danger-tint-fg)',
            borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text" inputMode="numeric"
              placeholder="DNI del apoderado"
              value={dni} maxLength={8}
              onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '12px', border: '1px solid var(--border-color)',
                fontSize: '0.95rem', outline: 'none',
                background: 'var(--surface-muted)',
                color: 'var(--text-primary)', boxSizing: 'border-box'
              }}
            />
            <Users style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-secondary)'
            }} size={18} />
          </div>

          <button type="submit" className="btn-primary" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '0.5rem', width: '100%', padding: '0.775rem',
            marginTop: '0.5rem',
            borderRadius: '24px',
            fontSize: '0.95rem'
          }}>
            Consultar
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '0.85rem', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ← Acceso para docentes
          </button>
        </div>
      </div>
    </div>
  );
}
