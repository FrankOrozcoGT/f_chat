import { useCallback, useEffect, useRef, useState } from 'react';

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
  dragging: boolean;
  startX: number;
  startY: number;
}

const INITIAL_STATE: PanZoomState = { x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 };
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

/**
 * Pan/zoom genérico para un canvas: drag con mouse, scroll wheel para zoom,
 * y controles de zoom in/out/reset. No sabe nada del contenido del canvas.
 */
export function usePanZoom(enabled: boolean) {
  const [pan, setPan] = useState<PanZoomState>(INITIAL_STATE);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setPan((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return { ...prev, scale: Math.min(Math.max(prev.scale * delta, MIN_SCALE), MAX_SCALE) };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    setPan((prev) => ({ ...prev, dragging: true, startX: e.clientX - prev.x, startY: e.clientY - prev.y }));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!enabled || !pan.dragging) return;
    setPan((prev) => ({ ...prev, x: e.clientX - prev.startX, y: e.clientY - prev.startY }));
  };

  const onMouseUp = () => {
    if (!enabled) return;
    setPan((prev) => ({ ...prev, dragging: false }));
  };

  const zoomIn = () => setPan((p) => ({ ...p, scale: Math.min(p.scale * 1.2, MAX_SCALE) }));
  const zoomOut = () => setPan((p) => ({ ...p, scale: Math.max(p.scale * 0.8, MIN_SCALE) }));
  const reset = () => setPan(INITIAL_STATE);

  return { pan, containerRef, onMouseDown, onMouseMove, onMouseUp, zoomIn, zoomOut, reset };
}
