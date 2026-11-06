import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

// small messages at the top right (green = done, red = error)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const toast = useMemo(() => ({
    success: (m) => add(m, 'success'), error: (m) => add(m, 'error', 6000), warning: (m) => add(m, 'warning'), info: (m) => add(m, 'info'),
  }), [add]);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span style={{ fontSize: 18 }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
