import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Workflow, Users } from 'lucide-react';

interface FlowOverviewNodeData {
  label: string;
  totalActiveSessions: number;
  nodeCount: number;
  [key: string]: unknown;
}

export const FlowOverviewNode = memo(({ data }: { data: FlowOverviewNodeData }) => {
  return (
    <>
      <Handle type="source" position={Position.Right} className="!invisible" />
      <div
        className="bg-bg-secondary border-2 border-border-primary rounded-xl p-6 min-w-[200px] cursor-pointer
                   hover:border-accent-blue hover:shadow-lg transition-all group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-accent-blue/10 group-hover:bg-accent-blue/20 transition-colors">
            <Workflow size={24} className="text-accent-blue" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">{data.label}</h3>
        </div>

        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>{data.nodeCount} nodos</span>
          {data.totalActiveSessions > 0 && (
            <span className="flex items-center gap-1 text-accent-green">
              <Users size={14} />
              {data.totalActiveSessions}
            </span>
          )}
        </div>

        <div className="mt-3 text-xs text-text-tertiary group-hover:text-accent-blue transition-colors">
          Click para ver nodos →
        </div>
      </div>
    </>
  );
});

FlowOverviewNode.displayName = 'FlowOverviewNode';
