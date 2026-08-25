import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, BookOpen, Layers, LogOut, UserCog, ClipboardCheck, FileText, Clock, Settings as SettingsIcon, ClipboardList, Menu, X, FolderOpen, Calendar as CalendarIcon, Bell, BellRing, MessageCircle, ThumbsUp } from 'lucide-react';
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
import BoletaNotas from './pages/BoletaNotas';
import { ChatList, ChatConversationPage } from './pages/Chat';
import ParentLogin from './pages/ParentLogin';
import ParentDashboard from './pages/ParentDashboard';
import Behavior from './pages/Behavior';

function Sidebar({ isOpen, onClose, darkMode, setDarkMode, bellBtnRef, toggleNotifs, unreadCount, showNotifs }) {
  const { logout, currentUser, isAdmin } = useStore();

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
    { name: 'Boleta de Notas', path: '/boleta', icon: <FileText size={20} /> },
    { name: 'Chat', path: '/chat', icon: <MessageCircle size={20} /> },
    { name: 'Conducta', path: '/behavior', icon: <ThumbsUp size={20} /> },
  ];

  const adminItems = [
    { name: 'Grados y Secciones', path: '/classes', icon: <Layers size={20} /> },
    { name: 'Áreas Curriculares', path: '/subjects', icon: <BookOpen size={20} /> },
    { name: 'Usuarios', path: '/users', icon: <UserCog size={20} /> },
    { name: 'Configuración', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const menuItems = isAdmin ? [...allMenuItems, ...adminItems] : allMenuItems.filter(item => item.path !== '/boleta');

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={Logo} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <div>
            <h1 className="sidebar-title">Portal Agro</h1>
            <span style={{ fontSize: '0.65rem', color: '#80868b', letterSpacing: '0.1em' }}>I.E.P. 110</span>
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button ref={bellBtnRef} onClick={(e) => { e.stopPropagation(); toggleNotifs(e); }} style={{
              background: showNotifs ? '#e8f0fe' : 'transparent',
              border: 'none', color: '#5f6368', cursor: 'pointer', padding: '0.5rem',
              borderRadius: '50%', position: 'relative', transition: 'all 0.2s ease',
              display: 'flex'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f4'; }}
              onMouseLeave={e => { if (!showNotifs) e.currentTarget.style.background = 'transparent'; }}
            >
              {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#d93025', color: 'white', fontSize: '0.65rem',
                  fontWeight: 500, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #ffffff'
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          </div>
          <button className="mobile-close-btn" onClick={onClose} style={{ display: 'none', background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '0.5rem' }}>
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

        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #dadce0', background: '#ffffff', borderRadius: '12px', margin: '0.5rem 0.25rem 0.25rem 0.25rem' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: '#e8f0fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={20} color="#1967d2" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ color: '#5f6368', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentUser?.role === 'admin' ? 'Administrador' : 'Docente'}
              </span>
              <strong style={{ color: '#202124', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name}</strong>
            </div>
          </div>
          <button
            onClick={() => { logout(); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#fce8e6', color: '#d93025', border: 'none',
              padding: '0.65rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { currentUser, isAdmin, isLoading, notifications, markNotificationRead, deleteNotification } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifPos, setNotifPos] = useState(null);
  const bellBtnRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const touchStartX = useRef(0);
  const swipedNotif = useRef(null);
  const [darkMode, setDarkMode] = useState(() => false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && currentUser && window.location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [isLoading]);

  const unreadCount = notifications.filter(n => !(n.readBy || []).includes(currentUser?.id)).length;

  const toggleNotifs = (e) => {
    e.stopPropagation();
    if (!showNotifs && bellBtnRef.current) {
      const rect = bellBtnRef.current.getBoundingClientRect();
      if (window.innerWidth <= 768) {
        setNotifPos({ left: 16, top: 76, isMobile: true });
      } else {
        setNotifPos({ left: rect.right + 8, top: rect.top, isMobile: false });
      }
    }
    setShowNotifs(prev => !prev);
  };

  useEffect(() => {
    function handleClick(e) {
      const outsideDropdown = notifDropdownRef.current && !notifDropdownRef.current.contains(e.target);
      const outsideBell = bellBtnRef.current && !bellBtnRef.current.contains(e.target);
      if (outsideDropdown && outsideBell) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  useEffect(() => {
  }, [darkMode]);

  if (!currentUser) {
    const path = window.location.pathname;
    if (path.startsWith('/parent')) {
      return (
        <Routes>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent" element={<ParentLogin />} />
        </Routes>
      );
    }
    return <Login />;
  }

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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} bellBtnRef={bellBtnRef} toggleNotifs={toggleNotifs} unreadCount={unreadCount} showNotifs={showNotifs} />
      {showNotifs && notifPos && (
        <div ref={notifDropdownRef} style={{
          position: 'fixed', left: notifPos.left, top: notifPos.top,
          width: notifPos.isMobile ? 'calc(100vw - 32px)' : '320px',
          maxHeight: 'min(360px, calc(100vh - 90px))', overflowY: 'auto',
          background: 'white', border: '1px solid #dadce0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          zIndex: 9999, padding: '0.5rem'
        }}>
          <div style={{ padding: '0.75rem 0.75rem 0.5rem', borderBottom: '1px solid #e8eaed', fontWeight: 500, fontSize: '0.9rem', color: '#202124' }}>
            Notificaciones
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9aa0a6', fontSize: '0.85rem' }}>
              No hay notificaciones
            </div>
          ) : (
            notifications.slice(0, 20).map(n => {
                  const isUnread = !(n.readBy || []).includes(currentUser?.id);
              return (
                <div key={n.id} onClick={() => { markNotificationRead(n.id); setTimeout(() => deleteNotification(n.id), 300); }}
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX; e.currentTarget.style.transition = 'none'; }}
                  onTouchMove={e => { const dx = e.touches[0].clientX - touchStartX.current; if (dx > 0) e.currentTarget.style.transform = `translateX(${dx}px)`; }}
                  onTouchEnd={e => { const dx = parseInt(e.currentTarget.style.transform?.replace('translateX(', '')?.replace('px)', '') || '0'); if (dx > 80) { e.currentTarget.style.transition = 'transform 0.3s ease'; e.currentTarget.style.transform = 'translateX(100%)'; setTimeout(() => deleteNotification(n.id), 300); } else { e.currentTarget.style.transition = 'transform 0.2s ease'; e.currentTarget.style.transform = 'translateX(0)'; } }}
                  style={{
                    padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                    background: isUnread ? '#fef7e0' : 'transparent',
                    marginBottom: '2px', transition: 'background 0.15s ease',
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isUnread ? '#fef7e0' : 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: '#fef7e0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Bell size={14} color="#b06000" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem', color: '#202124' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5f6368', marginTop: '2px' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9aa0a6', marginTop: '4px' }}>
                        {new Date(n.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e37400', flexShrink: 0, marginTop: '6px' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
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
          <Route path="/boleta" element={<AdminOnlyRoute><BoletaNotas /></AdminOnlyRoute>} />
          <Route path="/chat/:userId" element={<ChatConversationPage />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/behavior" element={<Behavior />} />
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent" element={<ParentLogin />} />
          <Route path="/settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

import { ToastProvider } from './components/Toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#dc2626' }}>Algo salió mal</h1>
          <p style={{ color: '#64748b' }}>La aplicación encontró un error inesperado.</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', maxWidth: '600px', margin: '1rem auto', overflow: 'auto' }}>{this.state.error?.message}</pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
