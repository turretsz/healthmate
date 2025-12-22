import React from 'react';
import './styles/Toast.css';

const icons = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '⛔',
  success: '✅',
};

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const { message, type = 'info' } = toast;
  return (
    <div className={`toast-shell type-${type}`}>
      <div className="toast-icon" aria-hidden>{icons[type] || icons.info}</div>
      <div className="toast-message">{message}</div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Đóng thông báo">
        ×
      </button>
    </div>
  );
};

export default Toast;
