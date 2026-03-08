import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Users, Wrench, Code, AlertTriangle } from 'lucide-react';

interface ProcessNodeData {
  label: string;
  activeSessions: number;
  toolsCount: number;
  hasPreCode: boolean;
  hasPostCode: boolean;
  onError: string;
  isHighlighted?: boolean;
  onSelect: () => void;
  [key: string]: unknown;
}

export const ProcessNode = memo(({ data }: { data: ProcessNodeData }) => {
  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3! !h-3 !bg-accent-purple !border-2 !border-bg-secondary" />
      <div
        onClick={data.onSelect}
        className={`bg-bg-secondary border-2 border-border-primary rounded-xl p-4 min-w-[160px] cursor-pointer
                   hover:border-accent-purple hover:shadow-lg transition-all group ${data.isHighlighted ? 'ring-4 ring-accent-green shadow-lg shadow-accent-green/20 border-accent-green' : ''}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Bot size={18} className="text-accent-purple" />
          <p className="text-sm font-medium text-text-primary">{data.label}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {data.toolsCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-bg-tertiary text-text-secondary">
              <Wrench size={10} /> {data.toolsCount}
            </span>
          )}
          {data.hasPreCode && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-accent-purple/10 text-accent-purple">
              <Code size={10} /> pre
            </span>
          )}
          {data.hasPostCode && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-accent-orange/10 text-accent-orange">
              <Code size={10} /> post
            </span>
          )}
          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-bg-tertiary text-text-secondary">
            <AlertTriangle size={10} /> {data.onError}
          </span>
        </div>

        {data.activeSessions > 0 && (
          <div className="flex items-center gap-1 text-xs text-accent-green">
            <Users size={12} />
            {data.activeSessions} activos
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-accent-purple !border-2 !border-bg-secondary" />
    </>
  );
});

ProcessNode.displayName = 'ProcessNode';
