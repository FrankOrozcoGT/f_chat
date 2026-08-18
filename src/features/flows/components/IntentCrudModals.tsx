import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import type { useIntentCrud } from '@/features/flows/hooks/useIntentCrud';

interface IntentCrudModalsProps {
  intentCrud: ReturnType<typeof useIntentCrud>;
  flowOptions: { value: string; label: string }[];
}

/** Modales de creación/edición/eliminación de intents, usados por UnifiedFlowCanvas. */
export const IntentCrudModals = ({ intentCrud, flowOptions }: IntentCrudModalsProps) => (
  <>
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
  </>
);
