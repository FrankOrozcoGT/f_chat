import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, useReactFlow, useNodes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlaskConical, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { GlobalRouterNode } from './nodes/GlobalRouterNode';
import { FlowGroupNode } from './nodes/FlowGroupNode';
import { ProcessNode } from './nodes/ProcessNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import { TestPanel } from './TestPanel';
import { ToolsPanel } from './ToolsPanel';
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
import type { Flow, Node, ActiveSessionsResponse, Intent, OnErrorStrategy, PreCodeItem, NodeTodo, NodeFunction } from '../types';
import { preCodeItemCode } from '../types';

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
  const [nodeForm, setNodeForm] = useState({ name: '', systemPrompt: '', tools: [] as string[], preCode: [] as PreCodeItem[], postCode: [] as PreCodeItem[], todos: [] as NodeTodo[], onError: 'hitl' });
  const [nodeFormErrors, setNodeFormErrors] = useState<{ name?: string }>({});
  const [nodeFormTab, setNodeFormTab] = useState<'general' | 'precode' | 'todos' | 'tools' | 'postcode'>('general');

  // ── Create node (panel) ──────────────────────────────────────────────────
  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [createNodeForm, setCreateNodeForm] = useState({ name: '', systemPrompt: '', tools: [] as string[], preCode: [] as PreCodeItem[], postCode: [] as PreCodeItem[], todos: [] as NodeTodo[], onError: 'hitl' });
  const [createNodeErrors, setCreateNodeErrors] = useState<{ name?: string }>({});
  const [createNodeTab, setCreateNodeTab] = useState<'general' | 'precode' | 'todos' | 'tools' | 'postcode'>('general');

  // ── PreCode args modal ───────────────────────────────────────────────────
  type ArgsModalCtx = { field: 'preCode' | 'postCode'; form: 'edit' | 'create'; code: string };
  const [argsModal, setArgsModal] = useState<ArgsModalCtx | null>(null);
  // argsValues: un valor por parámetro. Arrays = string[], strings = string
  const [argsValues, setArgsValues] = useState<Record<string, unknown>>({});
  // argsArrayInputs: input temporal por cada parámetro array
  const [argsArrayInputs, setArgsArrayInputs] = useState<Record<string, string>>({});

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
    setActivePanel('tools');
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
  const parseJsonArr = (val: string | null): PreCodeItem[] => {
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  // Una función necesita args si tiene toolDefinition con parámetros requeridos
  const fnHasArgs = (code: string) => {
    const fn = functions.find((f: NodeFunction) => f.code === code);
    return !!fn?.toolDefinition?.function?.parameters?.required?.length;
  };

  const openArgsModal = (field: 'preCode' | 'postCode', form: 'edit' | 'create', code: string) => {
    const items = form === 'edit' ? nodeForm[field] : createNodeForm[field];
    const existing = items.find((i) => preCodeItemCode(i) === code);
    const existingArgs = existing && typeof existing === 'object' ? (existing as { code: string; args: Record<string, unknown> }).args : {};
    setArgsModal({ field, form, code });
    setArgsValues(existingArgs ?? {});
    setArgsArrayInputs({});
  };

  const saveArgsModal = () => {
    if (!argsModal) return;
    const { field, form, code } = argsModal;
    const updatedItem: PreCodeItem = { code, args: argsValues };
    const applyUpdate = (f: typeof nodeForm) => ({
      ...f,
      [field]: (f[field] as PreCodeItem[]).map((i) => preCodeItemCode(i) === code ? updatedItem : i),
    });
    if (form === 'edit') setNodeForm(applyUpdate);
    else setCreateNodeForm(applyUpdate);
    setArgsModal(null);
  };

  // Al seleccionar en el MultiSelect, si la función requiere args abre el modal automáticamente
  const handlePreCodeChange = (field: 'preCode' | 'postCode', form: 'edit' | 'create', newCodes: string[]) => {
    const currentItems: PreCodeItem[] = form === 'edit' ? nodeForm[field] : createNodeForm[field];
    const currentCodes = currentItems.map(preCodeItemCode);
    const added = newCodes.find((c) => !currentCodes.includes(c));

    // Construir nueva lista preservando items con args existentes
    const newItems: PreCodeItem[] = newCodes.map((code) => {
      const existing = currentItems.find((i) => preCodeItemCode(i) === code);
      if (existing) return existing;
      // nuevo item: si necesita args, lo creamos como objeto vacío; si no, string
      return fnHasArgs(code) ? { code, args: {} } : code;
    });

    const setter = form === 'edit' ? setNodeForm : setCreateNodeForm;
    setter((f) => ({ ...f, [field]: newItems }));

    // Si el item recién agregado requiere args, abrir modal
    if (added && fnHasArgs(added)) {
      openArgsModal(field, form, added);
    }
  };

  const openEditNode = useCallback((node: Node) => {
    setEditNodeTarget(node);
    setNodeForm({ name: node.name, systemPrompt: node.systemPrompt ?? '', tools: node.tools, preCode: parseJsonArr(node.preCode), postCode: parseJsonArr(node.postCode), todos: node.todos ?? [], onError: node.onError });
    setNodeFormErrors({});
    setNodeFormTab('general');
  }, []);

  const handleUpdateNode = async () => {
    if (!editNodeTarget) return;
    if (!nodeForm.name.trim()) { setNodeFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateNode.mutateAsync({ id: editNodeTarget.id, dto: { name: nodeForm.name.trim(), systemPrompt: nodeForm.systemPrompt || undefined, tools: nodeForm.tools, preCode: nodeForm.preCode.length ? JSON.stringify(nodeForm.preCode) : undefined, postCode: nodeForm.postCode.length ? JSON.stringify(nodeForm.postCode) : undefined, todos: nodeForm.todos.length ? nodeForm.todos : undefined, onError: nodeForm.onError as OnErrorStrategy } });
      showToast('Nodo actualizado', 'success');
      setEditNodeTarget(null);
    } catch {
      showToast('Error al actualizar el nodo', 'error');
    }
  };

  const handleCreateNodeFromPanel = async () => {
    if (!createNodeForm.name.trim()) { setCreateNodeErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await createNode.mutateAsync({ name: createNodeForm.name.trim(), systemPrompt: createNodeForm.systemPrompt || undefined, tools: createNodeForm.tools.length ? createNodeForm.tools : undefined, preCode: createNodeForm.preCode.length ? JSON.stringify(createNodeForm.preCode) : undefined, postCode: createNodeForm.postCode.length ? JSON.stringify(createNodeForm.postCode) : undefined, todos: createNodeForm.todos.length ? createNodeForm.todos : undefined, onError: createNodeForm.onError as OnErrorStrategy });
      showToast('Nodo creado', 'success');
      setCreateNodeOpen(false);
      setCreateNodeForm({ name: '', systemPrompt: '', tools: [], preCode: [], postCode: [], todos: [], onError: 'hitl' });
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

      {/* Tools panel */}
      {activePanel === 'tools' && (
        <ToolsPanel
          onClose={() => setActivePanel(null)}
          existingNodes={existingNodes}
          onEditNode={openEditNode}
          onCreateNode={() => { setCreateNodeOpen(true); setCreateNodeTab('general'); }}
          intents={intents}
          flows={flows}
          onCreateIntent={openCreateIntent}
          onEditIntent={openEditIntent}
          onDeleteIntent={(intent) => setDeleteIntentTarget(intent)}
          transitionsFlow={transitionsFlow}
          transitionsList={transitionsList}
          onDeleteTransition={(id) => setDeleteTransitionTarget(id)}
        />
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
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border-primary">
            {(['general', 'precode', 'todos', 'tools', 'postcode'] as const).map((tab) => {
              const labels = { general: 'General', precode: 'Pre Code', todos: `Todos${nodeForm.todos.length ? ` (${nodeForm.todos.length})` : ''}`, tools: 'Tools', postcode: 'Post Code' };
              return (
                <button key={tab} type="button" onClick={() => setNodeFormTab(tab)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${nodeFormTab === tab ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                  {labels[tab]}
                </button>
              );
            })}
          </div>
          <div className="space-y-4">
            {nodeFormTab === 'general' && <>
              <FormField label="Nombre" required error={nodeFormErrors.name}>
                <Input value={nodeForm.name} onChange={(e) => setNodeForm(f => ({ ...f, name: e.target.value }))} error={!!nodeFormErrors.name} />
              </FormField>
              <FormField label="System Prompt" optional>
                <Textarea rows={8} placeholder="Instrucciones del sistema..." value={nodeForm.systemPrompt} onChange={(e) => setNodeForm(f => ({ ...f, systemPrompt: e.target.value }))} />
              </FormField>
              <FormField label="On Error">
                <Select value={nodeForm.onError} options={onErrorOptions} onChange={(val) => setNodeForm(f => ({ ...f, onError: val }))} className="w-full" />
              </FormField>
            </>}
            {nodeFormTab === 'precode' && <>
              <FormField label="Pre Code" optional>
                <MultiSelect
                  value={nodeForm.preCode.map(preCodeItemCode)}
                  options={functions.filter(f => f.type === NodeFunctionType.PreCode || f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => handlePreCodeChange('preCode', 'edit', vals)}
                  placeholder="Seleccionar pre code..."
                />
                {nodeForm.preCode.filter(i => typeof i === 'object').map((item) => {
                  const obj = item as { code: string; args: Record<string, unknown> };
                  const preview = Object.values(obj.args).flat().filter(Boolean).join(', ');
                  return (
                    <div key={obj.code} className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-bg-tertiary rounded-md text-xs text-text-secondary">
                      <SlidersHorizontal size={11} className="shrink-0 text-accent-purple" />
                      <span className="font-medium text-text-primary">{obj.code}</span>
                      <span className="text-text-tertiary truncate">{preview || '(sin args)'}</span>
                      <button type="button" onClick={() => openArgsModal('preCode', 'edit', obj.code)} className="ml-auto text-accent-blue hover:opacity-70 transition-opacity shrink-0">Editar</button>
                    </div>
                  );
                })}
              </FormField>
            </>}
            {nodeFormTab === 'todos' && <>
              <div className="space-y-2">
                {nodeForm.todos.map((todo, idx) => (
                  <div key={todo.id} className="border border-border-primary rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Nombre del todo" value={todo.name}
                        onChange={(e) => setNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, name: e.target.value } : t) }))} />
                      <button type="button" onClick={() => setNodeForm(f => ({ ...f, todos: f.todos.filter((_, i) => i !== idx) }))} className="p-1.5 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <Textarea rows={2} placeholder="Descripción..." value={todo.description ?? ''}
                      onChange={(e) => setNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, description: e.target.value } : t) }))} />
                    <MultiSelect
                      value={todo.functions}
                      options={nodeForm.tools.map(code => { const fn = functions.find((f: NodeFunction) => f.code === code); return { value: code, label: fn?.name ?? code }; })}
                      onChange={(vals) => setNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, functions: vals } : t) }))}
                      placeholder="Tools de este todo..."
                    />
                  </div>
                ))}
                <Button variant="secondary" onClick={() => setNodeForm(f => ({ ...f, todos: [...f.todos, { id: crypto.randomUUID(), name: '', description: '', functions: [] }] }))}>
                  + Agregar todo
                </Button>
              </div>
            </>}
            {nodeFormTab === 'tools' && <>
              <FormField label="Tools" optional>
                <MultiSelect
                  value={nodeForm.tools}
                  options={functions.filter(f => f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => setNodeForm(f => ({ ...f, tools: vals }))}
                  placeholder="Seleccionar tools..."
                />
              </FormField>
            </>}
            {nodeFormTab === 'postcode' && <>
              <FormField label="Post Code" optional>
                <MultiSelect
                  value={nodeForm.postCode.map(preCodeItemCode)}
                  options={functions.filter(f => f.type === NodeFunctionType.PostCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => handlePreCodeChange('postCode', 'edit', vals)}
                  placeholder="Seleccionar post code..."
                />
                {nodeForm.postCode.filter(i => typeof i === 'object').map((item) => {
                  const obj = item as { code: string; args: Record<string, unknown> };
                  const preview = Object.values(obj.args).flat().filter(Boolean).join(', ');
                  return (
                    <div key={obj.code} className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-bg-tertiary rounded-md text-xs text-text-secondary">
                      <SlidersHorizontal size={11} className="shrink-0 text-accent-purple" />
                      <span className="font-medium text-text-primary">{obj.code}</span>
                      <span className="text-text-tertiary truncate">{preview || '(sin args)'}</span>
                      <button type="button" onClick={() => openArgsModal('postCode', 'edit', obj.code)} className="ml-auto text-accent-blue hover:opacity-70 transition-opacity shrink-0">Editar</button>
                    </div>
                  );
                })}
              </FormField>
            </>}
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
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border-primary">
            {(['general', 'precode', 'todos', 'tools', 'postcode'] as const).map((tab) => {
              const labels = { general: 'General', precode: 'Pre Code', todos: `Todos${createNodeForm.todos.length ? ` (${createNodeForm.todos.length})` : ''}`, tools: 'Tools', postcode: 'Post Code' };
              return (
                <button key={tab} type="button" onClick={() => setCreateNodeTab(tab)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${createNodeTab === tab ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                  {labels[tab]}
                </button>
              );
            })}
          </div>
          <div className="space-y-4">
            {createNodeTab === 'general' && <>
              <FormField label="Nombre" required error={createNodeErrors.name}>
                <Input placeholder="Ej: Soporte técnico" value={createNodeForm.name} onChange={(e) => setCreateNodeForm(f => ({ ...f, name: e.target.value }))} error={!!createNodeErrors.name} />
              </FormField>
              <FormField label="System Prompt" optional>
                <Textarea rows={8} placeholder="Instrucciones del sistema..." value={createNodeForm.systemPrompt} onChange={(e) => setCreateNodeForm(f => ({ ...f, systemPrompt: e.target.value }))} />
              </FormField>
              <FormField label="On Error">
                <Select value={createNodeForm.onError} options={onErrorOptions} onChange={(val) => setCreateNodeForm(f => ({ ...f, onError: val }))} className="w-full" />
              </FormField>
            </>}
            {createNodeTab === 'precode' && <>
              <FormField label="Pre Code" optional>
                <MultiSelect
                  value={createNodeForm.preCode.map(preCodeItemCode)}
                  options={functions.filter(f => f.type === NodeFunctionType.PreCode || f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => handlePreCodeChange('preCode', 'create', vals)}
                  placeholder="Seleccionar pre code..."
                />
                {createNodeForm.preCode.filter(i => typeof i === 'object').map((item) => {
                  const obj = item as { code: string; args: Record<string, unknown> };
                  const preview = Object.values(obj.args).flat().filter(Boolean).join(', ');
                  return (
                    <div key={obj.code} className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-bg-tertiary rounded-md text-xs text-text-secondary">
                      <SlidersHorizontal size={11} className="shrink-0 text-accent-purple" />
                      <span className="font-medium text-text-primary">{obj.code}</span>
                      <span className="text-text-tertiary truncate">{preview || '(sin args)'}</span>
                      <button type="button" onClick={() => openArgsModal('preCode', 'create', obj.code)} className="ml-auto text-accent-blue hover:opacity-70 transition-opacity shrink-0">Editar</button>
                    </div>
                  );
                })}
              </FormField>
            </>}
            {createNodeTab === 'todos' && <>
              <div className="space-y-2">
                {createNodeForm.todos.map((todo, idx) => (
                  <div key={todo.id} className="border border-border-primary rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Nombre del todo" value={todo.name}
                        onChange={(e) => setCreateNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, name: e.target.value } : t) }))} />
                      <button type="button" onClick={() => setCreateNodeForm(f => ({ ...f, todos: f.todos.filter((_, i) => i !== idx) }))} className="p-1.5 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <Textarea rows={2} placeholder="Descripción..." value={todo.description ?? ''}
                      onChange={(e) => setCreateNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, description: e.target.value } : t) }))} />
                    <MultiSelect
                      value={todo.functions}
                      options={createNodeForm.tools.map(code => { const fn = functions.find((f: NodeFunction) => f.code === code); return { value: code, label: fn?.name ?? code }; })}
                      onChange={(vals) => setCreateNodeForm(f => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, functions: vals } : t) }))}
                      placeholder="Tools de este todo..."
                    />
                  </div>
                ))}
                <Button variant="secondary" onClick={() => setCreateNodeForm(f => ({ ...f, todos: [...f.todos, { id: crypto.randomUUID(), name: '', description: '', functions: [] }] }))}>
                  + Agregar todo
                </Button>
              </div>
            </>}
            {createNodeTab === 'tools' && <>
              <FormField label="Tools" optional>
                <MultiSelect
                  value={createNodeForm.tools}
                  options={functions.filter(f => f.type === NodeFunctionType.Tool).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => setCreateNodeForm(f => ({ ...f, tools: vals }))}
                  placeholder="Seleccionar tools..."
                />
              </FormField>
            </>}
            {createNodeTab === 'postcode' && <>
              <FormField label="Post Code" optional>
                <MultiSelect
                  value={createNodeForm.postCode.map(preCodeItemCode)}
                  options={functions.filter(f => f.type === NodeFunctionType.PostCode).map(f => ({ value: f.code, label: f.name, sublabel: f.description }))}
                  onChange={(vals) => handlePreCodeChange('postCode', 'create', vals)}
                  placeholder="Seleccionar post code..."
                />
                {createNodeForm.postCode.filter(i => typeof i === 'object').map((item) => {
                  const obj = item as { code: string; args: Record<string, unknown> };
                  const preview = Object.values(obj.args).flat().filter(Boolean).join(', ');
                  return (
                    <div key={obj.code} className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-bg-tertiary rounded-md text-xs text-text-secondary">
                      <SlidersHorizontal size={11} className="shrink-0 text-accent-purple" />
                      <span className="font-medium text-text-primary">{obj.code}</span>
                      <span className="text-text-tertiary truncate">{preview || '(sin args)'}</span>
                      <button type="button" onClick={() => openArgsModal('postCode', 'create', obj.code)} className="ml-auto text-accent-blue hover:opacity-70 transition-opacity shrink-0">Editar</button>
                    </div>
                  );
                })}
              </FormField>
            </>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateNodeOpen(false)} disabled={createNode.isPending}>Cancelar</Button>
          <Button onClick={handleCreateNodeFromPanel} isLoading={createNode.isPending}>Crear nodo</Button>
        </ModalFooter>
      </Modal>

      {/* Args modal — configurar parámetros dinámicos de funciones */}
      <Modal isOpen={!!argsModal} onClose={() => setArgsModal(null)} size="sm">
        <ModalHeader onClose={() => setArgsModal(null)}>
          <ModalTitle>Configurar {argsModal?.code}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {argsModal && (() => {
              const fn = functions.find((f: NodeFunction) => f.code === argsModal.code);
              const params = fn?.toolDefinition?.function?.parameters?.properties ?? {};
              const required = fn?.toolDefinition?.function?.parameters?.required ?? [];
              return Object.entries(params).map(([paramName, param]) => {
                const isArray = param.type === 'array';
                const currentArr = (argsValues[paramName] as string[] | undefined) ?? [];
                const currentStr = (argsValues[paramName] as string | undefined) ?? '';
                const inputVal = argsArrayInputs[paramName] ?? '';
                return (
                  <FormField key={paramName} label={paramName} optional={!required.includes(paramName)}>
                    {param.description && <p className="text-xs text-text-tertiary mb-1.5">{param.description}</p>}
                    {isArray ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ej: banking_info.banrural.cuenta"
                            value={inputVal}
                            onChange={(e) => setArgsArrayInputs((prev) => ({ ...prev, [paramName]: e.target.value.toLowerCase() }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = inputVal.trim();
                                if (v && !currentArr.includes(v)) {
                                  setArgsValues((prev) => ({ ...prev, [paramName]: [...currentArr, v] }));
                                  setArgsArrayInputs((prev) => ({ ...prev, [paramName]: '' }));
                                }
                              }
                            }}
                          />
                          <Button variant="secondary" onClick={() => {
                            const v = inputVal.trim();
                            if (v && !currentArr.includes(v)) {
                              setArgsValues((prev) => ({ ...prev, [paramName]: [...currentArr, v] }));
                              setArgsArrayInputs((prev) => ({ ...prev, [paramName]: '' }));
                            }
                          }}>Agregar</Button>
                        </div>
                        {currentArr.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {currentArr.map((item: string) => (
                              <span key={item} className="flex items-center gap-1 px-2 py-0.5 bg-accent-purple/15 text-accent-purple text-xs font-medium rounded-md">
                                {item}
                                <button type="button" onClick={() => setArgsValues((prev) => ({ ...prev, [paramName]: currentArr.filter((x: string) => x !== item) }))} className="hover:opacity-60 transition-opacity">
                                  <X size={10} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={currentStr}
                        onChange={(e) => setArgsValues((prev) => ({ ...prev, [paramName]: e.target.value }))}
                      />
                    )}
                  </FormField>
                );
              });
            })()}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setArgsModal(null)}>Cancelar</Button>
          <Button onClick={saveArgsModal}>Guardar</Button>
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
