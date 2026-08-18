import { Button } from '@/shared/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { NodeFormFields } from './NodeFormFields';
import { NodeArgsModal } from './NodeArgsModal';
import type { useNodeCrud } from '../hooks/useNodeCrud';
import type { NodeFunction } from '../types';

interface NodeCrudModalsProps {
  nodeCrud: ReturnType<typeof useNodeCrud>;
  functions: NodeFunction[];
}

/** Modales de creación/edición de nodos y del modal de argumentos dinámicos, usados por UnifiedFlowCanvas. */
export const NodeCrudModals = ({ nodeCrud, functions }: NodeCrudModalsProps) => (
  <>
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
  </>
);
