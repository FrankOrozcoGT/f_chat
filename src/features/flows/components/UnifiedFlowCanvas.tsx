import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlow, useReactFlow, useNodes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlaskConical, Settings2 } from 'lucide-react';
import { GlobalRouterNode } from './nodes/GlobalRouterNode';
import { FlowGroupNode } from './nodes/FlowGroupNode';
import { ProcessNode } from './nodes/ProcessNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import { TestPanel } from './TestPanel';
import { ToolsPanel } from './ToolsPanel';
import { NodeFormFields } from './NodeFormFields';
import { NodeArgsModal } from './NodeArgsModal';
import { useFlowCanvasLayout } from './useFlowCanvasLayout';
import { useGetTransitions } from '../api/useGetTransitions';
import { useGetIntents } from '../api/useGetIntents';
import { useGetFunctions } from '../api/useGetFunctions';
import { useFlowCrud } from '../hooks/useFlowCrud';
import { useNodeCrud } from '../hooks/useNodeCrud';
import { useTransitionCrud } from '../hooks/useTransitionCrud';
import { useIntentCrud } from '../hooks/useIntentCrud';
import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FlowHistoryModal } from './FlowHistoryModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import type { Flow, Node, ActiveSessionsResponse } from '../types';

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

      {/* ── Modales: Flow ── */}

      <Modal isOpen={flowCrud.createFlowOpen} onClose={() => flowCrud.setCreateFlowOpen(false)} size="sm">
        <ModalHeader onClose={() => flowCrud.setCreateFlowOpen(false)}><ModalTitle>Nuevo flujo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre del flujo" required error={flowCrud.flowFormErrors.name}>
              <Input placeholder="Ej: Atención al cliente" value={flowCrud.flowForm.name} onChange={(e) => flowCrud.setFlowForm(f => ({ ...f, name: e.target.value }))} error={!!flowCrud.flowFormErrors.name} />
            </FormField>
            {existingNodes.length > 0 && (
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => flowCrud.setCreateNewRouterNode(false)} className={`px-3 py-1 rounded-md border transition-colors ${!flowCrud.createNewRouterNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo existente</button>
                <button type="button" onClick={() => flowCrud.setCreateNewRouterNode(true)} className={`px-3 py-1 rounded-md border transition-colors ${flowCrud.createNewRouterNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo nuevo</button>
              </div>
            )}
            {flowCrud.createNewRouterNode ? (
              <FormField label="Nombre del nodo inicial" required error={flowCrud.flowFormErrors.newNodeName}>
                <Input placeholder="Ej: Entrada principal" value={flowCrud.flowForm.newNodeName} onChange={(e) => flowCrud.setFlowForm(f => ({ ...f, newNodeName: e.target.value }))} error={!!flowCrud.flowFormErrors.newNodeName} />
              </FormField>
            ) : (
              <FormField label="Nodo inicial" required error={flowCrud.flowFormErrors.routerNodeId}>
                <Select value={flowCrud.flowForm.routerNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => flowCrud.setFlowForm(f => ({ ...f, routerNodeId: val }))} placeholder="Seleccionar nodo..." className="w-full" />
              </FormField>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => flowCrud.setCreateFlowOpen(false)} disabled={flowCrud.createFlow.isPending || flowCrud.createNode.isPending}>Cancelar</Button>
          <Button onClick={flowCrud.handleCreateFlow} isLoading={flowCrud.createFlow.isPending || flowCrud.createNode.isPending}>Crear flujo</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!flowCrud.editFlowTarget} onClose={() => flowCrud.setEditFlowTarget(null)} size="sm">
        <ModalHeader onClose={() => flowCrud.setEditFlowTarget(null)}><ModalTitle>Editar flujo</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={flowCrud.flowFormErrors.name}>
              <Input value={flowCrud.flowForm.name} onChange={(e) => flowCrud.setFlowForm(f => ({ ...f, name: e.target.value }))} error={!!flowCrud.flowFormErrors.name} />
            </FormField>
            <FormField label="Nodo inicial" optional>
              <Select value={flowCrud.flowForm.routerNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => flowCrud.setFlowForm(f => ({ ...f, routerNodeId: val }))} placeholder="Sin cambio..." className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => flowCrud.setEditFlowTarget(null)} disabled={flowCrud.updateFlow.isPending}>Cancelar</Button>
          <Button onClick={flowCrud.handleUpdateFlow} isLoading={flowCrud.updateFlow.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!flowCrud.deleteFlowTarget} onClose={() => flowCrud.setDeleteFlowTarget(null)} onConfirm={flowCrud.handleDeleteFlow} title="Eliminar flujo" message={`¿Eliminar el flujo "${flowCrud.deleteFlowTarget?.name}"?`} confirmText="Eliminar" isLoading={flowCrud.deleteFlow.isPending} />

      {/* ── Modales: Node ── */}

      <Modal isOpen={!!nodeCrud.editNodeTarget} onClose={() => nodeCrud.setEditNodeTarget(null)} size="md">
        <ModalHeader onClose={() => nodeCrud.setEditNodeTarget(null)}><ModalTitle>Editar nodo</ModalTitle></ModalHeader>
        <ModalBody>
          <NodeFormFields
            form={nodeCrud.nodeForm}
            errors={nodeCrud.nodeFormErrors}
            activeTab={nodeCrud.nodeFormTab}
            onTabChange={nodeCrud.setNodeFormTab}
            onChange={nodeCrud.setNodeForm}
            functions={functions}
            onPreCodeChange={(field, codes) => nodeCrud.handlePreCodeChange(field, 'edit', codes)}
            onEditArgs={(field, code) => nodeCrud.openArgsModal(field, 'edit', code)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => nodeCrud.setEditNodeTarget(null)} disabled={nodeCrud.updateNode.isPending}>Cancelar</Button>
          <Button onClick={nodeCrud.handleUpdateNode} isLoading={nodeCrud.updateNode.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={nodeCrud.createNodeOpen} onClose={() => nodeCrud.setCreateNodeOpen(false)} size="md">
        <ModalHeader onClose={() => nodeCrud.setCreateNodeOpen(false)}><ModalTitle>Nuevo nodo</ModalTitle></ModalHeader>
        <ModalBody>
          <NodeFormFields
            form={nodeCrud.createNodeForm}
            errors={nodeCrud.createNodeErrors}
            activeTab={nodeCrud.createNodeTab}
            onTabChange={nodeCrud.setCreateNodeTab}
            onChange={nodeCrud.setCreateNodeForm}
            functions={functions}
            onPreCodeChange={(field, codes) => nodeCrud.handlePreCodeChange(field, 'create', codes)}
            onEditArgs={(field, code) => nodeCrud.openArgsModal(field, 'create', code)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => nodeCrud.setCreateNodeOpen(false)} disabled={nodeCrud.createNode.isPending}>Cancelar</Button>
          <Button onClick={nodeCrud.handleCreateNodeFromPanel} isLoading={nodeCrud.createNode.isPending}>Crear nodo</Button>
        </ModalFooter>
      </Modal>

      <NodeArgsModal
        argsModal={nodeCrud.argsModal}
        onClose={() => nodeCrud.setArgsModal(null)}
        onSave={nodeCrud.saveArgsModal}
        functions={functions}
        argsValues={nodeCrud.argsValues}
        setArgsValues={nodeCrud.setArgsValues}
        argsArrayInputs={nodeCrud.argsArrayInputs}
        setArgsArrayInputs={nodeCrud.setArgsArrayInputs}
      />

      {/* ── Modales: Transition ── */}

      <Modal isOpen={!!transitionCrud.transitionFromNode} onClose={() => transitionCrud.setTransitionFromNode(null)} size="sm">
        <ModalHeader onClose={() => transitionCrud.setTransitionFromNode(null)}><ModalTitle>Nueva transición desde "{transitionCrud.transitionFromNode?.name}"</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Código de transición" required error={transitionCrud.transitionFormErrors.transitionCode}>
              <Input placeholder="Ej: intent_saludo" value={transitionCrud.transitionForm.transitionCode} onChange={(e) => transitionCrud.setTransitionForm(f => ({ ...f, transitionCode: e.target.value }))} error={!!transitionCrud.transitionFormErrors.transitionCode} />
            </FormField>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => transitionCrud.setCreateNewTransitionNode(false)} className={`px-3 py-1 rounded-md border transition-colors ${!transitionCrud.createNewTransitionNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo existente</button>
              <button type="button" onClick={() => transitionCrud.setCreateNewTransitionNode(true)} className={`px-3 py-1 rounded-md border transition-colors ${transitionCrud.createNewTransitionNode ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-border-primary text-text-secondary hover:bg-bg-tertiary'}`}>Nodo nuevo</button>
            </div>
            {transitionCrud.createNewTransitionNode ? (
              <FormField label="Nombre del nodo destino" required error={transitionCrud.transitionFormErrors.newNodeName}>
                <Input placeholder="Ej: Soporte técnico" value={transitionCrud.transitionForm.newNodeName} onChange={(e) => transitionCrud.setTransitionForm(f => ({ ...f, newNodeName: e.target.value }))} error={!!transitionCrud.transitionFormErrors.newNodeName} />
              </FormField>
            ) : (
              <FormField label="Nodo destino" required error={transitionCrud.transitionFormErrors.toNodeId}>
                <Select value={transitionCrud.transitionForm.toNodeId} options={existingNodes.map(n => ({ value: n.id, label: n.name }))} onChange={(val) => transitionCrud.setTransitionForm(f => ({ ...f, toNodeId: val }))} placeholder="Seleccionar nodo..." className="w-full" />
              </FormField>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => transitionCrud.setTransitionFromNode(null)} disabled={transitionCrud.createTransitionMutation.isPending || transitionCrud.createNode.isPending}>Cancelar</Button>
          <Button onClick={transitionCrud.handleCreateTransition} isLoading={transitionCrud.createTransitionMutation.isPending || transitionCrud.createNode.isPending}>Crear transición</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!transitionCrud.deleteTransitionTarget}
        onClose={() => transitionCrud.setDeleteTransitionTarget(null)}
        onConfirm={transitionCrud.handleDeleteTransition}
        title="Eliminar transición"
        message="¿Eliminar esta transición?"
        confirmText="Eliminar"
        isLoading={transitionCrud.deleteTransitionMutation.isPending}
      />

      {/* ── Modales: Intent ── */}

      <Modal isOpen={intentCrud.createIntentOpen} onClose={() => intentCrud.setCreateIntentOpen(false)} size="sm">
        <ModalHeader onClose={() => intentCrud.setCreateIntentOpen(false)}><ModalTitle>Nuevo intent</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={intentCrud.intentFormErrors.name}>
              <Input placeholder="Ej: saludo" value={intentCrud.intentForm.name} onChange={(e) => intentCrud.setIntentForm(f => ({ ...f, name: e.target.value }))} error={!!intentCrud.intentFormErrors.name} />
            </FormField>
            <FormField label="Flujo asociado" optional>
              <Select value={intentCrud.intentForm.flowId} options={flowOptions} onChange={(val) => intentCrud.setIntentForm(f => ({ ...f, flowId: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => intentCrud.setCreateIntentOpen(false)} disabled={intentCrud.createIntent.isPending}>Cancelar</Button>
          <Button onClick={intentCrud.handleCreateIntent} isLoading={intentCrud.createIntent.isPending}>Crear</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!intentCrud.editIntentTarget} onClose={() => intentCrud.setEditIntentTarget(null)} size="sm">
        <ModalHeader onClose={() => intentCrud.setEditIntentTarget(null)}><ModalTitle>Editar intent</ModalTitle></ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" required error={intentCrud.intentFormErrors.name}>
              <Input value={intentCrud.intentForm.name} onChange={(e) => intentCrud.setIntentForm(f => ({ ...f, name: e.target.value }))} error={!!intentCrud.intentFormErrors.name} />
            </FormField>
            <FormField label="Flujo asociado" optional>
              <Select value={intentCrud.intentForm.flowId} options={flowOptions} onChange={(val) => intentCrud.setIntentForm(f => ({ ...f, flowId: val }))} className="w-full" />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => intentCrud.setEditIntentTarget(null)} disabled={intentCrud.updateIntent.isPending}>Cancelar</Button>
          <Button onClick={intentCrud.handleUpdateIntent} isLoading={intentCrud.updateIntent.isPending}>Guardar</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!intentCrud.deleteIntentTarget} onClose={() => intentCrud.setDeleteIntentTarget(null)} onConfirm={intentCrud.handleDeleteIntent} title="Eliminar intent" message={`¿Eliminar el intent "${intentCrud.deleteIntentTarget?.name}"?`} confirmText="Eliminar" isLoading={intentCrud.deleteIntent.isPending} />

      {/* Flow history */}
      <FlowHistoryModal flow={flowCrud.historyFlowTarget} onClose={() => flowCrud.setHistoryFlowTarget(null)} />
    </div>
  );
};
