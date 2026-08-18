import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DiagramZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/** Controles de zoom flotantes en la esquina inferior derecha del canvas. */
export const DiagramZoomControls = ({ onZoomIn, onZoomOut, onReset }: DiagramZoomControlsProps) => (
  <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
    <button
      onClick={onZoomIn}
      className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
      title="Zoom in"
    >
      <ZoomIn size={13} />
    </button>
    <button
      onClick={onZoomOut}
      className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
      title="Zoom out"
    >
      <ZoomOut size={13} />
    </button>
    <button
      onClick={onReset}
      className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
      title="Reset"
    >
      <RotateCcw size={13} />
    </button>
  </div>
);
