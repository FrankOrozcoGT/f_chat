import { useMemo, useState, useCallback } from 'react';
import { ReactFlow, type Node as RFNode, type Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { RouterNode } from './nodes/RouterNode';
import { ProcessNode } from './nodes/ProcessNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import type { Flow, Node, ActiveSessionsResponse } from '../types';

const nodeTypes = {
  router: RouterNode,
  process: ProcessNode,
};

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface FlowDetailCanvasProps {
  flow: Flow;
  activeSessions: ActiveSessionsResponse;
  onBack: () => void;
}

export const FlowDetailCanvas = ({ flow, activeSessions, onBack }: FlowDetailCanvasProps) => {
  const [selectedNode, setSelectedNode] = useState<{ node: Node; isRouter: boolean } | null>(null);

  const handleSelectNode = useCallback((node: Node, isRouter: boolean) => {
    setSelectedNode({ node, isRouter });
  }, []);

  const { nodes, edges } = useMemo(() => {
    const rfNodes: RFNode[] = [];
    const rfEdges: Edge[] = [];

    // Router node at left-center
    rfNodes.push({
      id: flow.routerNode.id,
      type: 'router',
      position: { x: 100, y: 250 },
      data: {
        label: flow.routerNode.name,
        activeSessions: activeSessions[flow.routerNode.id] || 0,
        onSelect: () => handleSelectNode(flow.routerNode, true),
      },
    });

    // Process nodes spread to the right
    const nodeCount = flow.nodes.length;
    const startY = Math.max(0, 250 - ((nodeCount - 1) * 120) / 2);

    flow.nodes.forEach((flowNode, i) => {
      const tools = parseJsonArray(flowNode.node.tools);

      rfNodes.push({
        id: flowNode.node.id,
        type: 'process',
        position: { x: 450, y: startY + i * 120 },
        data: {
          label: flowNode.node.name,
          activeSessions: activeSessions[flowNode.node.id] || 0,
          toolsCount: tools.length,
          hasPreCode: !!flowNode.node.preCode,
          hasPostCode: !!flowNode.node.postCode,
          onError: flowNode.node.onError,
          onSelect: () => handleSelectNode(flowNode.node, false),
        },
      });

      // Edge from router to this node
      rfEdges.push({
        id: `${flow.routerNode.id}-${flowNode.node.id}`,
        source: flow.routerNode.id,
        target: flowNode.node.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--color-border-primary)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-text-tertiary)' },
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [flow, activeSessions, handleSelectNode]);

  return (
    <div className="relative w-full h-[calc(100vh-180px)]">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary
                   hover:bg-bg-tertiary transition-colors text-sm text-text-primary"
      >
        <ArrowLeft size={16} />
        Volver a flujos
      </button>

      {/* Flow name */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary">
        <h2 className="text-base font-semibold text-text-primary">{flow.name}</h2>
      </div>

      {/* Canvas */}
      <div className="w-full h-full bg-bg-primary rounded-lg border border-border-primary">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll
        />
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode.node}
          isRouter={selectedNode.isRouter}
          activeSessions={activeSessions[selectedNode.node.id] || 0}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};
