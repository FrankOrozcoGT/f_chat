import { History, RotateCcw, Loader2, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/shared/ui/Modal';
import { useGetFlowVersions } from '../api/useGetFlowVersions';
import { useRestoreFlowVersion } from '../api/useRestoreFlowVersion';
import type { Flow } from '../types';

interface FlowHistoryModalProps {
  flow: Flow | null;
  onClose: () => void;
}

export const FlowHistoryModal = ({ flow, onClose }: FlowHistoryModalProps) => {
  const { data: versions, isLoading, isError } = useGetFlowVersions(flow?.id ?? null);
  const { mutate: restore, isPending: isRestoring, variables: restoringVars } = useRestoreFlowVersion();

  const handleRestore = (versionId: string) => {
    if (!flow) return;
    restore({ flowId: flow.id, versionId }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={!!flow} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>
          <div className="flex items-center gap-2">
            <History size={18} />
            Historial — {flow?.name}
          </div>
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-text-secondary">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando versiones...</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-md">
            <AlertCircle size={16} className="text-accent-red shrink-0" />
            <p className="text-sm text-accent-red">Error al cargar el historial</p>
          </div>
        )}

        {versions && versions.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8 italic">
            Sin versiones guardadas aún
          </p>
        )}

        {versions && versions.length > 0 && (
          <div className="flex flex-col gap-2">
            {versions.map((v) => {
              const isBeingRestored = isRestoring && restoringVars?.versionId === v.id;
              const date = new Date(v.createdAt);
              const label = date.toLocaleString('es', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 bg-bg-primary border border-border-primary rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text-primary">Versión {v.version}</p>
                      {v.isPromoted && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-green/15 text-accent-green border border-accent-green/30">
                          <CheckCircle2 size={10} /> Promovida
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">{label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {v.nodesSnapshot.nodes.length} nodo{v.nodesSnapshot.nodes.length !== 1 ? 's' : ''}
                      {' · '}
                      {v.nodesSnapshot.transitions.length} transición{v.nodesSnapshot.transitions.length !== 1 ? 'es' : ''}
                    </p>
                    {v.proposedTools && v.proposedTools.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Wrench size={10} className="text-text-tertiary" />
                        {v.proposedTools.map((t) => (
                          <span key={t.name} title={t.description} className="px-1.5 py-0.5 rounded text-[10px] bg-bg-tertiary text-text-secondary">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={isRestoring}
                    title="Restaurar esta versión"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-primary text-text-secondary rounded-md text-xs font-medium hover:border-accent-blue hover:text-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBeingRestored ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RotateCcw size={13} />
                    )}
                    Restaurar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};
