import { useState, useRef } from 'react';
import { Phone, Clock, Pencil, X, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/shared/ui/Card';
import { useToast } from '@/shared/hooks/useToast';
import { useUpdateContactName } from '@/features/contacts/api/useUpdateContactName';
import { messageKeys } from '@/features/messages/api/messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { formatRelativeTime } from '@/shared/lib/date';
import type { Client } from '@/features/messages/types';

interface ClientInfoProps {
  client: Client;
  conversationId: string;
}

export const ClientInfo = ({ client, conversationId }: ClientInfoProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutate: updateName, isPending } = useUpdateContactName();

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const lastContactFormatted = client?.lastContactAt
    ? formatRelativeTime(client.lastContactAt)
    : 'Desconocido';

  const startEditing = () => {
    setInputValue(client.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const save = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === client.name) {
      cancelEditing();
      return;
    }
    updateName(
      { contactId: client.id, name: trimmed },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
          queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
          setIsEditing(false);
          showToast('Nombre actualizado', 'success');
        },
        onError: () => {
          showToast('Error al actualizar el nombre', 'error');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancelEditing();
  };

  return (
    <Card variant="default" className="p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        {/* Name */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-accent-blue outline-none text-text-primary"
            />
            <button onClick={save} disabled={isPending} className="shrink-0 text-accent-blue hover:opacity-70 transition-opacity">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancelEditing} disabled={isPending} className="shrink-0 text-text-secondary hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {client.name}
            </h3>
            <button
              onClick={startEditing}
              className="shrink-0 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Phone + Last contact */}
        {!isEditing && (
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
        )}
      </div>
    </Card>
  );
};
