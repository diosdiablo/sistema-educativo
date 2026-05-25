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
        position: 'absolute', top: '25%', right: '22%',
        width: '20px', height: '20px',
        border: '2px solid rgba(13,148,136,0.1)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '28%', left: '20%',
        width: '16px', height: '16px',
        border: '2px solid rgba(234,179,8,0.1)',
        borderRadius: '50%'
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 60px rgba(13,148,136,0.08), 0 8px 20px rgba(0,0,0,0.04)',
        position: 'relative', zIndex: 1
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#134e4a', margin: 0 }}>
            Portal para Padres
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ingresa tu DNI para consultar notas y asistencia de tus hijos
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626',
            borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem',
            border: '1px solid #fecaca'
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
              onFocus={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '14px', border: '1.5px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s', background: '#f8fafc',
                color: '#1e293b', boxSizing: 'border-box'
              }}
            />
            <Users style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', color: '#94a3b8'
            }} size={18} />
          </div>

          <button type="submit" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '0.5rem', width: '100%', padding: '0.875rem',
            marginTop: '0.5rem',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: 'white', border: 'none', borderRadius: '14px',
            fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(13,148,136,0.25)',
            transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,148,136,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.25)'; }}
          >
            Consultar
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: '#94a3b8',
            fontSize: '0.85rem', cursor: 'pointer',
            transition: 'color 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0d9488'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            ← Acceso para docentes
          </button>
        </div>
      </div>
    </div>
  );
}