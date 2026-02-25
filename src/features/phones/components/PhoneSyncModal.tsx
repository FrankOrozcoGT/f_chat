import { useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Modal, ModalBody } from '@/shared/ui/Modal';

type SyncPhase = 'syncing' | 'progress' | 'complete';

interface PhoneSyncModalProps {
  isOpen: boolean;
  phase: SyncPhase;
  contactsCount: number;
  instanceName?: string;
  onClose: () => void;
}

export const PhoneSyncModal = ({
  isOpen,
  phase,
  contactsCount,
  instanceName,
  onClose,
}: PhoneSyncModalProps) => {
  // Auto-cerrar 2s después de completar
  useEffect(() => {
    if (phase !== 'complete') return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const isComplete = phase === 'complete';

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="sm">
      <ModalBody>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Icono */}
          <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 size={32} className="text-accent-green" />
            ) : (
              <Loader2 size={32} className="text-accent-blue animate-spin" />
            )}
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {isComplete ? 'Sincronización completada' : 'Sincronizando contactos'}
            </h3>
            {instanceName && (
              <p className="text-sm text-text-secondary">{instanceName}</p>
            )}
          </div>

          {/* Contador */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-3xl font-bold text-accent-blue tabular-nums">
              {contactsCount}
            </p>
            <p className="text-sm text-text-secondary">
              {isComplete ? 'contactos sincronizados' : 'contactos procesados...'}
            </p>
          </div>

          {/* Mensaje de espera */}
          {!isComplete && (
            <p className="text-xs text-text-tertiary max-w-xs">
              No cierres esta ventana. La sincronización puede tardar unos minutos.
            </p>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};
