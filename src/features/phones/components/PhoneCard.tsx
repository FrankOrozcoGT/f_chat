import { useState, useCallback } from 'react';
import { Smartphone, Circle, Clock, Trash2 } from 'lucide-react';
import { Card, CardBody } from '@/shared/ui/Card';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useDeletePhone } from '../api/useDeletePhone';
import { useToast } from '@/shared/hooks/useToast';
import { formatDateTime } from '@/shared/lib/date';
import { useSocketEvent } from '@/lib/websocket';
import type { Phone, PhoneStatus } from '../types';
import type { PhoneStatusChangedPayload } from '@/lib/websocket';

interface PhoneCardProps {
  phone: Phone;
}

export const PhoneCard = ({ phone }: PhoneCardProps) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PhoneStatus>(phone.status);
  const deletePhone = useDeletePhone();
  const { showToast } = useToast();

  // WebSocket listener para actualizaciones de estado en tiempo real
  useSocketEvent<PhoneStatusChangedPayload>('phone:status_changed', useCallback((data) => {
    if (data.phoneId === phone.id) {
      setCurrentStatus(data.status);
    }
  }, [phone.id]));

  const handleConfirmDelete = () => {
    deletePhone.mutate(phone.id, {
      onSuccess: () => {
        showToast('Instancia eliminada correctamente', 'success');
        setShowConfirmDelete(false);
      },
      onError: (error: Error) => {
        showToast(error.message || 'Error al eliminar la instancia', 'error');
        setShowConfirmDelete(false);
      },
    });
  };

  const getStatusColor = (status: PhoneStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-accent-green/10 text-accent-green border-accent-green/20';
      case 'disconnected':
        return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      case 'pending':
        return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      default:
        return 'bg-bg-tertiary text-text-secondary border-border-primary';
    }
  };

  const getStatusDotColor = (status: PhoneStatus) => {
    switch (status) {
      case 'connected':
        return 'text-accent-green';
      case 'disconnected':
        return 'text-accent-red';
      case 'pending':
        return 'text-accent-orange';
      default:
        return 'text-text-tertiary';
    }
  };

  const getStatusLabel = (status: PhoneStatus) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return formatDateTime(dateString);
  };

  return (
    <>
      <Card variant="elevated">
        <CardBody>
          <div className="flex flex-col gap-3">
          {/* Header con ícono y estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-blue/10 flex items-center justify-center shrink-0">
                <Smartphone size={20} className="text-accent-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary truncate">
                  {phone.instanceName}
                </h3>
                {phone.phoneNumber && (
                  <p className="text-sm text-text-secondary truncate">{phone.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badge de estado */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(
                  currentStatus
                )}`}
              >
                <Circle size={8} className={`fill-current ${getStatusDotColor(currentStatus)}`} />
                {getStatusLabel(currentStatus)}
              </span>

              {/* Botón de delete */}
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={deletePhone.isPending}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Eliminar instancia"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock size={14} className="text-text-tertiary shrink-0" />
              <span className="truncate">
                {currentStatus === 'connected' && phone.lastConnected
                  ? `Conectado: ${formatDate(phone.lastConnected)}`
                  : `Creado: ${formatDate(phone.createdAt)}`}
              </span>
            </div>
          </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar instancia"
        message={`¿Estás seguro de que deseas eliminar la instancia "${phone.instanceName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deletePhone.isPending}
      />
    </>
  );
};
