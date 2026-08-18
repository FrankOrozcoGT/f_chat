import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, useReactFlow, useNodes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlaskConical, Settings2 } from 'lucide-react';
import { GlobalRouterNode } from '@/features/flows/components/nodes/GlobalRouterNode';
import { FlowGroupNode } from '@/features/flows/components/nodes/FlowGroupNode';
import { ProcessNode } from '@/features/flows/components/nodes/ProcessNode';
import { NodeDetailPanel } from '@/features/flows/components/NodeDetailPanel';
import { TestPanel } from '@/features/flows/components/TestPanel';
import { ToolsPanel } from '@/features/flows/components/ToolsPanel';
import { useFlowCanvasLayout } from '@/features/flows/components/useFlowCanvasLayout';
import { useGetTransitions } from '@/features/flows/api/useGetTransitions';
import { useGetIntents } from '@/features/flows/api/useGetIntents';
import { useGetFunctions } from '@/features/flows/api/useGetFunctions';
import { useFlowCrud } from '@/features/flows/hooks/useFlowCrud';
import { useNodeCrud } from '@/features/flows/hooks/useNodeCrud';
import { useTransitionCrud } from '@/features/flows/hooks/useTransitionCrud';
import { useIntentCrud } from '@/features/flows/hooks/useIntentCrud';
import { FlowCrudModals } from '@/features/flows/components/FlowCrudModals';
import { NodeCrudModals } from '@/features/flows/components/NodeCrudModals';
import { TransitionCrudModals } from '@/features/flows/components/TransitionCrudModals';
import { IntentCrudModals } from '@/features/flows/components/IntentCrudModals';
import type { Flow, Node, ActiveSessionsResponse } from '@/features/flows/types';

function NodeCenterEffect({ highlightedNodeId }: { highlightedNodeId: string | null }) {
  const { setCenter, getZoom } = useReactFlow();
  const nodes = useNodes();

  useEffect(() => {
    if (!highlightedNodeId) return;
    const rfNode = nodes.find((n) => n.id.includes(`__node__${highlightedNodeId}`));
    if (!rfNode) return;
    let x = rfNode.position.x + (rfNode.measured?.width ?? 200) / 2;
    let y = rfNode.position.y + (rfNode.measured?.height ?? 100) / 2;
    if (rfNode.parentId) {
      const parent = nodes.find((n) => n.id === rfNode.parentId);
      if (parent) {
        x += parent.position.x;
        y += parent.position.y;
      }
    }
    setCenter(x, y, { zoom: getZoom(), duration: 500 });
  }, [highlightedNodeId, nodes, setCenter]);

  return null;
}

const nodeTypes = {
  globalRouter: GlobalRouterNode,
  flowGroup: FlowGroupNode,
  process: ProcessNode,
};

interface UnifiedFlowCanvasProps {
  flows: Flow[];
  activeSessions: ActiveSessionsResponse;
}

type ActivePanel = 'tools' | null;

