import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import './ToastNotification.css';

const ToastNotification = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {getIcon(toast.type)}
          </div>
          <div className="toast-message">
            {toast.message}
          </div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
