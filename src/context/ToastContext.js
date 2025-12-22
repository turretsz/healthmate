import React, { createContext, useContext, useMemo, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext({ notify: () => {} });

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(null);

  const notify = (message, options = {}) => {
    const { type = 'info', duration = 3200 } = options;
    setToast({ message, type });
    if (timer) clearTimeout(timer);
    const nextTimer = setTimeout(() => setToast(null), duration);
    setTimer(nextTimer);
  };

  const value = useMemo(() => ({ notify }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
