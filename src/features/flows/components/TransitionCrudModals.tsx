import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import type { useTransitionCrud } from '../hooks/useTransitionCrud';
import type { Node } from '../types';

interface TransitionCrudModalsProps {
  transitionCrud: ReturnType<typeof useTransitionCrud>;
  existingNodes: Node[];
}

/** Modal de creación y confirmación de eliminación de transiciones, usados por UnifiedFlowCanvas. */
export const TransitionCrudModals = ({ transitionCrud, existingNodes }: TransitionCrudModalsProps) => (
  <>
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
  </>
);
