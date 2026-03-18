import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, useReactFlow, useNodes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlaskConical, Plus, List, Tag, Pencil, Trash2, X } from 'lucide-react';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { GlobalRouterNode } from './nodes/GlobalRouterNode';
import { FlowGroupNode } from './nodes/FlowGroupNode';
import { ProcessNode } from './nodes/ProcessNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import { TestPanel } from './TestPanel';
import { useFlowCanvasLayout } from './useFlowCanvasLayout';
import { useCreateFlow } from '../api/useCreateFlow';
import { useUpdateFlow } from '../api/useUpdateFlow';
import { useDeleteFlow } from '../api/useDeleteFlow';
import { useCreateNode } from '../api/useCreateNode';
import { useUpdateNode } from '../api/useUpdateNode';
import { useGetTransitions } from '../api/useGetTransitions';
import { useCreateTransition } from '../api/useCreateTransition';
import { useDeleteTransition } from '../api/useDeleteTransition';
import { useGetIntents } from '../api/useGetIntents';
import { useGetFunctions } from '../api/useGetFunctions';
import { NodeFunctionType } from '../types';
import { useCreateIntent } from '../api/useCreateIntent';
import { useUpdateIntent } from '../api/useUpdateIntent';
import { useDeleteIntent } from '../api/useDeleteIntent';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input, Textarea } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import type { Flow, Node, ActiveSessionsResponse, Intent, OnErrorStrategy } from '../types';

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

type ActivePanel = 'nodes' | 'intents' | 'transitions' | null;

