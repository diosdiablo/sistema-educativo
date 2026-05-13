import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, BookOpen, Layers, LogOut, UserCog, ClipboardCheck, FileText, Clock, Settings as SettingsIcon, ClipboardList, Menu, X, FolderOpen, Calendar as CalendarIcon, Bell, BellRing } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import './App.css';
import Logo from './assets/logo.png';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Login from './pages/Login';
import UsersPage from './pages/Users';
import Instruments from './pages/Instruments';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import DiagnosticEvaluation from './pages/DiagnosticEvaluation';
import PlanningDocuments from './pages/PlanningDocuments';
import StudentProfile from './pages/StudentProfile';
import SchoolCalendar from './pages/SchoolCalendar';

function Sidebar({ isOpen, onClose, darkMode, setDarkMode }) {
  const { logout, currentUser, isAdmin, notifications, markNotificationRead } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  
  const unreadCount = notifications.filter(n => !n.readBy.includes(currentUser?.id)).length;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };
  
  const allMenuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Alumnos', path: '/students', icon: <Users size={20} /> },
    { name: 'Asistencia', path: '/attendance', icon: <CalendarCheck size={20} /> },
    { name: 'Calificaciones', path: '/grades', icon: <GraduationCap size={20} /> },
    { name: 'Instrumentos', path: '/instruments', icon: <ClipboardCheck size={20} /> },
    { name: 'Evaluación Diagnóstica', path: '/diagnostic-evaluation', icon: <ClipboardList size={20} /> },
    { name: 'Horario', path: '/schedule', icon: <Clock size={20} /> },
    { name: 'Calendario', path: '/calendar', icon: <CalendarIcon size={20} /> },
    { name: 'Planificación', path: '/planning', icon: <FolderOpen size={20} /> },
    { name: 'Reportes', path: '/reports', icon: <FileText size={20} /> },
  ];

  const adminItems = [
    { name: 'Grados y Secciones', path: '/classes', icon: <Layers size={20} /> },
    { name: 'Áreas Curriculares', path: '/subjects', icon: <BookOpen size={20} /> },
    { name: 'Usuarios', path: '/users', icon: <UserCog size={20} /> },
    { name: 'Configuración', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const menuItems = isAdmin ? [...allMenuItems, ...adminItems] : allMenuItems;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <img src={Logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 className="sidebar-title">Portal Agro</h1>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>I.E.P. 110</span>
          </div>
          <div ref={notifRef} style={{ position: 'relative', marginLeft: 'auto' }}>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{
              background: showNotifs ? 'rgba(255,255,255,0.2)' : 'transparent',
              border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem',
              borderRadius: '10px', position: 'relative', transition: 'all 0.2s ease',
              display: 'flex'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { if (!showNotifs) e.currentTarget.style.background = 'transparent'; }}
            >
              {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#ef4444', color: 'white', fontSize: '0.65rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #0f172a'
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifs && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: '0',
                width: '320px', maxHeight: '360px', overflowY: 'auto',
                background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                zIndex: 9999, padding: '0.5rem'
              }}>
                <div style={{ padding: '0.75rem 0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                  Notificaciones
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => {
                    const isUnread = !n.readBy.includes(currentUser?.id);
                    return (
                      <div key={n.id} onClick={() => { markNotificationRead(n.id); }} style={{
                        padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                        background: isUnread ? '#fefce8' : 'transparent',
                        marginBottom: '2px', transition: 'background 0.15s ease'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isUnread ? '#fefce8' : 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Bell size={14} color="white" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>{n.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {isUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '6px' }} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <button className="mobile-close-btn" onClick={onClose} style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>
        <div className="nav-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.15)', borderRadius: '16px', margin: '0.5rem' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', height: '40px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Users size={20} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentUser?.role === 'admin' ? 'Administrador' : 'Docente'}
              </span>
              <strong style={{color: '#ffffff', fontSize: '0.9rem', fontWeight: 600}}>{currentUser?.name}</strong>
            </div>
          </div>
          <button 
            onClick={() => { logout(); onClose(); }}
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { currentUser, isAdmin, isLoading } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Modo oscuro deshabilitado por problemas de compatibilidad
    return false;
    // const saved = localStorage.getItem('edu_dark_mode');
    // return saved === 'true';
  });

  useEffect(() => {
    // Modo oscuro deshabilitado
    // document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    // localStorage.setItem('edu_dark_mode', darkMode);
  }, [darkMode]);

  if (!currentUser) return <Login />;

  const AdminOnlyRoute = ({ children }) => {
    return isAdmin ? children : <Navigate to="/" replace />;
  };

  return (
    <div className="app-container">
      <div className="mobile-header">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="mobile-title">Portal Agro 110</span>
      </div>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/diagnostic-evaluation" element={<DiagnosticEvaluation />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/classes" element={<AdminOnlyRoute><Classes /></AdminOnlyRoute>} />
          <Route path="/subjects" element={<AdminOnlyRoute><Subjects /></AdminOnlyRoute>} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/users" element={<AdminOnlyRoute><UsersPage /></AdminOnlyRoute>} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendar" element={<SchoolCalendar />} />
          <Route path="/planning" element={<PlanningDocuments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

import { ToastProvider } from './components/Toast';

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
