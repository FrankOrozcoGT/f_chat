import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

/**
 * Renderiza un chart mermaid a SVG y corrige sus dimensiones (mermaid emite
 * viewBox sin width/height explícitos, lo que rompe el layout del canvas).
 * Limpia los elementos temporales que mermaid inyecta en <body> al renderizar.
 */
export function useDiagramRender(chart: string, svgContainerRef: React.RefObject<HTMLDivElement | null>) {
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!chart.trim()) return;
    setRenderError(null);
    const id = `editor-${++renderIdRef.current}-${Date.now()}`;
    mermaid
      .render(id, chart)
      .finally(() => {
        // Mermaid injects temp SVG and error elements into body — clean them up
        document.querySelectorAll(`#${CSS.escape(id)}, [data-mermaid-temp]`).forEach((el) => el.remove());
        document.querySelectorAll('body > svg[id^="editor-"], body > .error-icon, body > [id^="editor-"]').forEach((el) => el.remove());
      })
      .then(({ svg: rendered }) => {
        setSvg(rendered);
        // Fix SVG dimensions after render
        requestAnimationFrame(() => {
          if (!svgContainerRef.current) return;
          const svgEl = svgContainerRef.current.querySelector('svg');
          if (!svgEl) return;
          const viewBox = svgEl.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/\s+|,/).map(Number);
            if (parts.length >= 4) {
              svgEl.setAttribute('width', String(parts[2]));
              svgEl.setAttribute('height', String(parts[3]));
            }
          }
          svgEl.style.maxWidth = 'none';
          svgEl.style.overflow = 'visible';
        });
      })
      .catch((err) => {
        console.error('[DiagramEditor] mermaid render error:', err);
        setRenderError(err?.message || String(err));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  // Set cursor style on nodes/edges after SVG render
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svg) return;
    container.querySelectorAll('.node, .edgePath, .edgeLabel').forEach((el) => {
      (el as HTMLElement).style.cursor = 'pointer';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg]);

  return { svg, renderError, setRenderError };
}
