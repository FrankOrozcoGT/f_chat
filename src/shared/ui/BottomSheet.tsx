// Bottom sheet component for mobile - slides up from bottom
// Click backdrop or swipe down to close

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // Prevent body scroll when open
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

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;

    if (sheetRef.current) {
      if (diff > 100) {
        // Swipe down threshold reached - close
        onClose();
      } else {
        // Snap back to original position
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[1300] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-[1400] bg-bg-primary rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[90vh] flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-border-primary rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary shrink-0">
          {title && (
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </Portal>
  );
};
