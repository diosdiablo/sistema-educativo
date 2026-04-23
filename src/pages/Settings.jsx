import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Settings as SettingsIcon, Save, Calendar, Clock, AlertCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default function Settings() {
  const { 
      periodDates, updatePeriodDates, isAdmin,
      users, students, attendance, grades, classes, subjects,
      instruments, instrumentEvaluations, schedule, diagnosticEvaluations,
      loginHistory,
      setUsers, setStudents, setAttendance, setGrades, setClasses, setSubjects,
      setInstruments, setInstrumentEvaluations, setSchedule, setDiagnosticEvaluations,
      setCurrentUser, syncToSupabaseManual, isOnline,
      clearAllStudents, clearAllAttendance, clearAllGrades, clearAllInstruments, clearAllData, cleanupOrphanedData
    } = useStore();
    
    if (!periodDates) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Cargando configuración...</p>
        </div>
      );
    }
    
    const [localDates, setLocalDates] = useState(periodDates || {});
    const [saved, setSaved] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [clearMsg, setClearMsg] = useState('');
    const [clearType, setClearType] = useState(null);

  if (!isAdmin) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '1.5rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '50%', 
          marginBottom: '1.5rem' 
        }}>
          <AlertCircle size={48} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Solo los administradores pueden configurar los periodos académicos.</p>
      </div>
    );
  }

  const handleChange = (id, field, value) => {
    setSaved(false);
    setLocalDates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = () => {
    Object.keys(localDates).forEach(id => {
      updatePeriodDates(id, localDates[id]);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const syncToCloud = async () => {
    if (!isOnline) {
      setSyncMsg('✗ Error: No se conectó a Supabase (Faltan Configurar Variables de Entorno en Vercel)');
      return;
    }
    setIsSyncing(true);
    setSyncMsg('Sincronizando...');
    
    try {
      await syncToSupabaseManual();
      setSyncMsg('✓ Sincronización completa');
    } catch (err) {
      console.error('Sync error:', err);
      setSyncMsg('✗ Error al sincronizar');
    }
    
    setIsSyncing(false);
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleClearData = async (type) => {
    setClearType(type);
  };

  const confirmClear = async () => {
    try {
      switch (clearType) {
        case 'students':
          await clearAllStudents();
          setClearMsg('✓ Estudiantes eliminados');
          break;
        case 'attendance':
          await clearAllAttendance();
          setClearMsg('✓ Asistencia eliminada');
          break;
        case 'grades':
          await clearAllGrades();
          setClearMsg('✓ Calificaciones eliminadas');
          break;
        case 'instruments':
          await clearAllInstruments();
          setClearMsg('✓ Instrumentos eliminados');
          break;
        case 'all':
          await clearAllData();
          setClearMsg('✓ Todos los datos eliminados');
          break;
      }
    } catch (err) {
      setClearMsg('✗ Error al limpiar datos');
    }
    setClearType(null);
    setTimeout(() => setClearMsg(''), 3000);
  };

  const gradientColors = [
    ['#6366f1', '#8b5cf6'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626']
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
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
              <SettingsIcon size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Configuración del Sistema</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Administra periodos académicos y datos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Fechas de Bimestres */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={24} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Fechas de Bimestres</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Configura los periodos académicos</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['1', '2', '3', '4'].map((id, idx) => {
            const [color1, color2] = gradientColors[idx % gradientColors.length];
            return (
              <div key={id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '1.5rem', 
                alignItems: 'center',
                padding: '1.25rem',
                background: `linear-gradient(135deg, ${color1}08, ${color2}08)`,
                borderRadius: '14px',
                border: `1px solid ${color1}30`
              }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${color1}, ${color2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {id}
                  </div>
                  <span style={{ color: color1 }}>Bimestre {id}</span>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.start || ''} 
                    onChange={(e) => handleChange(id, 'start', e.target.value)}
                    style={{ borderColor: color1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fecha de Finalización</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.end || ''} 
                    onChange={(e) => handleChange(id, 'end', e.target.value)}
                    style={{ borderColor: color1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de Ingresos */}
      {isAdmin && loginHistory && loginHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginTop: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} /> Historial de Ingresos
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.slice().reverse().slice(0, 50).map(entry => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 600 }}>{entry.userName}</td>
                    <td>{entry.loginAt ? new Date(entry.loginAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                    <td>{entry.logoutAt ? new Date(entry.logoutAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'En sesión'}</td>
                    <td>
                      {entry.duration !== null ? `${entry.duration} min` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
</div>
  );
}