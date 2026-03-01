// Client info card component for HITL Panel
// Compact single-line layout: name, phone, last contact

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone, Clock } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import type { Client } from '../types';

interface ClientInfoProps {
  client: Client;
}

export const ClientInfo = ({ client }: ClientInfoProps) => {
  const lastContactFormatted = client?.lastContactAt
    ? formatDistanceToNow(new Date(client.lastContactAt), {
        addSuffix: true,
        locale: es,
      })
    : 'Desconocido';

  return (
    <Card variant="default" className="p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        {/* Name */}
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {client.name}
        </h3>

        {/* Phone + Last contact */}
        <div className="flex items-center gap-3 shrink-0 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {client.phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastContactFormatted}
          </span>
        </div>
      </div>
    </Card>
  );
};
