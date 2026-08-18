// Modal shown when sending a message fails with 503 (phone disconnected)
// Offers to navigate to /phones to scan QR, or dismiss for 1 hour

import { useNavigate } from 'react-router-dom';
import { WifiOff, QrCode } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { usePhoneReconnectStore } from '@/features/phones/store';

interface PhoneDisconnectedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneDisconnectedModal = ({ isOpen, onClose }: PhoneDisconnectedModalProps) => {
  const navigate = useNavigate();
  const dismissFor1Hour = usePhoneReconnectStore((s) => s.dismissFor1Hour);

  const handleReconnect = () => {
    onClose();
    navigate('/phones');
  };

  const handleDismiss = () => {
    dismissFor1Hour();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Teléfono desconectado</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full bg-accent-orange/15 flex items-center justify-center">
            <WifiOff size={32} className="text-accent-orange" />
          </div>
          <p className="text-center text-sm text-text-secondary">
            No se pudo enviar el mensaje porque el teléfono está desconectado.
            Ve a la sección de teléfonos para escanear el código QR y reconectar.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={handleDismiss}>
          Ignorar por 1 hora
        </Button>
        <Button variant="primary" size="sm" onClick={handleReconnect}>
          <QrCode className="w-4 h-4" />
          Ir a reconectar
        </Button>
      </ModalFooter>
    </Modal>
  );
};
