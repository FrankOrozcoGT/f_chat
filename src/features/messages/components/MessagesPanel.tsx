// Messages panel component - center column with chat
// Header + Messages body + Input footer
// WebSocket integration for real-time updates

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useConversationsStore } from '@/features/conversations/store';
import { useGetMessages } from '../api/useGetMessages';
import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { messageKeys } from '../api/messageKeys';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { socket } from '@/lib/websocket';
import type { Message } from '../types';

interface MessagesPanelProps {
  conversationId: string;
}

export const MessagesPanel = ({ conversationId }: MessagesPanelProps) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setSelectedConversationId } = useConversationsStore();

  // Fetch messages and conversation detail (includes client data)
  const { data: messages = [], isLoading: isLoadingMessages } = useGetMessages(conversationId);
  const { data: conversationDetail } = useGetConversationDetail(conversationId);

  const client = conversationDetail?.client;
  const summary = conversationDetail?.summary;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // WebSocket integration for real-time message updates
  useEffect(() => {
    const handleMessageIncoming = (data: { message: Message }) => {
      // Only update if message belongs to current conversation
      if (data.message.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    socket.on('message:incoming', handleMessageIncoming);

    return () => {
      socket.off('message:incoming', handleMessageIncoming);
    };
  }, [conversationId, queryClient]);

  // Back button handler (mobile)
  const handleBack = () => {
    setSelectedConversationId(null);
  };

  // Get initials for avatar fallback
  const initials = client?.name
    ? client.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border-primary bg-bg-secondary shrink-0">
        {/* Back button (mobile only) */}
        <button
          onClick={handleBack}
          className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label="Volver a lista"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <Avatar
          alt={client?.name}
          initials={initials}
          size="md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base text-text-primary truncate">
            {client?.name || 'Cargando...'}
          </h2>
          <p className="text-xs text-text-secondary truncate">
            {client?.phone || ''}
          </p>
        </div>

        {/* Status badge (based on conversation isActive) */}
        {conversationDetail?.conversation && (
          <Badge
            variant={conversationDetail.conversation.isActive ? 'success' : 'default'}
            size="sm"
          >
            {conversationDetail.conversation.isActive ? 'Activa' : 'Cerrada'}
          </Badge>
        )}
      </header>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Cargando mensajes...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-secondary">No hay mensajes aún</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                clientName={client?.name}
              />
            ))}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer with input */}
      <MessageInput />
    </div>
  );
};
