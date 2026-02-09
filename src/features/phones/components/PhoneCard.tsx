import { Smartphone, Circle, Clock } from 'lucide-react';
import { Card, CardBody } from '@/shared/ui/Card';
import type { Phone, PhoneStatus } from '@/features/phones/types';

interface PhoneCardProps {
  phone: Phone;
}

export const PhoneCard = ({ phone }: PhoneCardProps) => {
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card variant="elevated">
      <CardBody>
        <div className="flex flex-col gap-3">
          {/* Header con ícono y estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
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

            {/* Badge de estado */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(
                phone.status
              )}`}
            >
              <Circle size={8} className={`fill-current ${getStatusDotColor(phone.status)}`} />
              {getStatusLabel(phone.status)}
            </span>
          </div>

          {/* Información adicional */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="truncate">
                {phone.status === 'connected' && phone.lastConnected
                  ? `Conectado: ${formatDate(phone.lastConnected)}`
                  : `Creado: ${formatDate(phone.createdAt)}`}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
