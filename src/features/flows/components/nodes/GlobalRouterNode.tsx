import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface GlobalRouterNodeData {
  [key: string]: unknown;
}

export const GlobalRouterNode = memo(({ }: { data: GlobalRouterNodeData }) => {
  return (
    <>
      <div className="bg-accent-blue/10 border-2 border-accent-blue rounded-xl p-5 min-w-44">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={20} className="text-accent-blue" />
          <span className="text-sm font-semibold text-accent-blue">Router</span>
        </div>
        <p className="text-xs text-text-secondary">Intent detection</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-accent-blue! border-2! border-bg-secondary!" />
    </>
  );
});

GlobalRouterNode.displayName = 'GlobalRouterNode';
