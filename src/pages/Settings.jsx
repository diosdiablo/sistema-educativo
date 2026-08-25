import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Save, Calendar, Clock, AlertCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default function Settings() {
  const { 
      periodDates, updatePeriodDates, isAdmin,
      users, students, attendance, grades, classes, subjects,
      instruments, instrumentEvaluations, schedule, diagnosticEvaluations,
      loginHistory,
      setUsers, setStudents, setAttendance, setGrades, setClasses, setSubjects,
      setInstruments, setInstrumentEvaluations, setSchedule, setDiagnosticEvaluations,
        setCurrentUser, syncToSupabaseManual, fetchFromSupabase, isOnline, events,
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
          background: 'var(--danger-tint-bg)', 
          borderRadius: '50%', 
          marginBottom: '1.5rem' 
        }}>
          <AlertCircle size={48} color="var(--danger-tint-fg)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Acceso Restringido</h2>
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
      await fetchFromSupabase();
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

  return (
    <div className="animate-fade-in">
      {/* Barra de herramientas */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Configuración del Sistema</h2>
        <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>Administra periodos académicos y datos</p>
      </div>

      {/* Sección Fechas de Bimestres */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--nav-active-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={24} color="var(--nav-active-fg)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Fechas de Bimestres</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Configura los periodos académicos</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['1', '2', '3', '4'].map((id) => {
            return (
              <div key={id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '1.5rem', 
                alignItems: 'center',
                padding: '1.25rem',
                background: 'var(--surface-muted)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: 500, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--nav-active-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--nav-active-fg)',
                    fontSize: '0.85rem'
                  }}>
                    {id}
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>Bimestre {id}</span>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.start || ''} 
                    onChange={(e) => handleChange(id, 'start', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha de Finalización</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.end || ''} 
                    onChange={(e) => handleChange(id, 'end', e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {saved && (
            <span style={{ color: '#188038', fontWeight: 500, fontSize: '0.9rem' }} className="animate-fade-in">
              ✓ ¡Configuración guardada!
            </span>
          )}
          <button 
            onClick={handleSave}
            className="btn-primary"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 1.25rem',
              borderRadius: '20px', fontSize: '0.875rem'
            }}
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Sincronización con la nube */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#18803815',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <RefreshCw size={24} color="#188038" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Sincronización con Supabase</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Sube todos los datos locales a la nube para que otros usuarios los vean
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>📅 {events.length} eventos</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>👥 {users.length} usuarios</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>🎓 {students.length} alumnos</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={syncToCloud}
            disabled={isSyncing}
            className="btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem'
            }}
          >
            <RefreshCw size={18} className={isSyncing ? 'spinner' : ''} /> {isSyncing ? 'Sincronizando...' : 'Sincronizar Todo'}
          </button>
          {syncMsg && (
            <span style={{ fontWeight: 500, fontSize: '0.9rem', color: syncMsg.includes('✓') ? '#188038' : 'var(--danger-tint-fg)' }} className="animate-fade-in">
              {syncMsg}
            </span>
          )}
        </div>
      </div>

      {/* Info importante */}
      <div style={{
        background: '#e3740015',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#e3740020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Clock size={20} color="#e37400" />
        </div>
        <div>
          <h4 style={{ fontWeight: 500, marginBottom: '0.25rem', color: '#e37400' }}>Información Importante</h4>
          <p style={{ fontSize: '0.85rem', color: '#e37400', lineHeight: 1.5, margin: 0 }}>
            Estas fechas se utilizan para filtrar la asistencia en los reportes de Excel. 
            Asegúrate de que no haya solapamientos entre bimestres para garantizar la exactitud de los datos.
          </p>
        </div>
      </div>

      {/* Sección de Limpiar Datos */}
      <div style={{
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--danger-tint-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trash2 size={24} color="var(--danger-tint-fg)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>Limpiar/Borrar Datos</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Elimina datos para comenzar desde cero</p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem', 
          background: 'var(--danger-tint-bg)', 
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <AlertTriangle size={20} color="var(--danger-tint-fg)" />
          <p style={{ fontSize: '0.85rem', color: 'var(--danger-tint-fg)', margin: 0 }}>
            <strong>Peligro:</strong> Esta acción elimina datos de Supabase y es IRREVERSIBLE. Asegúrate de tener un respaldo antes de continuar.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <button 
            onClick={() => handleClearData('students')}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1rem',
              background: 'var(--danger-tint-bg)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--danger-tint-fg)',
              cursor: 'pointer',
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
          >
            <Trash2 size={16} /> Estudiantes ({students.length})
          </button>
          <button 
            onClick={() => handleClearData('attendance')}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1rem',
              background: 'var(--danger-tint-bg)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--danger-tint-fg)',
              cursor: 'pointer',
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
          >
            <Trash2 size={16} /> Asistencia ({attendance.length})
          </button>
          <button 
            onClick={() => handleClearData('grades')}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1rem',
              background: 'var(--danger-tint-bg)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--danger-tint-fg)',
              cursor: 'pointer',
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
          >
            <Trash2 size={16} /> Notas ({grades.length})
          </button>
          <button 
            onClick={() => handleClearData('instruments')}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1rem',
              background: 'var(--danger-tint-bg)',
              border: 'none',
              borderRadius: '12px',
              color: 'var(--danger-tint-fg)',
              cursor: 'pointer',
              fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-tint-bg)'; e.currentTarget.style.color = 'var(--danger-tint-fg)'; }}
          >
            <Trash2 size={16} /> Instrumentos ({instruments.length})
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={async () => {
              if (window.confirm('¿Limpiar datos huérfanos? Esto eliminará horarios de docentes eliminados.')) {
                const removed = await cleanupOrphanedData();
                alert(`Datos huérfanos eliminados:\n- Horarios: ${removed.schedule}\n- Instrumentos: ${removed.instruments}\n- Evaluaciones: ${removed.evaluations}\n- Documentos: ${removed.documents}\n- Sesiones: ${removed.sessions}`);
              }
            }}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1.5rem',
              background: '#e3740015',
              border: 'none',
              borderRadius: '20px',
              color: '#e37400',
              cursor: 'pointer',
              fontWeight: 500,
              width: '100%',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e3740025'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#e3740015'; }}
          >
            <Trash2 size={18} /> Limpiar Datos Huérfanos
          </button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button 
            onClick={() => handleClearData('all')}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.75rem 1.5rem',
              background: 'var(--danger-color)',
              border: 'none',
              borderRadius: '20px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              width: '100%',
              fontSize: '0.875rem'
            }}
          >
            <Trash2 size={18} /> Borrar TODOS los Datos
          </button>
        </div>

        {clearMsg && (
          <p style={{ 
            color: clearMsg.includes('✓') ? '#188038' : 'var(--danger-tint-fg)', 
            fontSize: '0.85rem', 
            marginTop: '1rem',
            fontWeight: 500,
            textAlign: 'center'
          }}>{clearMsg}</p>
        )}
      </div>

      {/* Modal de Confirmación */}
      {clearType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start',
          zIndex: 1000,
          padding: '4rem 1rem'
        }}>
          <div style={{ 
            maxWidth: '420px', 
            width: '100%', 
            textAlign: 'center', 
            padding: '2rem',
            background: 'var(--bg-color-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in">
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'var(--danger-tint-bg)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <AlertTriangle size={32} color="var(--danger-tint-fg)" />
            </div>
            
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              ¿Confirmar eliminación?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
              {clearType === 'all' 
                ? 'Estás a punto de eliminar TODOS los datos: estudiantes, asistencia, calificaciones e instrumentos. Esta acción es IRREVERSIBLE.'
                : `Estás a punto de eliminar todos los registros de ${clearType === 'students' ? 'estudiantes' : clearType === 'attendance' ? 'asistencia' : clearType === 'grades' ? 'calificaciones' : 'instrumentos'}. Esta acción es IRREVERSIBLE.`
              }
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                style={{ 
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: 'var(--surface-muted)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
                }}
                onClick={() => setClearType(null)}
              >
                Cancelar
              </button>
              <button 
                style={{ 
                  flex: 1, 
                  padding: '0.8rem', 
                  background: 'var(--danger-color)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
                onClick={confirmClear}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Ingresos */}
      {isAdmin && (
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Clock size={20} /> Historial de Ingresos
          </h3>
          {loginHistory && loginHistory.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Ingreso</th>
                      <th>Salida</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map(entry => (
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 600 }}>{entry.userName}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 500,
                            background: entry.role === 'admin' ? 'var(--danger-tint-bg)' : entry.role === 'parent' ? '#e3740015' : '#18803815',
                            color: entry.role === 'admin' ? 'var(--danger-tint-fg)' : entry.role === 'parent' ? '#e37400' : '#188038'
                          }}>
                            {entry.role === 'admin' ? 'Admin' : entry.role === 'parent' ? 'Padre' : 'Docente'}
                          </span>
                        </td>
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
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay registros de ingresos aún.</p>
          )}
        </div>
      )}
    </div>
  );
}