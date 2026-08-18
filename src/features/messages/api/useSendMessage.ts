// TanStack Query mutation for sending messages
// Endpoint: POST /api/messages/send
// Implements optimistic updates and WebSocket integration

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { MessageDirection, MessageSenderType, MessageStatus } from '../types';
import type { Message, BackendMessageType, MessageType } from '../types';
import { generateTempId, snapshotMessages, rollbackMessages, classifySendError, type SendErrorType } from './optimisticSend';

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
    type: MessageType;
    content: string;
    mediaUrl: string | null;
    direction: MessageDirection;
    senderType: MessageSenderType;
    status: MessageStatus;
    createdAt: string;
    updatedAt: string;
  };
  tempId: string;
}

interface UseSendMessageOptions {
  onError?: (error: Error, errorType?: SendErrorType) => void;
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
      const previousMessages = snapshotMessages(queryClient, conversationId);

      const tempId = generateTempId();

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
      rollbackMessages(queryClient, conversationId, context?.previousMessages);

      if (options?.onError) {
        options.onError(error as Error, classifySendError(error));
      }
    },

    onSuccess: () => {
      // WebSocket event 'message:sent' will replace temp message with real one
      // Invalidate conversation list to update stats (unreadCount, lastMessageDirection)
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};
