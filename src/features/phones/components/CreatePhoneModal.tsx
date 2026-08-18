import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useCreatePhone } from '../api/useCreatePhone';
import { QRCodeDisplay } from './QRCodeDisplay';
import type { PhoneStatus } from '../types';
import { getErrorMessage } from '@/shared/lib/errors';

const translateCreatePhoneError = (backendMessage: string): string | null => {
  if (backendMessage.includes('WhatsApp limit reached')) {
    const match = backendMessage.match(/Current: (\d+), Limit: (\d+)/);
    if (match) {
      const [, current, limit] = match;
      return `Límite de instancias WhatsApp alcanzado. Actual: ${current}, Límite: ${limit}`;
    }
  }
  return null;
};

interface CreatePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatePhoneModal = ({ isOpen, onClose, onSuccess }: CreatePhoneModalProps) => {
  const [instanceName, setInstanceName] = useState('');
  const [createdPhone, setCreatedPhone] = useState<{
    id: string;
    qrCode: string;
    status: PhoneStatus;
  } | null>(null);

  const createPhone = useCreatePhone();
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!instanceName.trim()) return;

    setCreateError(null);
    try {
      const result = await createPhone.mutateAsync({ instanceName: instanceName.trim() });
      setCreatedPhone({
        id: result.phone.id,
        qrCode: result.qrCode,
        status: result.phone.status,
      });
      onSuccess?.();
    } catch (error) {
      setCreateError(getErrorMessage(error, 'Error al crear la instancia', undefined, translateCreatePhoneError));
    }
  };

  const handleClose = () => {
    setInstanceName('');
    setCreatedPhone(null);
    setCreateError(null);
    createPhone.reset();
    onClose();
  };

  const handleStatusChange = (newStatus: PhoneStatus) => {
    if (createdPhone) {
      setCreatedPhone({ ...createdPhone, status: newStatus });
    }

    // Auto-close modal cuando se conecta
    if (newStatus === 'connected') {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnBackdrop={!createPhone.isPending}>
      <ModalHeader onClose={handleClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
            <Smartphone size={20} className="text-accent-blue" />
          </div>
          <ModalTitle>
            {!createdPhone ? 'Nueva Instancia WhatsApp' : 'Conectar WhatsApp'}
          </ModalTitle>
        </div>
      </ModalHeader>

      <ModalBody>
        {!createdPhone ? (
          /* Formulario inicial */
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Crea una nueva instancia de WhatsApp para conectar un número de teléfono.
            </p>

            <div className="space-y-2">
              <label htmlFor="instanceName" className="block text-sm font-medium text-text-primary">
                Nombre de la instancia
              </label>
              <input
                id="instanceName"
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ej: WhatsApp Soporte"
                className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue min-h-11 md:min-h-10"
                disabled={createPhone.isPending}
                autoFocus
              />
              <p className="text-xs text-text-tertiary">
                Elige un nombre descriptivo para identificar esta instancia
              </p>
            </div>

            {createError && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-sm text-accent-red">{createError}</p>
              </div>
            )}
          </div>
        ) : (
          /* Mostrar QR Code */
          <QRCodeDisplay
            phoneId={createdPhone.id}
            initialQR={createdPhone.qrCode}
            status={createdPhone.status}
            onStatusChange={handleStatusChange}
          />
        )}
      </ModalBody>

      <ModalFooter>
        {!createdPhone ? (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={createPhone.isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createPhone.isPending}
              disabled={!instanceName.trim() || createPhone.isPending}
            >
              {createPhone.isPending ? 'Creando...' : 'Crear Instancia'}
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={createdPhone.status === 'pending'}
            className="w-full md:w-auto"
          >
            {createdPhone.status === 'connected' ? 'Cerrar' : 'Cancelar'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
