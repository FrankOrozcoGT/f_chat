// Client info card component for HITL Panel
// Shows avatar, name, phone, first contact date, and metadata

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Calendar } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Card, CardHeader, CardTitle, CardBody } from '@/shared/ui/Card';
import type { Client } from '../types';

interface ClientInfoProps {
  client: Client;
}

export const ClientInfo = ({ client }: ClientInfoProps) => {
  // Get initials for avatar fallback
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format last contact date
  const lastContactFormatted = formatDistanceToNow(new Date(client.lastContactAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card variant="default" className="p-4 md:p-6">
      <CardHeader className="mb-4 pb-4">
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar
            alt={client.name}
            initials={initials}
            size="2xl"
          />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{client.name}</h3>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-2">
          {/* Phone */}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-text-secondary shrink-0" />
            <span className="text-text-primary">{client.phone}</span>
          </div>

          {/* Last contact */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-text-secondary shrink-0" />
            <span className="text-text-secondary">
              Último contacto {lastContactFormatted}
            </span>
          </div>
        </div>

      </CardBody>
    </Card>
  );
};