export const UnifiedFlowCanvas = ({ flows, activeSessions }: UnifiedFlowCanvasProps) => {
  // ── Canvas state (original) ──────────────────────────────────────────────
  const [expandedFlowIds, setExpandedFlowIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<{ node: Node; isRouter: boolean } | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // ── Side panels ──────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [transitionsFlowId, setTransitionsFlowId] = useState<string | null>(null);

  // ── Flow modals ──────────────────────────────────────────────────────────
  const [createFlowOpen, setCreateFlowOpen] = useState(false);
  const [editFlowTarget, setEditFlowTarget] = useState<Flow | null>(null);
  const [deleteFlowTarget, setDeleteFlowTarget] = useState<Flow | null>(null);
  const [flowForm, setFlowForm] = useState({ name: '', routerNodeId: '', newNodeName: '' });
  const [flowFormErrors, setFlowFormErrors] = useState<Partial<typeof flowForm>>({});
  const [createNewRouterNode, setCreateNewRouterNode] = useState(false);

  // ── Node modals ──────────────────────────────────────────────────────────
  const [editNodeTarget, setEditNodeTarget] = useState<Node | null>(null);
  const [nodeForm, setNodeForm] = useState({ name: '', systemPrompt: '', tools: [] as string[], preCode: [] as string[], postCode: [] as string[], onError: 'hitl' });
  const [nodeFormErrors, setNodeFormErrors] = useState<{ name?: string }>({});

  // ── Create node (panel) ──────────────────────────────────────────────────
  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [createNodeForm, setCreateNodeForm] = useState({ name: '', systemPrompt: '', tools: [] as string[], preCode: [] as string[], postCode: [] as string[], onError: 'hitl' });
  const [createNodeErrors, setCreateNodeErrors] = useState<{ name?: string }>({});

  // ── Transition modals ────────────────────────────────────────────────────
  const [transitionFlowId, setTransitionFlowId] = useState<string | null>(null);
  const [transitionFromNode, setTransitionFromNode] = useState<Node | null>(null);
  const [transitionForm, setTransitionForm] = useState({ toNodeId: '', newNodeName: '', transitionCode: '' });
  const [transitionFormErrors, setTransitionFormErrors] = useState<Partial<typeof transitionForm>>({});
  const [createNewTransitionNode, setCreateNewTransitionNode] = useState(false);
  const [deleteTransitionTarget, setDeleteTransitionTarget] = useState<string | null>(null);

  // ── Intent modals ────────────────────────────────────────────────────────
  const [createIntentOpen, setCreateIntentOpen] = useState(false);
  const [editIntentTarget, setEditIntentTarget] = useState<Intent | null>(null);
  const [deleteIntentTarget, setDeleteIntentTarget] = useState<Intent | null>(null);
  const [intentForm, setIntentForm] = useState({ name: '', flowId: '' });
  const [intentFormErrors, setIntentFormErrors] = useState<Partial<typeof intentForm>>({});

  // ── API hooks ────────────────────────────────────────────────────────────
  const { data: intents = [] } = useGetIntents();
  const { data: functions = [] } = useGetFunctions();
  const { data: transitionsList = [] } = useGetTransitions(transitionsFlowId ?? '');
  const createFlow = useCreateFlow();
  const updateFlow = useUpdateFlow();
  const deleteFlow = useDeleteFlow();
  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const createTransitionMutation = useCreateTransition(transitionFlowId ?? '');
  const deleteTransitionMutation = useDeleteTransition(transitionFlowId ?? '');
  const createIntent = useCreateIntent();
  const updateIntent = useUpdateIntent();
  const deleteIntent = useDeleteIntent();
  const { showToast } = useToast();

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
  const transitionsFlowNodes = transitionsFlow?.nodes?.map((fn) => fn.node) ?? [];

  // ── Canvas handlers (original) ───────────────────────────────────────────
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
          flow.routerNode.id === nodeId ||
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

  // ── Flow handlers ────────────────────────────────────────────────────────
  const openCreateFlow = useCallback(() => {
    setFlowForm({ name: '', routerNodeId: '', newNodeName: '' });
    setFlowFormErrors({});
    setCreateNewRouterNode(existingNodes.length === 0);
    setCreateFlowOpen(true);
  }, [existingNodes.length]);

  const openEditFlow = useCallback((flow: Flow) => {
    setEditFlowTarget(flow);
    setFlowForm({ name: flow.name, routerNodeId: flow.routerNodeId, newNodeName: '' });
    setFlowFormErrors({});
  }, []);

  const openDeleteFlow = useCallback((flow: Flow) => setDeleteFlowTarget(flow), []);

  const openFlowTransitions = useCallback((flow: Flow) => {
    setTransitionsFlowId(flow.id);
    setTransitionFlowId(flow.id);
    setActivePanel('transitions');
  }, []);

  const handleCreateFlow = async () => {
    const errs: Partial<typeof flowForm> = {};
    if (!flowForm.name.trim()) errs.name = 'El nombre es requerido';
    if (createNewRouterNode && !flowForm.newNodeName.trim()) errs.newNodeName = 'El nombre del nodo es requerido';
    if (!createNewRouterNode && !flowForm.routerNodeId) errs.routerNodeId = 'Selecciona el nodo inicial';
    setFlowFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      let routerNodeId = flowForm.routerNodeId;
      if (createNewRouterNode) {
        const node = await createNode.mutateAsync({ name: flowForm.newNodeName.trim() });
        routerNodeId = node.id;
      }
      await createFlow.mutateAsync({ name: flowForm.name.trim(), routerNodeId });
      showToast('Flujo creado', 'success');
      setCreateFlowOpen(false);
    } catch {
      showToast('Error al crear el flujo', 'error');
    }
  };

  const handleUpdateFlow = async () => {
    if (!editFlowTarget) return;
    if (!flowForm.name.trim()) { setFlowFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateFlow.mutateAsync({ id: editFlowTarget.id, dto: { name: flowForm.name.trim(), routerNodeId: flowForm.routerNodeId || undefined } });
      showToast('Flujo actualizado', 'success');
      setEditFlowTarget(null);
    } catch {
      showToast('Error al actualizar el flujo', 'error');
    }
  };

  const handleDeleteFlow = async () => {
    if (!deleteFlowTarget) return;
    try {
      await deleteFlow.mutateAsync(deleteFlowTarget.id);
      showToast('Flujo eliminado', 'success');
    } catch {
      showToast('Error al eliminar el flujo', 'error');
    } finally {
      setDeleteFlowTarget(null);
    }
  };

  // ── Node handlers ────────────────────────────────────────────────────────
  const parseJsonArr = (val: string | null): string[] => {
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  const openEditNode = useCallback((node: Node) => {
    setEditNodeTarget(node);
    setNodeForm({ name: node.name, systemPrompt: node.systemPrompt ?? '', tools: node.tools, preCode: parseJsonArr(node.preCode), postCode: parseJsonArr(node.postCode), onError: node.onError });
    setNodeFormErrors({});
  }, []);

  const handleUpdateNode = async () => {
    if (!editNodeTarget) return;
    if (!nodeForm.name.trim()) { setNodeFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateNode.mutateAsync({ id: editNodeTarget.id, dto: { name: nodeForm.name.trim(), systemPrompt: nodeForm.systemPrompt || undefined, tools: nodeForm.tools, preCode: nodeForm.preCode.length ? JSON.stringify(nodeForm.preCode) : undefined, postCode: nodeForm.postCode.length ? JSON.stringify(nodeForm.postCode) : undefined, onError: nodeForm.onError as OnErrorStrategy } });
      showToast('Nodo actualizado', 'success');
      setEditNodeTarget(null);
    } catch {
      showToast('Error al actualizar el nodo', 'error');
    }
  };

  const handleCreateNodeFromPanel = async () => {
    if (!createNodeForm.name.trim()) { setCreateNodeErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await createNode.mutateAsync({ name: createNodeForm.name.trim(), systemPrompt: createNodeForm.systemPrompt || undefined, tools: createNodeForm.tools.length ? createNodeForm.tools : undefined, preCode: createNodeForm.preCode.length ? JSON.stringify(createNodeForm.preCode) : undefined, postCode: createNodeForm.postCode.length ? JSON.stringify(createNodeForm.postCode) : undefined, onError: createNodeForm.onError as OnErrorStrategy });
      showToast('Nodo creado', 'success');
      setCreateNodeOpen(false);
      setCreateNodeForm({ name: '', systemPrompt: '', tools: [], preCode: [], postCode: [], onError: 'hitl' });
    } catch {
      showToast('Error al crear el nodo', 'error');
    }
  };

  // ── Transition handlers ──────────────────────────────────────────────────
  const openAddTransition = useCallback((flowId: string, fromNode: Node) => {
    setTransitionFlowId(flowId);
    setTransitionFromNode(fromNode);
    setTransitionForm({ toNodeId: '', newNodeName: '', transitionCode: '' });
    setTransitionFormErrors({});
    setCreateNewTransitionNode(false);
  }, []);

  const handleCreateTransition = async () => {
    if (!transitionFromNode || !transitionFlowId) return;
    const errs: Partial<typeof transitionForm> = {};
    if (!transitionForm.transitionCode.trim()) errs.transitionCode = 'El código es requerido';
    if (createNewTransitionNode && !transitionForm.newNodeName.trim()) errs.newNodeName = 'El nombre del nodo es requerido';
    if (!createNewTransitionNode && !transitionForm.toNodeId) errs.toNodeId = 'Selecciona el nodo destino';
    setTransitionFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      let toNodeId = transitionForm.toNodeId;
      if (createNewTransitionNode) {
        const newNode = await createNode.mutateAsync({ name: transitionForm.newNodeName.trim() });
        toNodeId = newNode.id;
      }
      await createTransitionMutation.mutateAsync({ fromNodeId: transitionFromNode.id, toNodeId, transitionCode: transitionForm.transitionCode.trim() });
      showToast('Transición creada', 'success');
      setTransitionFromNode(null);
    } catch {
      showToast('Error al crear la transición', 'error');
    }
  };

  // ── Intent handlers ──────────────────────────────────────────────────────
  const openCreateIntent = () => { setIntentForm({ name: '', flowId: '' }); setIntentFormErrors({}); setCreateIntentOpen(true); };
  const openEditIntent = (intent: Intent) => { setEditIntentTarget(intent); setIntentForm({ name: intent.name, flowId: intent.flowId ?? '' }); setIntentFormErrors({}); };

  const handleCreateIntent = async () => {
    if (!intentForm.name.trim()) { setIntentFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await createIntent.mutateAsync({ name: intentForm.name.trim(), flowId: intentForm.flowId || undefined });
      showToast('Intent creado', 'success');
      setCreateIntentOpen(false);
    } catch { showToast('Error al crear el intent', 'error'); }
  };

  const handleUpdateIntent = async () => {
    if (!editIntentTarget) return;
    if (!intentForm.name.trim()) { setIntentFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateIntent.mutateAsync({ id: editIntentTarget.id, dto: { name: intentForm.name.trim(), flowId: intentForm.flowId || undefined } });
      showToast('Intent actualizado', 'success');
      setEditIntentTarget(null);
    } catch { showToast('Error al actualizar el intent', 'error'); }
  };

  const handleDeleteIntent = async () => {
    if (!deleteIntentTarget) return;
    try {
      await deleteIntent.mutateAsync(deleteIntentTarget.id);
      showToast('Intent eliminado', 'success');
    } catch { showToast('Error al eliminar el intent', 'error'); }
    finally { setDeleteIntentTarget(null); }
  };

  // ── Layout ───────────────────────────────────────────────────────────────
  const { nodes, edges } = useFlowCanvasLayout({
    flows,
    expandedFlowIds,
    activeSessions,
    highlightedNodeId,
    onToggleExpand: handleToggleExpand,
    onSelectNode: handleSelectNode,
    onCreateFlow: openCreateFlow,
    onEditFlow: openEditFlow,
    onDeleteFlow: openDeleteFlow,
    onFlowTransitions: openFlowTransitions,
    onEditNode: openEditNode,
    onAddTransition: openAddTransition,
  });

  const onErrorOptions = [
    { value: 'hitl', label: 'HITL' },
    { value: 'retry', label: 'Retry' },
    { value: 'ignore', label: 'Ignore' },
  ];
  const flowOptions = [{ value: '', label: 'Ninguno' }, ...flows.map((f) => ({ value: f.id, label: f.name }))];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100vh-180px)]">

      {/* Toolbar top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setActivePanel(activePanel === 'nodes' ? null : 'nodes')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${activePanel === 'nodes' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'}`}
        >
          <List size={16} /> Nodos
        </button>
        <button
          onClick={() => setActivePanel(activePanel === 'intents' ? null : 'intents')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${activePanel === 'intents' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'}`}
        >
          <Tag size={16} /> Intents
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

      {/* Detail panel (original) */}
      {selectedNode && !showTestPanel && activePanel === null && (
        <NodeDetailPanel
          node={selectedNode.node}
          isRouter={selectedNode.isRouter}
          activeSessions={activeSessions[selectedNode.node.id] || 0}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Test panel (original) */}
      {showTestPanel && (
        <TestPanel
          onClose={() => { setShowTestPanel(false); setHighlightedNodeId(null); }}
          onNodeHighlight={handleNodeHighlight}
        />
      )}

      {/* Nodes panel */}
      {activePanel === 'nodes' && (
        <div className="absolute right-0 top-0 h-full w-80 bg-bg-secondary border-l border-border-primary z-10 flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-text-primary">Nodos ({existingNodes.length})</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setCreateNodeOpen(true)}><Plus size={14} /> Nuevo</Button>
              <button onClick={() => setActivePanel(null)} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors">
                <X size={16} className="text-text-secondary" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {existingNodes.length === 0 && <p className="text-sm text-text-secondary text-center py-8">No hay nodos.</p>}
            {existingNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm font-medium text-text-primary truncate">{node.name}</p>
                <button onClick={() => openEditNode(node)} className="p-1 rounded hover:bg-bg-secondary transition-colors shrink-0" title="Editar">
                  <Pencil size={14} className="text-text-secondary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intents panel */}
      {activePanel === 'intents' && (
        <div className="absolute right-0 top-0 h-full w-80 bg-bg-secondary border-l border-border-primary z-10 flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-text-primary">Intents ({intents.length})</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openCreateIntent}><Plus size={14} /> Nuevo</Button>
              <button onClick={() => setActivePanel(null)} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors">
                <X size={16} className="text-text-secondary" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {intents.length === 0 && <p className="text-sm text-text-secondary text-center py-8">No hay intents.</p>}
            {intents.map((intent) => (
              <div key={intent.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{intent.name}</p>
                  {intent.flowId && <p className="text-xs text-text-secondary truncate">{flows.find((f) => f.id === intent.flowId)?.name ?? ''}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditIntent(intent)} className="p-1 rounded hover:bg-bg-secondary transition-colors" title="Editar"><Pencil size={13} className="text-text-secondary" /></button>
                  <button onClick={() => setDeleteIntentTarget(intent)} className="p-1 rounded hover:bg-bg-secondary transition-colors" title="Eliminar"><Trash2 size={13} className="text-accent-red" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transitions panel */}
      {activePanel === 'transitions' && transitionsFlow && (
        <div className="absolute right-0 top-0 h-full w-80 bg-bg-secondary border-l border-border-primary z-10 flex flex-col shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Transiciones</h3>
              <p className="text-xs text-text-secondary">{transitionsFlow.name}</p>
            </div>
            <button onClick={() => setActivePanel(null)} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors">
              <X size={16} className="text-text-secondary" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {transitionsList.length === 0 && <p className="text-sm text-text-secondary text-center py-8">No hay transiciones.</p>}
            {transitionsList.map((t) => {
              const fromNode = transitionsFlowNodes.find((n) => n.id === t.fromNodeId);
              const toNode = transitionsFlowNodes.find((n) => n.id === t.toNodeId);
              return (
                <div key={t.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary">{fromNode?.name ?? t.fromNodeId} → {toNode?.name ?? t.toNodeId}</p>
                    <p className="text-sm font-medium text-text-primary truncate">{t.transitionCode}</p>
                  </div>
                  <button onClick={() => setDeleteTransitionTarget(t.id)} className="p-1 rounded hover:bg-bg-secondary transition-colors shrink-0" title="Eliminar">
                    <Trash2 size={13} className="text-accent-red" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modales ── */}

      {/* Create flow */}
      <Modal isOpen={createFlowOpen} onClose={() => setCreateFlowOpen(false)} size="sm">
        <ModalHeader onClose={() => setCreateFlowOpen(false)}><ModalTitle>Nuevo flujo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre del flujo" required error={flowFormErrors.name}>
              <Input placeholder="Ej: Atención al cliente" value={flowForm.name} onChange={(e) => setFlowForm(f => ({ ...f, name: e.target.value }))} error={!!flowFormErrors.name} />
            </FormField>
            {existingNodes.length > 0 && (
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => setCreateNewRouterNode(false)} className={`px-3 py-1 rounded-md border transition-colors ${!createNewRouterNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo existente</button>
                <button type="button" onClick={() => setCreateNewRouterNode(true)} className={`px-3 py-1 rounded-md border transition-colors ${createNewRouterNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo nuevo</button>
              </div>
            )}
            {createNewRouterNode ? (
              <FormField label="Nombre del nodo inicial" required error={flowFormErrors.newNodeName}>
                <Input placeholder="Ej: Entrada principal" value={flowForm.newNodeName} onChange={(e) => setFlowForm(f => ({ ...f, newNodeName: e.target.value }))} error={!!flowFormErrors.newNodeName} />
              </FormField>
            ) : (
              <FormField label="Nodo inicial" required error={flowFormErrors.routerNodeId}>
                <Select value={flowForm.routerNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => setFlowForm(f => ({ ...f, routerNodeId: val }))} placeholder="Seleccionar nodo..." className="w-full" />
              </FormField>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateFlowOpen(false)} disabled={createFlow.isPending || createNode.isPending}>Cancelar</Button>
          <Button onClick={handleCreateFlow} isLoading={createFlow.isPending || createNode.isPending}>Crear flujo</Button>
        </ModalFooter>
      </Modal>

      {/* Edit flow */}
      <Modal isOpen={!!editFlowTarget} onClose={() => setEditFlowTarget(null)} size="sm">
        <ModalHeader onClose={() => setEditFlowTarget(null)}><ModalTitle>Editar flujo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={flowFormErrors.name}>
              <Input value={flowForm.name} onChange={(e) => setFlowForm(f => ({ ...f, name: e.target.value }))} error={!!flowFormErrors.name} />
            </FormField>
            <FormField label="Nodo inicial" optional>
              <Select value={flowForm.routerNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => setFlowForm(f => ({ ...f, routerNodeId: val }))} placeholder="Sin cambio..." className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditFlowTarget(null)} disabled={updateFlow.isPending}>Cancelar</Button>
          <Button onClick={handleUpdateFlow} isLoading={updateFlow.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      {/* Delete flow */}
      <ConfirmModal isOpen={!!deleteFlowTarget} onClose={() => setDeleteFlowTarget(null)} onConfirm={handleDeleteFlow} title="Eliminar flujo" message={`¿Eliminar el flujo "${deleteFlowTarget?.name}"?`} confirmText="Eliminar" isLoading={deleteFlow.isPending} />

      {/* Edit node */}
      <Modal isOpen={!!editNodeTarget} onClose={() => setEditNodeTarget(null)} size="md">
        <ModalHeader onClose={() => setEditNodeTarget(null)}><ModalTitle>Editar nodo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={nodeFormErrors.name}>
              <Input value={nodeForm.name} onChange={(e) => setNodeForm(f => ({ ...f, name: e.target.value }))} error={!!nodeFormErrors.name} />
            </FormField>
            <FormField label="System Prompt" optional>
              <Textarea rows={4} placeholder="Instrucciones del sistema..." value={nodeForm.systemPrompt} onChange={(e) => setNodeForm(f => ({ ...f, systemPrompt: e.target.value }))} />
            </FormField>
            <FormField label="Tools" optional>
              <MultiSelect
                value={nodeForm.tools}
                options={functions.filter(f => f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setNodeForm(f => ({ ...f, tools: vals }))}
                placeholder="Seleccionar tools..."
              />
            </FormField>
            <FormField label="Pre Code" optional>
              <MultiSelect
                value={nodeForm.preCode}
                options={functions.filter(f => f.type === NodeFunctionType.PreCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setNodeForm(f => ({ ...f, preCode: vals }))}
                placeholder="Seleccionar pre code..."
              />
            </FormField>
            <FormField label="Post Code" optional>
              <MultiSelect
                value={nodeForm.postCode}
                options={functions.filter(f => f.type === NodeFunctionType.PostCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setNodeForm(f => ({ ...f, postCode: vals }))}
                placeholder="Seleccionar post code..."
              />
            </FormField>
            <FormField label="On Error">
              <Select value={nodeForm.onError} options={onErrorOptions} onChange={(val) => setNodeForm(f => ({ ...f, onError: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditNodeTarget(null)} disabled={updateNode.isPending}>Cancelar</Button>
          <Button onClick={handleUpdateNode} isLoading={updateNode.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      {/* Create node */}
      <Modal isOpen={createNodeOpen} onClose={() => setCreateNodeOpen(false)} size="md">
        <ModalHeader onClose={() => setCreateNodeOpen(false)}><ModalTitle>Nuevo nodo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={createNodeErrors.name}>
              <Input placeholder="Ej: Soporte técnico" value={createNodeForm.name} onChange={(e) => setCreateNodeForm(f => ({ ...f, name: e.target.value }))} error={!!createNodeErrors.name} />
            </FormField>
            <FormField label="System Prompt" optional>
              <Textarea rows={4} placeholder="Instrucciones del sistema..." value={createNodeForm.systemPrompt} onChange={(e) => setCreateNodeForm(f => ({ ...f, systemPrompt: e.target.value }))} />
            </FormField>
            <FormField label="Tools" optional>
              <MultiSelect
                value={createNodeForm.tools}
                options={functions.filter(f => f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setCreateNodeForm(f => ({ ...f, tools: vals }))}
                placeholder="Seleccionar tools..."
              />
            </FormField>
            <FormField label="Pre Code" optional>
              <MultiSelect
                value={createNodeForm.preCode}
                options={functions.filter(f => f.type === NodeFunctionType.PreCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setCreateNodeForm(f => ({ ...f, preCode: vals }))}
                placeholder="Seleccionar pre code..."
              />
            </FormField>
            <FormField label="Post Code" optional>
              <MultiSelect
                value={createNodeForm.postCode}
                options={functions.filter(f => f.type === NodeFunctionType.PostCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                onChange={(vals) => setCreateNodeForm(f => ({ ...f, postCode: vals }))}
                placeholder="Seleccionar post code..."
              />
            </FormField>
            <FormField label="On Error">
              <Select value={createNodeForm.onError} options={onErrorOptions} onChange={(val) => setCreateNodeForm(f => ({ ...f, onError: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateNodeOpen(false)} disabled={createNode.isPending}>Cancelar</Button>
          <Button onClick={handleCreateNodeFromPanel} isLoading={createNode.isPending}>Crear nodo</Button>
        </ModalFooter>
      </Modal>

      {/* Add transition */}
      <Modal isOpen={!!transitionFromNode} onClose={() => setTransitionFromNode(null)} size="sm">
        <ModalHeader onClose={() => setTransitionFromNode(null)}><ModalTitle>Nueva transición desde "{transitionFromNode?.name}"</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Código de transición" required error={transitionFormErrors.transitionCode}>
              <Input placeholder="Ej: intent_saludo" value={transitionForm.transitionCode} onChange={(e) => setTransitionForm(f => ({ ...f, transitionCode: e.target.value }))} error={!!transitionFormErrors.transitionCode} />
            </FormField>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => setCreateNewTransitionNode(false)} className={`px-3 py-1 rounded-md border transition-colors ${!createNewTransitionNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo existente</button>
              <button type="button" onClick={() => setCreateNewTransitionNode(true)} className={`px-3 py-1 rounded-md border transition-colors ${createNewTransitionNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo nuevo</button>
            </div>
            {createNewTransitionNode ? (
              <FormField label="Nombre del nodo destino" required error={transitionFormErrors.newNodeName}>
                <Input placeholder="Ej: Soporte técnico" value={transitionForm.newNodeName} onChange={(e) => setTransitionForm(f => ({ ...f, newNodeName: e.target.value }))} error={!!transitionFormErrors.newNodeName} />
              </FormField>
            ) : (
              <FormField label="Nodo destino" required error={transitionFormErrors.toNodeId}>
                <Select value={transitionForm.toNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => setTransitionForm(f => ({ ...f, toNodeId: val }))} placeholder="Seleccionar nodo..." className="w-full" />
              </FormField>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setTransitionFromNode(null)} disabled={createTransitionMutation.isPending || createNode.isPending}>Cancelar</Button>
          <Button onClick={handleCreateTransition} isLoading={createTransitionMutation.isPending || createNode.isPending}>Crear transición</Button>
        </ModalFooter>
      </Modal>

      {/* Delete transition */}
      <ConfirmModal
        isOpen={!!deleteTransitionTarget}
        onClose={() => setDeleteTransitionTarget(null)}
        onConfirm={async () => {
          if (!deleteTransitionTarget) return;
          try {
            await deleteTransitionMutation.mutateAsync(deleteTransitionTarget);
            showToast('Transición eliminada', 'success');
          } catch { showToast('Error al eliminar', 'error'); }
          finally { setDeleteTransitionTarget(null); }
        }}
        title="Eliminar transición"
        message="¿Eliminar esta transición?"
        confirmText="Eliminar"
        isLoading={deleteTransitionMutation.isPending}
      />

      {/* Create intent */}
      <Modal isOpen={createIntentOpen} onClose={() => setCreateIntentOpen(false)} size="sm">
        <ModalHeader onClose={() => setCreateIntentOpen(false)}><ModalTitle>Nuevo intent</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={intentFormErrors.name}>
              <Input placeholder="Ej: saludo" value={intentForm.name} onChange={(e) => setIntentForm(f => ({ ...f, name: e.target.value }))} error={!!intentFormErrors.name} />
            </FormField>
            <FormField label="Flujo asociado" optional>
              <Select value={intentForm.flowId} options={flowOptions} onChange={(val) => setIntentForm(f => ({ ...f, flowId: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateIntentOpen(false)} disabled={createIntent.isPending}>Cancelar</Button>
          <Button onClick={handleCreateIntent} isLoading={createIntent.isPending}>Crear</Button>
        </ModalFooter>
      </Modal>

      {/* Edit intent */}
      <Modal isOpen={!!editIntentTarget} onClose={() => setEditIntentTarget(null)} size="sm">
        <ModalHeader onClose={() => setEditIntentTarget(null)}><ModalTitle>Editar intent</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={intentFormErrors.name}>
              <Input value={intentForm.name} onChange={(e) => setIntentForm(f => ({ ...f, name: e.target.value }))} error={!!intentFormErrors.name} />
            </FormField>
            <FormField label="Flujo asociado" optional>
              <Select value={intentForm.flowId} options={flowOptions} onChange={(val) => setIntentForm(f => ({ ...f, flowId: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditIntentTarget(null)} disabled={updateIntent.isPending}>Cancelar</Button>
          <Button onClick={handleUpdateIntent} isLoading={updateIntent.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      {/* Delete intent */}
      <ConfirmModal isOpen={!!deleteIntentTarget} onClose={() => setDeleteIntentTarget(null)} onConfirm={handleDeleteIntent} title="Eliminar intent" message={`¿Eliminar el intent "${deleteIntentTarget?.name}"?`} confirmText="Eliminar" isLoading={deleteIntent.isPending} />
    </div>
  );
};
