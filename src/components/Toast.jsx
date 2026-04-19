import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 9999
      }}>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle size={20} color="#10b981" />,
    error: <AlertCircle size={20} color="#ef4444" />,
    warning: <AlertTriangle size={20} color="#f59e0b" />,
    info: <Info size={20} color="#3b82f6" />
  };

  const colors = {
    success: '#ecfdf5',
    error: '#fef2f2',
    warning: '#fffbeb',
    info: '#eff6ff'
  };

  const borderColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      background: colors[type] || colors.info,
      borderLeft: `4px solid ${borderColors[type] || borderColors.info}`,
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      minWidth: '280px',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease'
    }}>
      {icons[type] || icons.info}
      <span style={{ flex: 1, color: '#1f2937', fontWeight: 500, fontSize: '0.9rem' }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: '#6b7280'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default ToastProvider;