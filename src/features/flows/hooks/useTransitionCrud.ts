import { useCallback, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useCreateTransition } from '../api/useCreateTransition';
import { useDeleteTransition } from '../api/useDeleteTransition';
import { useCreateNode } from '../api/useCreateNode';
import type { Node } from '../types';

interface TransitionForm {
  toNodeId: string;
  newNodeName: string;
  transitionCode: string;
}

const emptyTransitionForm: TransitionForm = { toNodeId: '', newNodeName: '', transitionCode: '' };

/**
 * Estado y mutaciones de CRUD de transiciones para un flow dado (flowId
 * fijo, igual que lo esperan useCreateTransition/useDeleteTransition).
 */
export function useTransitionCrud(flowId: string | null) {
  const { showToast } = useToast();
  const createTransitionMutation = useCreateTransition(flowId ?? '');
  const deleteTransitionMutation = useDeleteTransition(flowId ?? '');
  const createNode = useCreateNode();

  const [transitionFromNode, setTransitionFromNode] = useState<Node | null>(null);
  const [transitionForm, setTransitionForm] = useState<TransitionForm>(emptyTransitionForm);
  const [transitionFormErrors, setTransitionFormErrors] = useState<Partial<TransitionForm>>({});
  const [createNewTransitionNode, setCreateNewTransitionNode] = useState(false);
  const [deleteTransitionTarget, setDeleteTransitionTarget] = useState<string | null>(null);

  const openAddTransition = useCallback((fromNode: Node) => {
    setTransitionFromNode(fromNode);
    setTransitionForm(emptyTransitionForm);
    setTransitionFormErrors({});
    setCreateNewTransitionNode(false);
  }, []);

  const handleCreateTransition = async () => {
    if (!transitionFromNode) return;
    const errs: Partial<TransitionForm> = {};
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
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al crear la transición'), 'error');
    }
  };

  const handleDeleteTransition = async () => {
    if (!deleteTransitionTarget) return;
    try {
      await deleteTransitionMutation.mutateAsync(deleteTransitionTarget);
      showToast('Transición eliminada', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al eliminar'), 'error');
    } finally {
      setDeleteTransitionTarget(null);
    }
  };

  return {
    createTransitionMutation, deleteTransitionMutation, createNode,
    transitionFromNode, setTransitionFromNode,
    transitionForm, setTransitionForm, transitionFormErrors,
    createNewTransitionNode, setCreateNewTransitionNode,
    deleteTransitionTarget, setDeleteTransitionTarget,
    openAddTransition, handleCreateTransition, handleDeleteTransition,
  };
}
