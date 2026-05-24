import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../assets/logo.png';

export default function ParentLogin() {
  const navigate = useNavigate();
  const { students } = useStore();
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
    navigate('/parent/dashboard');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: '300px', height: '300px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
        borderRadius: '50%', filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: '250px', height: '250px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
        borderRadius: '50%', filter: 'blur(80px)'
      }} />
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '24px', padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={Logo} alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065f46', margin: 0 }}>Portal para Padres</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ingresa tu DNI para consultar notas y asistencia de tus hijos
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626',
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
              style={{
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                borderRadius: '12px', border: '1px solid #e2e8f0',
                fontSize: '0.95rem', outline: 'none',
                transition: 'all 0.2s', background: '#f8fafc'
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
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontWeight: 600, fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s'
          }}>
            Consultar
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline'
          }}>
            ← Acceso para docentes
          </button>
        </div>
      </div>
    </div>
  );
}