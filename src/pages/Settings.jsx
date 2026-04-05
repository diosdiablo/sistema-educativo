import { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Settings as SettingsIcon, Save, Calendar, Clock, AlertCircle, Download, Upload, Database, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { 
    periodDates, updatePeriodDates, isAdmin,
    users, students, attendance, grades, classes, subjects,
    instruments, instrumentEvaluations, schedule, diagnosticEvaluations,
    setUsers, setStudents, setAttendance, setGrades, setClasses, setSubjects,
    setInstruments, setInstrumentEvaluations, setSchedule, setDiagnosticEvaluations,
    setCurrentUser
  } = useStore();
  const [localDates, setLocalDates] = useState(periodDates);
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isAdmin) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <AlertCircle size={48} color="var(--danger-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Solo los administradores pueden configurar los periodos académicos.</p>
      </div>
    );
  }

  const exportBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        users,
        students,
        attendance,
        grades,
        classes,
        subjects,
        instruments,
        instrumentEvaluations,
        schedule,
        diagnosticEvaluations
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_agrop110_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupMsg('✓ Respaldo descargado exitosamente');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm('⚠️ ADVERTENCIA: Los datos actuales serán reemplazados. ¿Estás seguro?')) {
      event.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const backupData = JSON.parse(content);
        
        if (!backupData.data || !backupData.version) {
          throw new Error('Archivo de respaldo inválido');
        }
        
        const { data } = backupData;
        
        if (data.users) setUsers(data.users);
        if (data.students) setStudents(data.students);
        if (data.attendance) setAttendance(data.attendance);
        if (data.grades) setGrades(data.grades);
        if (data.classes) setClasses(data.classes);
        if (data.subjects) setSubjects(data.subjects);
        if (data.instruments) setInstruments(data.instruments);
        if (data.instrumentEvaluations) setInstrumentEvaluations(data.instrumentEvaluations);
        if (data.schedule) setSchedule(data.schedule);
        if (data.diagnosticEvaluations) setDiagnosticEvaluations(data.diagnosticEvaluations);
        
        setCurrentUser(null);
        
        setRestoreMsg('✓ Respaldo restaurado exitosamente. Inicia sesión de nuevo.');
        setTimeout(() => setRestoreMsg(''), 5000);
      } catch (err) {
        setRestoreMsg('✗ Error al restaurar: Archivo corrupto o inválido');
        setTimeout(() => setRestoreMsg(''), 5000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

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

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-subtitle">Sincronización de periodos académicos (Bimestres)</p>
        </div>
        <SettingsIcon size={32} className="text-accent" />
      </header>

      <div className="card shadow-glass" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Calendar size={24} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Fechas de Bimestres</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {['1', '2', '3', '4'].map((id) => (
            <div key={id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '1.5rem', 
              alignItems: 'center',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Bimestre {id}</div>
              
              <div>
                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Fecha de Inicio</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.start || ''} 
                    onChange={(e) => handleChange(id, 'start', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Fecha de Finalización</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={localDates[id]?.end || ''} 
                    onChange={(e) => handleChange(id, 'end', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
          {saved && (
            <span style={{ color: 'var(--success-color)', fontWeight: 600, fontSize: '0.9rem' }} className="animate-fade-in">
              ¡Configuración guardada exitosamente!
            </span>
          )}
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 2rem' }}
            onClick={handleSave}
          >
            <Save size={20} /> Guardar Cambios
          </button>
        </div>
      </div>

      <div className="card shadow-glass" style={{ maxWidth: '800px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Clock size={20} color="var(--accent-primary)" />
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Información Importante</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Estas fechas se utilizan para filtrar la asistencia en los reportes de Excel. 
              Asegúrate de que no haya solapamientos entre bimestres para garantizar la exactitud de los datos.
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Respaldos */}
      <div className="card shadow-glass" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <Database size={24} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Respaldos de Datos</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exporta e importa todos los datos del sistema</p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem', 
          background: 'rgba(245, 158, 11, 0.1)', 
          borderRadius: '8px', 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '1.5rem'
        }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
            <strong>Importante:</strong> Haz clic en "Exportar Respaldo" periódicamente para no perder tus datos. Si restauras un respaldo, los datos actuales serán reemplazados.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Exportar */}
          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(16, 185, 129, 0.05)', 
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Download size={28} color="#10b981" />
            </div>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Exportar Respaldo</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Descarga un archivo JSON con todos los datos del sistema
            </p>
            <button 
              className="btn-primary"
              onClick={exportBackup}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#10b981',
                padding: '0.75rem 1.5rem'
              }}
            >
              <Download size={18} /> Exportar Respaldo
            </button>
            {backupMsg && (
              <p style={{ 
                color: '#10b981', fontSize: '0.85rem', marginTop: '0.75rem',
                fontWeight: 600
              }}>{backupMsg}</p>
            )}
          </div>

          {/* Importar */}
          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(59, 130, 246, 0.05)', 
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Upload size={28} color="#3b82f6" />
            </div>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Restaurar Respaldo</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Restaura los datos desde un archivo JSON de respaldo
            </p>
            <button 
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#3b82f6',
                padding: '0.75rem 1.5rem'
              }}
            >
              <Upload size={18} /> Importar Respaldo
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importBackup}
              style={{ display: 'none' }}
            />
            {restoreMsg && (
              <p style={{ 
                color: restoreMsg.includes('✓') ? '#10b981' : '#ef4444', 
                fontSize: '0.85rem', 
                marginTop: '0.75rem',
                fontWeight: 600
              }}>{restoreMsg}</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            <strong>Datos incluidos en el respaldo:</strong> Usuarios, Estudiantes, Asistencia, Calificaciones, 
            Grados/Secciones, Áreas Curriculares, Instrumentos, Evaluaciones, Horario y Evaluación Diagnóstica.
          </p>
        </div>
      </div>
    </div>
  );
}
