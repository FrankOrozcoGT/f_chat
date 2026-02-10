// Image modal component for full-screen image preview
// Click outside or press Escape to close

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

interface ImageModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageModal = ({ src, alt = 'Imagen', onClose }: ImageModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 z-[1400] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Portal>
  );
};
