import { useState, useCallback } from 'react';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlaskConical } from 'lucide-react';
import { GlobalRouterNode } from './nodes/GlobalRouterNode';
import { FlowGroupNode } from './nodes/FlowGroupNode';
import { ProcessNode } from './nodes/ProcessNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import { TestPanel } from './TestPanel';
import { useFlowCanvasLayout } from './useFlowCanvasLayout';
import type { Flow, Node, ActiveSessionsResponse } from '../types';

const nodeTypes = {
  globalRouter: GlobalRouterNode,
  flowGroup: FlowGroupNode,
  process: ProcessNode,
};

interface UnifiedFlowCanvasProps {
  flows: Flow[];
  activeSessions: ActiveSessionsResponse;
}

export const UnifiedFlowCanvas = ({ flows, activeSessions }: UnifiedFlowCanvasProps) => {
  const [expandedFlowIds, setExpandedFlowIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<{ node: Node; isRouter: boolean } | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((flowId: string) => {
    setExpandedFlowIds((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) {
        next.delete(flowId);
      } else {
        next.add(flowId);
      }
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((node: Node, isRouter: boolean) => {
    setSelectedNode({ node, isRouter });
    setShowTestPanel(false);
  }, []);

  const handleToggleTestPanel = useCallback(() => {
    setShowTestPanel((prev) => {
      if (!prev) setSelectedNode(null);
      return !prev;
    });
  }, []);

  const handleNodeHighlight = useCallback((nodeId: string | null) => {
    setHighlightedNodeId(nodeId);
    // Auto-expand the flow that contains the highlighted node
    if (nodeId) {
      for (const flow of flows) {
        const isInFlow =
          flow.routerNode.id === nodeId ||
          flow.nodes.some((fn) => fn.node.id === nodeId);
        if (isInFlow) {
          setExpandedFlowIds((prev) => {
            if (prev.has(flow.id)) return prev;
            return new Set(prev).add(flow.id);
          });
          break;
        }
      }
    }
  }, [flows]);

  const { nodes, edges } = useFlowCanvasLayout({
    flows,
    expandedFlowIds,
    activeSessions,
    highlightedNodeId,
    onToggleExpand: handleToggleExpand,
    onSelectNode: handleSelectNode,
  });

  return (
    <div className="relative w-full h-[calc(100vh-180px)]">
      {/* Testing button */}
      <button
        onClick={handleToggleTestPanel}
        className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
          showTestPanel
            ? 'bg-accent-green/10 border-accent-green text-accent-green'
            : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'
        }`}
      >
        <FlaskConical size={16} />
        Testing
      </button>

      {/* Canvas */}
      <div className="w-full h-full bg-bg-primary rounded-lg border border-border-primary">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll
        />
      </div>

      {/* Detail panel */}
      {selectedNode && !showTestPanel && (
        <NodeDetailPanel
          node={selectedNode.node}
          isRouter={selectedNode.isRouter}
          activeSessions={activeSessions[selectedNode.node.id] || 0}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Test panel */}
      {showTestPanel && (
        <TestPanel
          onClose={() => {
            setShowTestPanel(false);
            setHighlightedNodeId(null);
          }}
          onNodeHighlight={handleNodeHighlight}
        />
      )}
    </div>
  );
};
