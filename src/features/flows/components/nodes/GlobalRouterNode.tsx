import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Plus } from 'lucide-react';

interface GlobalRouterNodeData {
  onCreateFlow?: () => void;
  [key: string]: unknown;
}

export const GlobalRouterNode = memo(({ data }: { data: GlobalRouterNodeData }) => {
  return (
    <>
      <div className="bg-accent-blue/10 border-2 border-accent-blue rounded-xl p-5 min-w-44">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={20} className="text-accent-blue" />
          <span className="text-sm font-semibold text-accent-blue">Router</span>
        </div>
        <p className="text-xs text-text-secondary mb-3">Intent detection</p>
        <button
          onClick={(e) => { e.stopPropagation(); data.onCreateFlow?.(); }}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-accent-blue/40 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-medium transition-colors"
        >
          <Plus size={13} /> Nuevo flujo
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
    </>
  );
});

GlobalRouterNode.displayName = 'GlobalRouterNode';
