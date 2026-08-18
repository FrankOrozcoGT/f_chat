import { useState } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { SearchableSelect } from '@/shared/ui/SearchableSelect';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useGetLabels } from '@/features/queue/labels/api/useGetLabels';
import { useCreateLabel } from '@/features/queue/labels/api/useCreateLabel';
import { useUpdateLabel } from '@/features/queue/labels/api/useUpdateLabel';
import { useDeleteLabel } from '@/features/queue/labels/api/useDeleteLabel';
import { useGetContactsSelect } from '@/features/contacts/api/useGetContactsSelect';
import { useGetGroupsSelect } from '@/features/conversations/api/useGetGroupsSelect';
import type { ContactLabel, CreateContactLabelDto, UpdateContactLabelDto } from '@/features/queue/labels/types';

const emptyLabelForm = { label: '', clientId: '', groupJid: '' };

export const LabelsSettingsTab = () => {
  const { showToast } = useToast();
  const { data: labels = [], isLoading: labelsLoading } = useGetLabels();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const { data: contactsSelect = [] } = useGetContactsSelect();
  const { data: groupsSelect = [] } = useGetGroupsSelect();
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ContactLabel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactLabel | null>(null);
  const [labelForm, setLabelForm] = useState(emptyLabelForm);
  const [labelErrors, setLabelErrors] = useState<Partial<typeof emptyLabelForm>>({});

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
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al guardar la etiqueta', {
        409: 'Ya existe una etiqueta con ese nombre',
      }), 'error');
    }
  };

  const handleLabelDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLabel.mutateAsync(deleteTarget.id);
      showToast('Etiqueta eliminada', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al eliminar la etiqueta'), 'error');
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
      render: (lbl) => {
        if (!lbl.clientId) return <span className="text-sm text-text-secondary">—</span>;
        const contact = contactsSelect.find((c) => c.id === lbl.clientId);
        return <span className="text-sm text-text-secondary">{contact ? contact.name || contact.phoneNumber : lbl.clientId}</span>;
      },
    },
    {
      key: 'groupJid',
      header: 'Grupo',
      render: (lbl) => {
        if (!lbl.groupJid) return <span className="text-sm text-text-secondary">—</span>;
        const group = groupsSelect.find((g) => g.groupJid === lbl.groupJid);
        return <span className="text-sm text-text-secondary">{group ? group.groupName : lbl.groupJid}</span>;
      },
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

  return (
    <>
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
                            {lbl.clientId && `Cliente: ${contactsSelect.find((c) => c.id === lbl.clientId)?.name || contactsSelect.find((c) => c.id === lbl.clientId)?.phoneNumber || lbl.clientId}`}
                            {lbl.clientId && lbl.groupJid && ' · '}
                            {lbl.groupJid && `Grupo: ${groupsSelect.find((g) => g.groupJid === lbl.groupJid)?.groupName || lbl.groupJid}`}
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
              <div className="hidden md:block">
                <Table data={labels} columns={labelColumns} getRowKey={(lbl) => lbl.id} />
              </div>
            </>
          )}
        </div>
      </div>

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
            <FormField label="Cliente" optional>
              <SearchableSelect
                value={labelForm.clientId}
                options={[
                  { value: '', label: 'Sin cliente' },
                  ...contactsSelect.map((c) => ({ value: c.id, label: c.name || c.phoneNumber })),
                ]}
                onChange={(val) => setLabelForm((f) => ({ ...f, clientId: val }))}
                placeholder="Sin cliente"
                searchPlaceholder="Buscar cliente..."
              />
            </FormField>
            <FormField label="Grupo" optional>
              <SearchableSelect
                value={labelForm.groupJid}
                options={[
                  { value: '', label: 'Sin grupo' },
                  ...groupsSelect.map((g) => ({ value: g.groupJid, label: g.groupName })),
                ]}
                onChange={(val) => setLabelForm((f) => ({ ...f, groupJid: val }))}
                placeholder="Sin grupo"
                searchPlaceholder="Buscar grupo..."
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
    </>
  );
};
