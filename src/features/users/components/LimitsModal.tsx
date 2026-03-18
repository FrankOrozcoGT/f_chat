import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useUpdateLimits } from '../api/useUpdateLimits';
import type { AdminTenant } from '../types';

interface LimitsModalProps {
  tenant: AdminTenant;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const LimitsModal = ({ tenant, isOpen, onClose, onSuccess, onError }: LimitsModalProps) => {
  const [whatsappLimit, setWhatsappLimit] = useState(tenant.settings.whatsappLimit.toString());
  const [creditsLimit, setCreditsLimit] = useState(tenant.settings.creditsLimit.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending } = useUpdateLimits();

  useEffect(() => {
    if (isOpen) {
      setWhatsappLimit(tenant.settings.whatsappLimit.toString());
      setCreditsLimit(tenant.settings.creditsLimit.toString());
      setValidationError(null);
    }
  }, [isOpen, tenant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const whatsappValue = parseInt(whatsappLimit, 10);
    const creditsValue = parseInt(creditsLimit, 10);

    if (isNaN(whatsappValue) || whatsappValue < 0) {
      setValidationError('WhatsApp limit debe ser un número >= 0');
      return;
    }
    if (isNaN(creditsValue) || creditsValue < 0) {
      setValidationError('Credits limit debe ser un número >= 0');
      return;
    }
    if (whatsappValue === tenant.settings.whatsappLimit && creditsValue === tenant.settings.creditsLimit) {
      onClose();
      return;
    }

    mutate(
      { tenantId: tenant.id, whatsappLimit: whatsappValue, creditsLimit: creditsValue },
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
          else if (status === 404) message = 'Organización no encontrada';
          onError?.(message);
        },
      }
    );
  };

  const creditsUsed = tenant.settings.creditsUsed;
  const creditsAvailable = tenant.settings.creditsLimit - creditsUsed;
  const creditsPercentage = tenant.settings.creditsLimit > 0
    ? Math.round((creditsUsed / tenant.settings.creditsLimit) * 100)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <ModalTitle>Límites — {tenant.name}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
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
                className="w-full px-3 py-2.5 md:py-2 min-h-11 md:min-h-10 text-base bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 3"
              />
              <p className="mt-1 text-xs text-text-secondary">Números WhatsApp que puede conectar</p>
            </div>

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
                className="w-full px-3 py-2.5 md:py-2 min-h-11 md:min-h-10 text-base bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 50000"
              />
              <p className="mt-1 text-xs text-text-secondary">Total de créditos disponibles</p>
            </div>

            {validationError && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-md">
                <p className="text-sm text-accent-red">{validationError}</p>
              </div>
            )}

            <div className="p-4 bg-bg-secondary border border-border-primary rounded-md space-y-2">
              <div className="flex items-center gap-2 text-text-primary font-medium mb-1">
                <TrendingUp size={16} className="text-accent-blue" />
                <span className="text-sm">Uso actual</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Créditos usados:</span>
                <span className="text-text-primary font-medium">{creditsUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Disponibles:</span>
                <span className="text-text-primary font-medium">{creditsAvailable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Porcentaje usado:</span>
                <span className="text-text-primary font-medium">{creditsPercentage}%</span>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
