import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { ToastType } from '../hooks/useToast';

export type { ToastType };

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  onClick?: () => void;
}

export const Toast = ({ message, type, duration = 5000, onClose, onClick }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-toast-error-bg',
          border: 'border-accent-red',
          text: 'text-accent-red',
          Icon: AlertCircle,
        };
      case 'success':
        return {
          bg: 'bg-toast-success-bg',
          border: 'border-accent-green',
          text: 'text-accent-green',
          Icon: CheckCircle,
        };
      case 'info':
        return {
          bg: 'bg-toast-info-bg',
          border: 'border-accent-blue',
          text: 'text-accent-blue',
          Icon: Info,
        };
      default:
        return {
          bg: 'bg-bg-secondary',
          border: 'border-border-primary',
          text: 'text-text-primary',
          Icon: Info,
        };
    }
  };

  const { bg, border, text, Icon } = getStyles();

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  return (
    <div
      className={`w-auto max-w-100 ${bg} border ${border} rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${onClick ? 'cursor-pointer' : ''}`}
      role="alert"
      onClick={onClick ? handleClick : undefined}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon size={18} className={`${text} shrink-0`} strokeWidth={2} />
        <p className={`text-sm font-medium flex-1 ${text}`}>{message}</p>
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className={`${text} hover:opacity-60 transition-opacity shrink-0 -mr-1 bg-transparent border-0 p-0 cursor-pointer`}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// ToastContainer Component
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          onClick={toast.onClick}
        />
      ))}
    </div>
  );
};
