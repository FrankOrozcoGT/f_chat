import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Workflow, Users, Minimize2, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';

interface FlowGroupNodeData {
  label: string;
  totalActiveSessions: number;
  nodeCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTransitions?: () => void;
  [key: string]: unknown;
}

export const FlowGroupNode = memo(({ data }: { data: FlowGroupNodeData }) => {
  const actionButtons = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); data.onTransitions?.(); }}
        className="p-1 rounded hover:bg-bg-tertiary transition-colors"
        title="Transiciones"
      >
        <ArrowRightLeft size={13} className="text-text-secondary" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
        className="p-1 rounded hover:bg-bg-tertiary transition-colors"
        title="Editar flujo"
      >
        <Pencil size={13} className="text-text-secondary" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
        className="p-1 rounded hover:bg-bg-tertiary transition-colors"
        title="Eliminar flujo"
      >
        <Trash2 size={13} className="text-text-secondary" />
      </button>
    </div>
  );

  if (data.isExpanded) {
    return (
      <>
        <Handle type="target" position={Position.Left} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
        <div className="w-full h-full rounded-xl border-2 border-dashed border-accent-blue/40 bg-accent-blue/5">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Workflow size={16} className="text-accent-blue" />
              <span className="text-sm font-semibold text-text-primary">{data.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {actionButtons}
              <button
                onClick={(e) => { e.stopPropagation(); data.onToggleExpand(); }}
                className="p-1 rounded hover:bg-bg-tertiary transition-colors ml-1"
                title="Colapsar"
              >
                <Minimize2 size={14} className="text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
      <div
        onClick={data.onToggleExpand}
        className="bg-bg-secondary border-2 border-border-primary rounded-xl p-5 min-w-48 cursor-pointer hover:border-accent-blue hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-blue/10 group-hover:bg-accent-blue/20 transition-colors">
              <Workflow size={20} className="text-accent-blue" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">{data.label}</h3>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {actionButtons}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>{data.nodeCount} nodos</span>
          {data.totalActiveSessions > 0 && (
            <span className="flex items-center gap-1 text-accent-green">
              <Users size={12} />
              {data.totalActiveSessions}
            </span>
          )}
        </div>

        <div className="mt-2 text-[10px] text-text-tertiary group-hover:text-accent-blue transition-colors">
          Click para expandir
        </div>
      </div>
    </>
  );
});

FlowGroupNode.displayName = 'FlowGroupNode';
