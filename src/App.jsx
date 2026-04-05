import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, BookOpen, Layers, LogOut, UserCog, ClipboardCheck, FileText, Clock, Settings as SettingsIcon, ClipboardList } from 'lucide-react';
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

function Sidebar() {
  const { logout, currentUser, isAdmin } = useStore();
  
  const allMenuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Alumnos', path: '/students', icon: <Users size={20} /> },
    { name: 'Evaluación Diagnóstica', path: '/diagnostic-evaluation', icon: <ClipboardList size={20} /> },
    { name: 'Asistencia', path: '/attendance', icon: <CalendarCheck size={20} /> },
    { name: 'Calificaciones', path: '/grades', icon: <GraduationCap size={20} /> },
    { name: 'Instrumentos', path: '/instruments', icon: <ClipboardCheck size={20} /> },
    { name: 'Horario', path: '/schedule', icon: <Clock size={20} /> },
    { name: 'Reportes', path: '/reports', icon: <FileText size={20} /> },
  ];

  const adminItems = [
    { name: 'Grados y Secciones', path: '/classes', icon: <Layers size={20} /> },
    { name: 'Áreas Curriculares', path: '/subjects', icon: <BookOpen size={20} /> },
    { name: 'Usuarios', path: '/users', icon: <UserCog size={20} /> },
    { name: 'Configuración', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const menuItems = isAdmin ? [...allMenuItems.slice(0, 2), ...adminItems, ...allMenuItems.slice(2)] : allMenuItems;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img src={Logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <h1 className="sidebar-title">Portal Agro 110</h1>
      </div>
      <div className="nav-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
      
      <div style={{ marginTop: 'auto', padding: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentUser?.role === 'admin' ? 'Administrador' : 'Docente'}
          </span>
          <strong style={{color: '#ffffff', fontSize: '0.95rem'}}>{currentUser?.name}</strong>
        </div>
        <button 
          onClick={logout}
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, isAdmin } = useStore();

  if (!currentUser) return <Login />;

  const AdminOnly = ({ children }) => {
    return isAdmin ? children : <Navigate to="/" replace />;
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/diagnostic-evaluation" element={<DiagnosticEvaluation />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/classes" element={<AdminOnly><Classes /></AdminOnly>} />
          <Route path="/subjects" element={<AdminOnly><Subjects /></AdminOnly>} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<AdminOnly><Settings /></AdminOnly>} />
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
