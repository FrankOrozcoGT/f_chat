// TanStack Query mutation for sending messages
// Endpoint: POST /api/messages/send
// Implements optimistic updates and WebSocket integration

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import type { Message, BackendMessageType } from '../types';

interface SendMessagePayload {
  conversationId: string;
  contenido: string;
  tipo: BackendMessageType;
  mediaUrl?: string | null;
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
  onError?: (error: Error, errorType?: 'credits_limit' | 'generic') => void;
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
    onMutate: async ({ contenido, tipo, mediaUrl }) => {
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

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        content: contenido,
        mediaUrl: mediaUrl || null,
        type: frontendType as Message['type'],
        direction: 'outgoing',
        senderType: 'agent',
        status: 'pending', // "sending" visual state
        timestamp: new Date().toISOString(),
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
      let errorType: 'credits_limit' | 'generic' = 'generic';

      // Check if it's a 403 error with credits limit message
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 403 &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string' &&
        error.response.data.message.includes('Credits limit')
      ) {
        errorType = 'credits_limit';
      }

      // Call external error handler if provided
      if (options?.onError) {
        options.onError(error as Error, errorType);
      }
    },

    // On success: WebSocket will handle final update via message:sent event
    // So we don't need to do anything here
    onSuccess: () => {
      // WebSocket event 'message:sent' will replace temp message with real one
      // See MessagesPanel.tsx for WebSocket listener
    },
  });
};
