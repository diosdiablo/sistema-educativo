import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, BookOpen, Layers, LogOut, UserCog, ClipboardCheck, FileText, Clock, Settings as SettingsIcon, ClipboardList, Menu, X, FolderOpen } from 'lucide-react';
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

function Sidebar({ isOpen, onClose, darkMode, setDarkMode }) {
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
          <button className="mobile-close-btn" onClick={onClose} style={{ display: 'none', marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
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
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', height: '40px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Users size={20} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          <Route path="/diagnostic-evaluation" element={<DiagnosticEvaluation />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/classes" element={<AdminOnlyRoute><Classes /></AdminOnlyRoute>} />
          <Route path="/subjects" element={<AdminOnlyRoute><Subjects /></AdminOnlyRoute>} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/users" element={<AdminOnlyRoute><UsersPage /></AdminOnlyRoute>} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/planning" element={<PlanningDocuments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
