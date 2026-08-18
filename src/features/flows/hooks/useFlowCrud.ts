import { useCallback, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { useCreateFlow } from '../api/useCreateFlow';
import { useUpdateFlow } from '../api/useUpdateFlow';
import { useDeleteFlow } from '../api/useDeleteFlow';
import { useCreateNode } from '../api/useCreateNode';
import type { Flow } from '../types';

interface FlowForm {
  name: string;
  routerNodeId: string;
  newNodeName: string;
}

const emptyFlowForm: FlowForm = { name: '', routerNodeId: '', newNodeName: '' };

/**
 * Estado y mutaciones de CRUD de flows: crear (con nodo router existente o
 * nuevo), editar, eliminar, y el modal de historial. Usa useCreateNode
 * internamente porque crear un flow puede implicar crear su nodo router.
 */
export function useFlowCrud(existingNodesCount: number) {
  const { showToast } = useToast();
  const createFlow = useCreateFlow();
  const updateFlow = useUpdateFlow();
  const deleteFlow = useDeleteFlow();
  const createNode = useCreateNode();

  const [createFlowOpen, setCreateFlowOpen] = useState(false);
  const [editFlowTarget, setEditFlowTarget] = useState<Flow | null>(null);
  const [deleteFlowTarget, setDeleteFlowTarget] = useState<Flow | null>(null);
  const [historyFlowTarget, setHistoryFlowTarget] = useState<Flow | null>(null);
  const [flowForm, setFlowForm] = useState<FlowForm>(emptyFlowForm);
  const [flowFormErrors, setFlowFormErrors] = useState<Partial<FlowForm>>({});
  const [createNewRouterNode, setCreateNewRouterNode] = useState(false);

  const openCreateFlow = useCallback(() => {
    setFlowForm(emptyFlowForm);
    setFlowFormErrors({});
    setCreateNewRouterNode(existingNodesCount === 0);
    setCreateFlowOpen(true);
  }, [existingNodesCount]);

  const openEditFlow = useCallback((flow: Flow) => {
    setEditFlowTarget(flow);
    setFlowForm({ name: flow.name, routerNodeId: flow.routerNodeId ?? '', newNodeName: '' });
    setFlowFormErrors({});
  }, []);

  const openDeleteFlow = useCallback((flow: Flow) => setDeleteFlowTarget(flow), []);
  const openFlowHistory = useCallback((flow: Flow) => setHistoryFlowTarget(flow), []);

  const handleCreateFlow = async () => {
    const errs: Partial<FlowForm> = {};
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

  return {
    createFlowOpen, setCreateFlowOpen,
    editFlowTarget, setEditFlowTarget,
    deleteFlowTarget, setDeleteFlowTarget,
    historyFlowTarget, setHistoryFlowTarget,
    flowForm, setFlowForm,
    flowFormErrors,
    createNewRouterNode, setCreateNewRouterNode,
    openCreateFlow, openEditFlow, openDeleteFlow, openFlowHistory,
    handleCreateFlow, handleUpdateFlow, handleDeleteFlow,
    createFlow, updateFlow, deleteFlow, createNode,
  };
}
