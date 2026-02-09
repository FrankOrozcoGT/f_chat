import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Portal } from '@/shared/ui/Portal';
import { cn } from '@/shared/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1300] cursor-pointer"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 md:inset-4 flex items-end md:items-center justify-center z-[1400] pointer-events-none">
        {/* Modal Content */}
        <div
          className={cn(
            'w-full bg-bg-primary rounded-t-xl md:rounded-xl shadow-xl pointer-events-auto max-h-[90vh] md:max-h-[85vh] overflow-y-auto',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </Portal>
  );
};

// Modal subcomponents
export interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader = ({ children, onClose, className }: ModalHeaderProps) => {
  return (
    <div
      className={cn(
        'p-4 md:p-6 border-b border-border-primary flex items-center justify-between',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-bg-secondary rounded-md min-w-11 min-h-11 flex items-center justify-center transition-colors"
          aria-label="Cerrar modal"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      )}
    </div>
  );
};

export interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

export const ModalTitle = ({ children, className }: ModalTitleProps) => {
  return (
    <h2 className={cn('text-lg md:text-xl font-semibold text-text-primary', className)}>
      {children}
    </h2>
  );
};

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className }: ModalBodyProps) => {
  return <div className={cn('p-4 md:p-6 overflow-y-auto', className)}>{children}</div>;
};

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <div
      className={cn(
        'p-4 md:p-6 border-t border-border-primary flex flex-col gap-2 md:flex-row md:gap-3 md:justify-end',
        className
      )}
    >
      {children}
    </div>
  );
};
