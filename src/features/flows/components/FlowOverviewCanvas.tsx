import { useMemo, useCallback } from 'react';
import { ReactFlow, type Node, type Edge, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowOverviewNode } from './nodes/FlowOverviewNode';
import type { Flow, ActiveSessionsResponse } from '../types';

const nodeTypes = { flowOverview: FlowOverviewNode };

interface FlowOverviewCanvasProps {
  flows: Flow[];
  activeSessions: ActiveSessionsResponse;
  onSelectFlow: (flowId: string) => void;
}

function getTotalSessions(flow: Flow, activeSessions: ActiveSessionsResponse): number {
  let total = activeSessions[flow.routerNode.id] || 0;
  for (const fn of flow.nodes) {
    total += activeSessions[fn.node.id] || 0;
  }
  return total;
}

export const FlowOverviewCanvas = ({ flows, activeSessions, onSelectFlow }: FlowOverviewCanvasProps) => {
  const nodes = useMemo(() => {
    const cols = 3;
    const gapX = 300;
    const gapY = 200;

    return flows.map((flow, i): Node => ({
      id: flow.id,
      type: 'flowOverview',
      position: {
        x: (i % cols) * gapX,
        y: Math.floor(i / cols) * gapY,
      },
      data: {
        label: flow.name,
        totalActiveSessions: getTotalSessions(flow, activeSessions),
        nodeCount: flow.nodes.length + 1,
      },
    }));
  }, [flows, activeSessions]);

  const edges: Edge[] = [];

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    onSelectFlow(node.id);
  }, [onSelectFlow]);

  return (
    <div className="w-full h-[calc(100vh-180px)] bg-bg-primary rounded-lg border border-border-primary">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
      />
    </div>
  );
};
