import { Plus, Trash2, Pencil, ArrowRight, Diamond, Square, Circle } from 'lucide-react';
import type { InternalQueue } from '../api/useGetFlowDiagram';
import type { NodeShape } from '../hooks/useMermaidChartEditor';

interface Selection {
  type: 'node' | 'edge';
  id: string; // nodeId or "source->target"
}

export interface ContextMenuState {
  x: number;
  y: number;
  selection: Selection;
}

interface DiagramContextMenuProps {
  contextMenu: ContextMenuState;
  nodeCategories?: Record<string, string>;
  internalQueues?: InternalQueue[];
  onEditNodeLabel: (nodeId: string) => void;
  onChangeShape: (nodeId: string, shape: NodeShape) => void;
  onAddNodeAfter: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditEdgeLabel: (source: string, target: string) => void;
  onChangeEdgeEndpoint: (source: string, target: string, field: 'source' | 'target') => void;
  onInsertNodeInEdge: (source: string, target: string) => void;
  onDeleteEdge: (source: string, target: string) => void;
  onStopPropagation: (e: React.MouseEvent) => void;
}

/** Menú contextual del canvas: acciones sobre un nodo o una transición seleccionada. */
export const DiagramContextMenu = ({
  contextMenu,
  nodeCategories,
  internalQueues,
  onEditNodeLabel,
  onChangeShape,
  onAddNodeAfter,
  onDeleteNode,
  onEditEdgeLabel,
  onChangeEdgeEndpoint,
  onInsertNodeInEdge,
  onDeleteEdge,
  onStopPropagation,
}: DiagramContextMenuProps) => {
  return (
    <div
      className="fixed z-60 bg-bg-secondary border border-border-primary rounded-lg shadow-xl py-1 min-w-45"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={onStopPropagation}
    >
      {contextMenu.selection.type === 'node' && (() => {
        const nodeId = contextMenu.selection.id;
        const category = nodeCategories?.[nodeId];
        const queues = internalQueues?.filter((q) => q.nodeId === nodeId) ?? [];
        return (
          <>
            {category && (
              <div className="px-3 py-1.5 border-b border-border-primary">
                <p className="text-[10px] text-text-tertiary uppercase font-semibold">Categoría</p>
                <p className="text-xs text-accent-blue">{category}</p>
              </div>
            )}
            {queues.length > 0 && (
              <div className="px-3 py-1.5 border-b border-border-primary">
                <p className="text-[10px] text-text-tertiary uppercase font-semibold mb-1">Canales internos</p>
                {queues.map((q) => (
                  <div key={q.channelName} className="mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-purple-400">{q.channelName}</span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-purple-400/15 text-purple-400 border border-purple-400/30">{q.queueType}</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{q.usage}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => onEditNodeLabel(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <Pencil size={12} /> Editar nombre
            </button>
            <div className="px-3 py-1.5 text-[10px] text-text-tertiary uppercase font-semibold">Forma</div>
            <div className="flex items-center gap-1 px-3 pb-1.5">
              <button onClick={() => onChangeShape(nodeId, '[]')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Rectangular">
                <Square size={13} />
              </button>
              <button onClick={() => onChangeShape(nodeId, '{}')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Decisión">
                <Diamond size={13} />
              </button>
              <button onClick={() => onChangeShape(nodeId, '()')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Redondeado">
                <Circle size={13} />
              </button>
            </div>
            <div className="border-t border-border-primary my-0.5" />
            <button onClick={() => onAddNodeAfter(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <Plus size={12} /> Agregar nodo después
            </button>
            <div className="border-t border-border-primary my-0.5" />
            <button onClick={() => onDeleteNode(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 transition-colors">
              <Trash2 size={12} /> Eliminar nodo
            </button>
          </>
        );
      })()}

      {contextMenu.selection.type === 'edge' && (() => {
        const [src, tgt] = contextMenu.selection.id.split('->');
        return (
          <>
            <button onClick={() => onEditEdgeLabel(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <Pencil size={12} /> Editar etiqueta
            </button>
            <button onClick={() => onChangeEdgeEndpoint(src, tgt, 'source')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <ArrowRight size={12} className="rotate-180" /> Cambiar origen
            </button>
            <button onClick={() => onChangeEdgeEndpoint(src, tgt, 'target')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <ArrowRight size={12} /> Cambiar destino
            </button>
            <div className="border-t border-border-primary my-0.5" />
            <button onClick={() => onInsertNodeInEdge(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
              <Plus size={12} /> Insertar nodo en medio
            </button>
            <div className="border-t border-border-primary my-0.5" />
            <button onClick={() => onDeleteEdge(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 transition-colors">
              <Trash2 size={12} /> Eliminar transición
            </button>
          </>
        );
      })()}
    </div>
  );
};
