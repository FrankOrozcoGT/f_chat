import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useUpdateLimits } from '../api/useUpdateLimits';
import type { User } from '../types';

interface LimitsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const LimitsModal = ({ user, isOpen, onClose, onSuccess, onError }: LimitsModalProps) => {
  const [whatsappLimit, setWhatsappLimit] = useState(user.whatsappLimit.toString());
  const [creditsLimit, setCreditsLimit] = useState(user.creditsLimit.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending } = useUpdateLimits();

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setWhatsappLimit(user.whatsappLimit.toString());
      setCreditsLimit(user.creditsLimit.toString());
      setValidationError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const whatsappValue = parseInt(whatsappLimit, 10);
    const creditsValue = parseInt(creditsLimit, 10);

    // Validation
    if (isNaN(whatsappValue) || whatsappValue < 0) {
      setValidationError('WhatsApp limit debe ser un número >= 0');
      return;
    }

    if (isNaN(creditsValue) || creditsValue < 0) {
      setValidationError('Credits limit debe ser un número >= 0');
      return;
    }

    // Check if values changed
    if (whatsappValue === user.whatsappLimit && creditsValue === user.creditsLimit) {
      onClose();
      return;
    }

    mutate(
      {
        userId: user.id,
        whatsappLimit: whatsappValue,
        creditsLimit: creditsValue,
      },
      {
        onSuccess: () => {
          onSuccess?.('Límites actualizados correctamente');
          onClose();
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          let message = 'Error de conexión';

          if (status === 400) message = 'Valores inválidos';
          else if (status === 403) message = 'No autorizado';
          else if (status === 404) message = 'Usuario no encontrado';

          onError?.(message);
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const creditsAvailable = user.creditsLimit - user.creditsUsed;
  const creditsPercentage = user.creditsLimit > 0
    ? Math.round((user.creditsUsed / user.creditsLimit) * 100)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <ModalTitle>Configurar Límites - {user.name}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* WhatsApp Limit Input */}
            <div>
              <label htmlFor="whatsappLimit" className="block text-sm font-medium text-text-primary mb-2">
                Límite de WhatsApp
              </label>
              <input
                id="whatsappLimit"
                type="number"
                min="0"
                value={whatsappLimit}
                onChange={(e) => setWhatsappLimit(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 3"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Cantidad máxima de números WhatsApp que puede conectar
              </p>
            </div>

            {/* Credits Limit Input */}
            <div>
              <label htmlFor="creditsLimit" className="block text-sm font-medium text-text-primary mb-2">
                Límite de Créditos
              </label>
              <input
                id="creditsLimit"
                type="number"
                min="0"
                value={creditsLimit}
                onChange={(e) => setCreditsLimit(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 50000"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Total de créditos disponibles en el período actual
              </p>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-md">
                <p className="text-sm text-accent-red">{validationError}</p>
              </div>
            )}

            {/* Usage Info */}
            <div className="p-4 bg-bg-secondary border border-border-primary rounded-md space-y-3">
              <div className="flex items-center gap-2 text-text-primary font-medium">
                <TrendingUp size={16} className="text-accent-blue" />
                <span>Información de Uso</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Créditos usados:</span>
                  <span className="text-text-primary font-medium">
                    {user.creditsUsed.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary">Créditos disponibles:</span>
                  <span className="text-text-primary font-medium">
                    {creditsAvailable.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary">Porcentaje usado:</span>
                  <span className="text-text-primary font-medium">
                    {creditsPercentage}%
                  </span>
                </div>

                <div className="pt-2 border-t border-border-primary">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Período inicio:</span>
                    <span className="text-text-primary font-medium">
                      {formatDate(user.billingPeriodStart)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