export const UnifiedFlowCanvas = ({ flows, activeSessions }: UnifiedFlowCanvasProps) => {
  // ── Canvas state ─────────────────────────────────────────────────────────
  const [expandedFlowIds, setExpandedFlowIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<{ node: Node; isRouter: boolean } | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // ── Side panels ──────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [transitionsFlowId, setTransitionsFlowId] = useState<string | null>(null);

  // ── API data ─────────────────────────────────────────────────────────────
  const { data: intents = [] } = useGetIntents();
  const { data: functions = [] } = useGetFunctions();
  const { data: transitionsList = [] } = useGetTransitions(transitionsFlowId ?? '');

  // Nodos extraídos de los flows (la data que ya llega)
  const existingNodes = useMemo(() => {
    const seen = new Set<string>();
    const result: Node[] = [];
    for (const flow of flows) {
      if (flow.routerNode && !seen.has(flow.routerNode.id)) {
        seen.add(flow.routerNode.id);
        result.push(flow.routerNode);
      }
      for (const fn of (flow.nodes ?? [])) {
        if (!seen.has(fn.node.id)) {
          seen.add(fn.node.id);
          result.push(fn.node);
        }
      }
    }
    return result;
  }, [flows]);

  const transitionsFlow = flows.find((f) => f.id === transitionsFlowId);

  // ── CRUD hooks ───────────────────────────────────────────────────────────
  const flowCrud = useFlowCrud(existingNodes.length);
  const nodeCrud = useNodeCrud(functions);
  const transitionCrud = useTransitionCrud(transitionsFlowId);
  const intentCrud = useIntentCrud();

  const openFlowTransitions = useCallback((flow: Flow) => {
    setTransitionsFlowId(flow.id);
    setActivePanel('tools');
  }, []);

  // ── Canvas handlers ──────────────────────────────────────────────────────
  const handleToggleExpand = useCallback((flowId: string) => {
    setExpandedFlowIds((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) next.delete(flowId);
      else next.add(flowId);
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
    if (nodeId) {
      for (const flow of flows) {
        const isInFlow =
          flow.routerNode?.id === nodeId ||
          (flow.nodes ?? []).some((fn) => fn.node.id === nodeId);
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

  const openAddTransition = useCallback((flowId: string, fromNode: Node) => {
    setTransitionsFlowId(flowId);
    transitionCrud.openAddTransition(fromNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Layout ───────────────────────────────────────────────────────────────
  const { nodes, edges } = useFlowCanvasLayout({
    flows,
    expandedFlowIds,
    activeSessions,
    highlightedNodeId,
    onToggleExpand: handleToggleExpand,
    onSelectNode: handleSelectNode,
    onCreateFlow: flowCrud.openCreateFlow,
    onEditFlow: flowCrud.openEditFlow,
    onDeleteFlow: flowCrud.openDeleteFlow,
    onFlowTransitions: openFlowTransitions,
    onFlowHistory: flowCrud.openFlowHistory,
    onEditNode: nodeCrud.openEditNode,
    onAddTransition: openAddTransition,
  });

  const flowOptions = [{ value: '', label: 'Ninguno' }, ...flows.map((f) => ({ value: f.id, label: f.name }))];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100vh-180px)]">

      {/* Toolbar top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setActivePanel(activePanel === 'tools' ? null : 'tools')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${activePanel === 'tools' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'}`}
        >
          <Settings2 size={16} /> Herramientas
        </button>
        <button
          onClick={handleToggleTestPanel}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${showTestPanel ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'}`}
        >
          <FlaskConical size={16} /> Testing
        </button>
      </div>

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
        >
          <NodeCenterEffect highlightedNodeId={highlightedNodeId} />
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selectedNode && !showTestPanel && activePanel === null && (
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
          onClose={() => { setShowTestPanel(false); setHighlightedNodeId(null); }}
          onNodeHighlight={handleNodeHighlight}
        />
      )}

      {/* Tools panel */}
      {activePanel === 'tools' && (
        <ToolsPanel
          onClose={() => setActivePanel(null)}
          existingNodes={existingNodes}
          onEditNode={nodeCrud.openEditNode}
          onCreateNode={nodeCrud.openCreateNode}
          intents={intents}
          flows={flows}
          onCreateIntent={intentCrud.openCreateIntent}
          onEditIntent={intentCrud.openEditIntent}
          onDeleteIntent={(intent) => intentCrud.setDeleteIntentTarget(intent)}
          transitionsFlow={transitionsFlow}
          transitionsList={transitionsList}
          onDeleteTransition={(id) => transitionCrud.setDeleteTransitionTarget(id)}
        />
      )}

      <FlowCrudModals flowCrud={flowCrud} existingNodes={existingNodes} />
      <NodeCrudModals nodeCrud={nodeCrud} functions={functions} />
      <TransitionCrudModals transitionCrud={transitionCrud} existingNodes={existingNodes} />
      <IntentCrudModals intentCrud={intentCrud} flowOptions={flowOptions} />
    </div>
  );
};
