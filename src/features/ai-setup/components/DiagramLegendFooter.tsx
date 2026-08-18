interface DiagramLegendFooterProps {
  hasNodeMapping: boolean;
  hasInternalQueues: boolean;
  mode: 'move' | 'edit';
}

/** Pie del editor: leyenda de colores de cobertura/canal interno y atajos de teclado disponibles. */
export const DiagramLegendFooter = ({ hasNodeMapping, hasInternalQueues, mode }: DiagramLegendFooterProps) => (
  <div className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border-primary text-[10px] text-text-tertiary shrink-0">
    {hasNodeMapping && (
      <>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-accent-green bg-accent-green/10" />
          Alta cobertura
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-accent-blue bg-accent-blue/10" />
          Baja cobertura
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-dashed border-text-tertiary" />
          Sugerido IA
        </span>
      </>
    )}
    {hasInternalQueues && (
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded border-2 border-purple-400 bg-purple-400/10" />
        Canal interno
      </span>
    )}
    <span className="ml-auto">Tab: cambiar modo · {mode === 'edit' ? 'Click en nodo o flecha para acciones · Delete eliminar' : 'Arrastra para mover · Scroll para zoom'} · Ctrl+Z deshacer · Esc cerrar</span>
  </div>
);
