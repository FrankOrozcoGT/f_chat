import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Users } from 'lucide-react';

interface RouterNodeData {
  label: string;
  activeSessions: number;
  isHighlighted?: boolean;
  onSelect: () => void;
  [key: string]: unknown;
}

export const RouterNode = memo(({ data }: { data: RouterNodeData }) => {
  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
      <div
        onClick={data.onSelect}
        className={`bg-accent-blue/10 border-2 border-accent-blue rounded-xl p-4 min-w-40 cursor-pointer
                   hover:bg-accent-blue/20 hover:shadow-lg transition-all ${data.isHighlighted ? 'ring-4 ring-accent-green shadow-lg shadow-accent-green/20' : ''}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <GitBranch size={18} className="text-accent-blue" />
          <span className="text-sm font-semibold text-accent-blue">Router</span>
        </div>
        <p className="text-sm text-text-primary font-medium">{data.label}</p>

        {data.activeSessions > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-accent-green">
            <Users size={12} />
            {data.activeSessions} activos
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
    </>
  );
});

RouterNode.displayName = 'RouterNode';
