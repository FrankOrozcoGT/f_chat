import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { X, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    background: '#1a1a2e',
    primaryColor: '#3b82f6',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#334155',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    edgeLabelBackground: '#1e293b',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 20 },
});

let idCounter = 0;

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

interface PanState {
  x: number;
  y: number;
  scale: number;
  dragging: boolean;
  startX: number;
  startY: number;
}

const DiagramViewer = ({
  svg,
  onClose,
  fullscreen = false,
}: {
  svg: string;
  onClose?: () => void;
  fullscreen?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<PanState>({
    x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0,
  });

  // Fix SVG dimensions so it doesn't clip
  useEffect(() => {
    if (!innerRef.current) return;
    const svgEl = innerRef.current.querySelector('svg');
    if (!svgEl) return;
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = 'auto';
    svgEl.style.height = 'auto';
    svgEl.style.maxWidth = 'none';
    svgEl.style.display = 'block';
  }, [svg]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setPan((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return { ...prev, scale: Math.min(Math.max(prev.scale * delta, 0.2), 5) };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    setPan((prev) => ({ ...prev, dragging: true, startX: e.clientX - prev.x, startY: e.clientY - prev.y }));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!pan.dragging) return;
    setPan((prev) => ({ ...prev, x: e.clientX - prev.startX, y: e.clientY - prev.startY }));
  };

  const onMouseUp = () => setPan((prev) => ({ ...prev, dragging: false }));

  const zoom = (factor: number) =>
    setPan((prev) => ({ ...prev, scale: Math.min(Math.max(prev.scale * factor, 0.2), 5) }));

  const reset = () => setPan({ x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 });

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-bg-primary select-none ${fullscreen ? 'w-full h-full' : 'w-full h-72 rounded-md border border-border-primary'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: pan.dragging ? 'grabbing' : 'grab' }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${pan.scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: '50%',
          left: '50%',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
        <button
          onClick={() => zoom(1.2)}
          className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={() => zoom(0.8)}
          className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={reset}
          className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
          title="Reset"
        >
          <RotateCcw size={13} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
            title="Cerrar"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export const MermaidDiagram = ({ chart, className }: MermaidDiagramProps) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const idRef = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    if (!chart?.trim()) return;
    setError(null);
    mermaid
      .render(idRef.current + '-' + Date.now(), chart)
      .then(({ svg: rendered }) => setSvg(rendered))
      .catch((err) => {
        console.error('[Mermaid] render error:', err);
        setError('No se pudo renderizar el diagrama');
      });
  }, [chart]);

  if (error) {
    return (
      <pre className={`text-xs text-text-tertiary font-mono whitespace-pre-wrap bg-bg-primary rounded-md p-3 ${className ?? ''}`}>
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className={`flex items-center justify-center h-20 text-xs text-text-tertiary ${className ?? ''}`}>
        Renderizando...
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className ?? ''}`}>
        <DiagramViewer svg={svg} />
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
          title="Vista completa"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-primary shrink-0">
            <span className="text-sm text-text-secondary">Diagrama</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <DiagramViewer svg={svg} onClose={() => setFullscreen(false)} fullscreen />
          </div>
        </div>
      )}
    </>
  );
};
