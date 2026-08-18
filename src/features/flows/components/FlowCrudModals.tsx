import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { FlowHistoryModal } from '@/features/flows/components/FlowHistoryModal';
import type { useFlowCrud } from '@/features/flows/hooks/useFlowCrud';
import type { Node } from '@/features/flows/types';

interface FlowCrudModalsProps {
  flowCrud: ReturnType<typeof useFlowCrud>;
  existingNodes: Node[];
}

/** Modales de creación/edición/eliminación/historial de flujos, usados por UnifiedFlowCanvas. */
export const FlowCrudModals = ({ flowCrud, existingNodes }: FlowCrudModalsProps) => (
  <>
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

    <FlowHistoryModal flow={flowCrud.historyFlowTarget} onClose={() => flowCrud.setHistoryFlowTarget(null)} />
  </>
);
