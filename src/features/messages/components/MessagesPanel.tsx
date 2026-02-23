// Messages panel component - center column with chat
// Header + Messages body + Input footer
// WebSocket integration for real-time updates

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bot, Hand, Info } from 'lucide-react';
import { useConversationsStore } from '@/features/conversations/store';
import { useGetMessages } from '../api/useGetMessages';
import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { messageKeys } from '../api/messageKeys';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ClientInfo } from './ClientInfo';
import { ConversationSummary } from './ConversationSummary';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { useTakeControl } from '../api/useTakeControl';
import { useReturnToAi } from '../api/useReturnToAi';
import { useToast } from '@/shared/hooks/useToast';
import { socket } from '@/lib/websocket';
import type { MessageIncomingPayload, MessageSentPayload, CreditsExhaustedPayload, MediaReadyPayload } from '@/lib/websocket';
import type { Message } from '../types';
import { authKeys } from '@/features/auth/api/useGetMe';

interface MessagesPanelProps {
  conversationId: string;
}

export const MessagesPanel = ({ conversationId }: MessagesPanelProps) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setSelectedConversationId } = useConversationsStore();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const { showToast } = useToast();

  // Fetch messages and conversation detail (includes client data)
  const { data: messages = [], isLoading: isLoadingMessages } = useGetMessages(conversationId);
  const { data: conversationDetail } = useGetConversationDetail(conversationId);

  const client = conversationDetail?.client;
  const conversationMode = conversationDetail?.conversation?.mode;

  // HITL mutation hooks
  const takeControl = useTakeControl({
    onError: (error) => {
      const msg = (error as any)?.response?.data?.message || 'Error al tomar control';
      showToast(msg, 'error');
    },
  });
  const returnToAi = useReturnToAi({
    onError: (error) => {
      const msg = (error as any)?.response?.data?.message || 'Error al devolver a IA';
      showToast(msg, 'error');
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // WebSocket integration for real-time message updates
  useEffect(() => {
    // message:incoming — mensaje entrante del cliente WhatsApp (broadcast)
    const handleMessageIncoming = (data: MessageIncomingPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    // message:new — mensaje enviado desde el backend/bot (broadcast)
    const handleMessageNew = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    // message:sent — mensaje enviado desde WhatsApp Web, no desde el sistema (broadcast)
    const handleMessageSent = (data: MessageSentPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    const handleMessageStatusUpdated = (data: { messageId: string; conversationId: string; status: string }) => {
      // Only update if message belongs to current conversation
      if (data.conversationId === conversationId) {
        // Update message status in cache
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (oldMessages = []) => {
            return oldMessages.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, status: data.status as Message['status'] }
                : msg
            );
          }
        );
      }
    };

    const handleMessageError = (data: { conversationId: string; error: string; tempId?: string }) => {
      // Only handle if error belongs to current conversation
      if (data.conversationId === conversationId) {
        // Show error toast
        showToast(data.error || 'Error al enviar el mensaje', 'error');

        // If we have a tempId, mark that message as failed
        if (data.tempId) {
          queryClient.setQueryData<Message[]>(
            messageKeys.list(conversationId),
            (oldMessages = []) => {
              return oldMessages.map((msg) =>
                msg.id === data.tempId
                  ? { ...msg, status: 'failed' as Message['status'] }
                  : msg
              );
            }
          );
        }
      }
    };

    // conversation:hitl — cliente solicita hablar con humano, refetch detail para actualizar mode
    const handleHitl = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // conversation:taken — agente toma la conversación
    const handleTaken = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // conversation:returned — conversación devuelta a IA
    const handleReturned = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // message:media_ready — media procesada, actualizar mediaUrl del mensaje en cache
    const handleMediaReady = (data: MediaReadyPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (oldMessages = []) =>
            oldMessages.map((msg) =>
              msg.id === data.id
                ? { ...msg, mediaUrl: data.mediaUrl, mediaLoading: false }
                : msg
            )
        );
      }
    };

    // credits:exhausted — créditos agotados, conversación movida a HITL
    const handleCreditsExhausted = (data: CreditsExhaustedPayload) => {
      if (data.conversationId === conversationId) {
        // Show toast notification
        const usedFormatted = data.creditsUsed.toFixed(2);
        const limitFormatted = data.creditsLimit.toFixed(0);
        showToast(
          `⚠️ Créditos agotados. Usado: ${usedFormatted} / ${limitFormatted}. La conversación se movió a modo manual (HITL).`,
          'error'
        );

        // Refresh conversation detail to update mode to HITL
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });

        // Refresh user data to update creditsUsed
        queryClient.invalidateQueries({ queryKey: authKeys.me() });
      }
    };

    socket.on('message:media_ready', handleMediaReady);
    socket.on('message:incoming', handleMessageIncoming);
    socket.on('message:new', handleMessageNew);
    socket.on('message:sent', handleMessageSent);
    socket.on('message:status_updated', handleMessageStatusUpdated);
    socket.on('message:error', handleMessageError);
    socket.on('conversation:hitl', handleHitl);
    socket.on('conversation:taken', handleTaken);
    socket.on('conversation:returned', handleReturned);
    socket.on('credits:exhausted', handleCreditsExhausted);

    return () => {
      socket.off('message:media_ready', handleMediaReady);
      socket.off('message:incoming', handleMessageIncoming);
      socket.off('message:new', handleMessageNew);
      socket.off('message:sent', handleMessageSent);
      socket.off('message:status_updated', handleMessageStatusUpdated);
      socket.off('message:error', handleMessageError);
      socket.off('conversation:hitl', handleHitl);
      socket.off('conversation:taken', handleTaken);
      socket.off('conversation:returned', handleReturned);
      socket.off('credits:exhausted', handleCreditsExhausted);
    };
  }, [conversationId, queryClient, showToast]);

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
        {/* Back button (mobile + medium screens when conversations list is hidden) */}
        <button
          onClick={handleBack}
          className="xl:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
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

        {/* HITL action button */}
        {conversationMode === 'AI' ? (
          <Button
            variant="primary"
            size="sm"
            isLoading={takeControl.isPending}
            onClick={() => takeControl.mutate({ conversationId })}
          >
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline">Tomar Control</span>
          </Button>
        ) : conversationMode === 'HITL' ? (
          <Button
            variant="secondary"
            size="sm"
            isLoading={returnToAi.isPending}
            onClick={() => returnToAi.mutate({ conversationId })}
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Devolver a IA</span>
          </Button>
        ) : null}

        {/* Status badge (based on conversation isActive) */}
        {conversationDetail?.conversation && (
          <Badge
            variant={conversationDetail.conversation.isActive ? 'success' : 'default'}
            size="sm"
          >
            {conversationDetail.conversation.isActive ? 'Activa' : 'Cerrada'}
          </Badge>
        )}

        {/* Info button (mobile only) - opens bottom sheet */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
          aria-label="Ver información del cliente"
        >
          <Info className="w-5 h-5 text-accent-blue" />
        </button>
      </header>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {isLoadingMessages && messages.length === 0 ? (
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
      <MessageInput conversationId={conversationId} disabled={conversationMode === 'AI'} />

      {/* Bottom Sheet for mobile - shows client info + conversation summary */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Información del Cliente"
      >
        {client && (
          <div className="space-y-4">
            <ClientInfo client={client} />
            <ConversationSummary summaries={[]} />
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
