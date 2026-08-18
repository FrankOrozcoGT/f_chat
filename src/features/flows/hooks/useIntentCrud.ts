import { useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useCreateIntent } from '../api/useCreateIntent';
import { useUpdateIntent } from '../api/useUpdateIntent';
import { useDeleteIntent } from '../api/useDeleteIntent';
import type { Intent } from '../types';

interface IntentForm {
  name: string;
  flowId: string;
}

const emptyIntentForm: IntentForm = { name: '', flowId: '' };

/** Estado y mutaciones de CRUD de intents. */
export function useIntentCrud() {
  const { showToast } = useToast();
  const createIntent = useCreateIntent();
  const updateIntent = useUpdateIntent();
  const deleteIntent = useDeleteIntent();

  const [createIntentOpen, setCreateIntentOpen] = useState(false);
  const [editIntentTarget, setEditIntentTarget] = useState<Intent | null>(null);
  const [deleteIntentTarget, setDeleteIntentTarget] = useState<Intent | null>(null);
  const [intentForm, setIntentForm] = useState<IntentForm>(emptyIntentForm);
  const [intentFormErrors, setIntentFormErrors] = useState<Partial<IntentForm>>({});

  const openCreateIntent = () => {
    setIntentForm(emptyIntentForm);
    setIntentFormErrors({});
    setCreateIntentOpen(true);
  };

  const openEditIntent = (intent: Intent) => {
    setEditIntentTarget(intent);
    setIntentForm({ name: intent.name, flowId: intent.flowId ?? '' });
    setIntentFormErrors({});
  };

  const handleCreateIntent = async () => {
    if (!intentForm.name.trim()) { setIntentFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await createIntent.mutateAsync({ name: intentForm.name.trim(), flowId: intentForm.flowId || undefined });
      showToast('Intent creado', 'success');
      setCreateIntentOpen(false);
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al crear el intent'), 'error');
    }
  };

  const handleUpdateIntent = async () => {
    if (!editIntentTarget) return;
    if (!intentForm.name.trim()) { setIntentFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateIntent.mutateAsync({ id: editIntentTarget.id, dto: { name: intentForm.name.trim(), flowId: intentForm.flowId || undefined } });
      showToast('Intent actualizado', 'success');
      setEditIntentTarget(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al actualizar el intent'), 'error');
    }
  };

  const handleDeleteIntent = async () => {
    if (!deleteIntentTarget) return;
    try {
      await deleteIntent.mutateAsync(deleteIntentTarget.id);
      showToast('Intent eliminado', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al eliminar el intent'), 'error');
    } finally {
      setDeleteIntentTarget(null);
    }
  };

  return {
    createIntent, updateIntent, deleteIntent,
    createIntentOpen, setCreateIntentOpen,
    editIntentTarget, setEditIntentTarget,
    deleteIntentTarget, setDeleteIntentTarget,
    intentForm, setIntentForm, intentFormErrors,
    openCreateIntent, openEditIntent,
    handleCreateIntent, handleUpdateIntent, handleDeleteIntent,
  };
}
