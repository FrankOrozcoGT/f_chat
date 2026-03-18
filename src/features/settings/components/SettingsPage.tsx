import { useState, useEffect } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { useGetSettings } from '../api/useGetSettings';
import { useUpdateSettings } from '../api/useUpdateSettings';
import { useGetLabels } from '@/features/queue/labels/api/useGetLabels';
import { useCreateLabel } from '@/features/queue/labels/api/useCreateLabel';
import { useUpdateLabel } from '@/features/queue/labels/api/useUpdateLabel';
import { useDeleteLabel } from '@/features/queue/labels/api/useDeleteLabel';
import type { AnalysisMode } from '../types';
import type { ContactLabel, CreateContactLabelDto, UpdateContactLabelDto } from '@/features/queue/labels/types';

const analysisModeOptions = [
  { value: 'manual' as const, label: 'Manual' },
  { value: 'automatic' as const, label: 'Automático' },
];

const emptyLabelForm = { label: '', clientId: '', groupJid: '' };

export const SettingsPage = () => {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toasts, showToast, removeToast } = useToast();

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('manual');
  const [messageLimit, setMessageLimit] = useState<number | ''>(30);

  // Labels state
  const { data: labels = [], isLoading: labelsLoading } = useGetLabels();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ContactLabel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactLabel | null>(null);
  const [labelForm, setLabelForm] = useState(emptyLabelForm);
  const [labelErrors, setLabelErrors] = useState<Partial<typeof emptyLabelForm>>({});

  useEffect(() => {
    if (settings) {
      setAnalysisMode(settings.analysisMode);
      setMessageLimit(settings.messageLimit);
    }
  }, [settings]);

  const hasChanges =
    settings && messageLimit !== '' && (analysisMode !== settings.analysisMode || messageLimit !== settings.messageLimit);

  const handleSave = () => {
    updateSettings.mutate(
      { analysisMode, messageLimit: messageLimit as number },
      {
        onSuccess: () => showToast('Configuración guardada', 'success'),
        onError: () => showToast('Error al guardar configuración', 'error'),
      }
    );
  };

  // Label handlers
  const openCreateLabel = () => {
    setEditingLabel(null);
    setLabelForm(emptyLabelForm);
    setLabelErrors({});
    setLabelModalOpen(true);
  };

  const openEditLabel = (lbl: ContactLabel) => {
    setEditingLabel(lbl);
    setLabelForm({ label: lbl.label, clientId: lbl.clientId ?? '', groupJid: lbl.groupJid ?? '' });
    setLabelErrors({});
    setLabelModalOpen(true);
  };

  const closeLabelModal = () => {
    setLabelModalOpen(false);
    setEditingLabel(null);
  };

  const validateLabel = () => {
    const errs: Partial<typeof emptyLabelForm> = {};
    if (!labelForm.label.trim()) errs.label = 'La etiqueta es requerida';
    setLabelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLabelSubmit = async () => {
    if (!validateLabel()) return;
    const dto: CreateContactLabelDto | UpdateContactLabelDto = {
      label: labelForm.label.trim(),
      ...(labelForm.clientId.trim() && { clientId: labelForm.clientId.trim() }),
      ...(labelForm.groupJid.trim() && { groupJid: labelForm.groupJid.trim() }),
    };
    try {
      if (editingLabel) {
        await updateLabel.mutateAsync({ id: editingLabel.id, dto: dto as UpdateContactLabelDto });
        showToast('Etiqueta actualizada', 'success');
      } else {
        await createLabel.mutateAsync(dto as CreateContactLabelDto);
        showToast('Etiqueta creada', 'success');
      }
      closeLabelModal();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        showToast('Ya existe una etiqueta con ese nombre', 'error');
      } else {
        showToast('Error al guardar la etiqueta', 'error');
      }
    }
  };

  const handleLabelDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLabel.mutateAsync(deleteTarget.id);
      showToast('Etiqueta eliminada', 'success');
    } catch {
      showToast('Error al eliminar la etiqueta', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const isLabelSubmitting = createLabel.isPending || updateLabel.isPending;

  const labelColumns: TableColumn<ContactLabel>[] = [
    {
      key: 'label',
      header: 'Etiqueta',
      render: (lbl) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
            <Tag size={14} className="text-text-secondary" />
          </div>
          <p className="font-medium text-text-primary">{lbl.label}</p>
        </div>
      ),
    },
    {
      key: 'clientId',
      header: 'Cliente',
      render: (lbl) => <span className="text-sm text-text-secondary">{lbl.clientId ?? '—'}</span>,
    },
    {
      key: 'groupJid',
      header: 'Grupo JID',
      render: (lbl) => <span className="text-sm text-text-secondary">{lbl.groupJid ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (lbl) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditLabel(lbl)} title="Editar">
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lbl)} title="Eliminar">
            <Trash2 size={16} className="text-accent-red" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-75">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
            Configuración
          </h1>
          <p className="text-sm md:text-base text-text-secondary">
            Ajustes generales del sistema
          </p>
        </div>

        {/* Análisis de conversaciones */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">Análisis de conversaciones</h2>
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Modo de análisis
              </label>
              <Select
                value={analysisMode}
                options={analysisModeOptions}
                onChange={setAnalysisMode}
                size="md"
              />
              <p className="text-xs md:text-sm text-text-tertiary mt-2">
                En modo automático, las conversaciones se analizan al finalizar. En manual, debes iniciar el análisis tú mismo.
              </p>
            </div>

            <div>
              <label htmlFor="messageLimit" className="block text-sm font-medium text-text-primary mb-2">
                Límite de mensajes
              </label>
              <input
                id="messageLimit"
                type="number"
                min={1}
                value={messageLimit}
                onChange={(e) => {
                  if (e.target.value === '') { setMessageLimit(''); return; }
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) setMessageLimit(val);
                }}
                onBlur={() => {
                  if (messageLimit === '' || messageLimit < 1) setMessageLimit(settings?.messageLimit ?? 1);
                }}
                className="w-full max-w-50 px-3 py-2 text-base bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue transition-colors"
              />
              <p className="text-xs md:text-sm text-text-tertiary mt-2">
                Cantidad máxima de mensajes a incluir en cada análisis.
              </p>
            </div>

            <div className="pt-4 border-t border-border-primary flex flex-col md:flex-row md:justify-end gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateSettings.isPending}
                isLoading={updateSettings.isPending}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>

        {/* Etiquetas de contacto */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Etiquetas de contacto</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {labels.length} etiqueta{labels.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={openCreateLabel} size="sm">
              <Plus size={16} />
              Nueva etiqueta
            </Button>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-lg">
            {labelsLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
              </div>
            )}

            {!labelsLoading && labels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Tag size={36} className="text-text-tertiary mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Sin etiquetas</p>
                <p className="text-xs text-text-secondary mb-4">
                  Crea etiquetas para organizar tus contactos y grupos.
                </p>
                <Button size="sm" onClick={openCreateLabel}>
                  <Plus size={16} /> Nueva etiqueta
                </Button>
              </div>
            )}

            {!labelsLoading && labels.length > 0 && (
              <>
                {/* Mobile */}
                <div className="md:hidden divide-y divide-border-primary">
                  {labels.map((lbl) => (
                    <div key={lbl.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                          <Tag size={14} className="text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">{lbl.label}</p>
                          {(lbl.clientId || lbl.groupJid) && (
                            <p className="text-xs text-text-secondary truncate">
                              {lbl.clientId && `Cliente: ${lbl.clientId}`}
                              {lbl.clientId && lbl.groupJid && ' · '}
                              {lbl.groupJid && `Grupo: ${lbl.groupJid}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEditLabel(lbl)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lbl)}>
                          <Trash2 size={15} className="text-accent-red" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table data={labels} columns={labelColumns} getRowKey={(lbl) => lbl.id} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>

    {/* Label Modal */}
    <Modal isOpen={labelModalOpen} onClose={closeLabelModal} size="md">
      <ModalHeader onClose={closeLabelModal}>
        <ModalTitle>{editingLabel ? 'Editar etiqueta' : 'Nueva etiqueta'}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <FormField label="Etiqueta" required error={labelErrors.label}>
            <Input
              placeholder="Ej: VIP, Urgente, Proveedor..."
              value={labelForm.label}
              onChange={(e) => setLabelForm((f) => ({ ...f, label: e.target.value }))}
              error={!!labelErrors.label}
            />
          </FormField>
          <FormField label="Cliente ID" optional>
            <Input
              placeholder="ID del cliente (opcional)"
              value={labelForm.clientId}
              onChange={(e) => setLabelForm((f) => ({ ...f, clientId: e.target.value }))}
            />
          </FormField>
          <FormField label="Grupo JID" optional>
            <Input
              placeholder="JID del grupo (opcional)"
              value={labelForm.groupJid}
              onChange={(e) => setLabelForm((f) => ({ ...f, groupJid: e.target.value }))}
            />
          </FormField>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={closeLabelModal} disabled={isLabelSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleLabelSubmit} isLoading={isLabelSubmitting}>
          {editingLabel ? 'Guardar cambios' : 'Crear etiqueta'}
        </Button>
      </ModalFooter>
    </Modal>

    {/* Delete Confirm */}
    <ConfirmModal
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleLabelDelete}
      title="Eliminar etiqueta"
      message={`¿Estás seguro de eliminar "${deleteTarget?.label}"? Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      isLoading={deleteLabel.isPending}
    />

    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => removeToast(toast.id)}
      />
    ))}
    </>
  );
};
