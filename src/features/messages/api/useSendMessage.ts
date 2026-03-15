// TanStack Query mutation for sending messages
// Endpoint: POST /api/messages/send
// Implements optimistic updates and WebSocket integration

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { MessageDirection, MessageSenderType, MessageStatus } from '../types';
import type { Message, BackendMessageType } from '../types';

interface SendMessagePayload {
  conversationId: string;
  contenido: string;
  tipo: BackendMessageType;
  mediaUrl?: string | null;
  quotedMessageId?: string;
}

interface SendMessageResponse {
  message: {
    id: string;
    conversationId: string;
    type: string;
    content: string;
    mediaUrl: string | null;
    direction: string;
    senderType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  tempId: string;
}

interface UseSendMessageOptions {
  onError?: (error: Error, errorType?: 'credits_limit' | 'phone_disconnected' | 'generic') => void;
}

export const useSendMessage = (conversationId: string, options?: UseSendMessageOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const response = await apiClient.post<SendMessageResponse>(
        '/api/messages/send',
        payload
      );
      return response.data;
    },

    // Optimistic update: add message immediately to UI
    onMutate: async ({ contenido, tipo, mediaUrl, quotedMessageId }) => {
      // Cancel ongoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) });

      // Snapshot previous messages (for rollback)
      const previousMessages = queryClient.getQueryData<Message[]>(
        messageKeys.list(conversationId)
      );

      // Generate temporary ID (UUID v4 simple)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Map backend type to frontend type
      const frontendType = tipo === 'audio' ? 'voice' : tipo;

      // Resolve quoted message from current cache for immediate preview
      const resolvedQuotedMessage = quotedMessageId
        ? (previousMessages ?? []).find((m) => m.id === quotedMessageId) ?? null
        : null;

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        content: contenido,
        mediaUrl: mediaUrl || null,
        type: frontendType as Message['type'],
        direction: MessageDirection.Outgoing,
        senderType: MessageSenderType.Agent,
        status: MessageStatus.Pending,
        timestamp: new Date().toISOString(),
        quotedKeyId: quotedMessageId ?? null,
        quotedMessage: resolvedQuotedMessage,
      };

      // Optimistically update cache
      queryClient.setQueryData<Message[]>(
        messageKeys.list(conversationId),
        (old = []) => [...old, optimisticMessage]
      );

      // Return context for rollback
      return { previousMessages, tempId };
    },

    // On error: rollback to previous state
    onError: (error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          context.previousMessages
        );
      }

      // Detect error type
      let errorType: 'credits_limit' | 'phone_disconnected' | 'generic' = 'generic';

      const resp = error && typeof error === 'object' && 'response' in error
        ? (error as any).response
        : null;

      if (resp?.status === 403 && typeof resp?.data?.message === 'string' && resp.data.message.includes('Credits limit')) {
        errorType = 'credits_limit';
      } else if (resp?.status === 503) {
        errorType = 'phone_disconnected';
      }

      // Call external error handler if provided
      if (options?.onError) {
        options.onError(error as Error, errorType);
      }
    },

    onSuccess: () => {
      // WebSocket event 'message:sent' will replace temp message with real one
      // Invalidate conversation list to update stats (unreadCount, lastMessageDirection)
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};
