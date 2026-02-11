// TanStack Query mutation for sending messages with file upload
// Endpoint: POST /api/messages/send-with-file
// Handles file upload + message send in single request

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import type { Message, BackendMessageType } from '../types';

interface SendMessageWithFilePayload {
  file: File | Blob;
  conversationId: string;
  tipo: Exclude<BackendMessageType, 'text'>; // No text allowed
  contenido?: string; // Optional caption
}

interface SendMessageWithFileResponse {
  id: string;
  conversationId: string;
  type: string;
  content: string;
  mediaUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: string;
  senderType: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface UseSendMessageWithFileOptions {
  onError?: (error: Error) => void;
}

export const useSendMessageWithFile = (
  conversationId: string,
  options?: UseSendMessageWithFileOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessageWithFilePayload) => {
      // Build FormData
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('conversationId', payload.conversationId);
      formData.append('tipo', payload.tipo);
      if (payload.contenido) {
        formData.append('contenido', payload.contenido);
      }

      const response = await apiClient.post<SendMessageWithFileResponse>(
        '/api/messages/send-with-file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },

    // Optimistic update: add message immediately to UI
    onMutate: async ({ file, tipo, contenido }) => {
      // Cancel ongoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) });

      // Snapshot previous messages (for rollback)
      const previousMessages = queryClient.getQueryData<Message[]>(
        messageKeys.list(conversationId)
      );

      // Generate temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Map backend type to frontend type
      const frontendType = tipo === 'audio' ? 'voice' : tipo;

      // Create preview URL for images
      let previewUrl: string | null = null;
      if (file instanceof File && file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        content: contenido || '',
        mediaUrl: previewUrl, // Temporary preview URL
        fileName: file instanceof File ? file.name : null,
        type: frontendType as Message['type'],
        direction: 'outgoing',
        senderType: 'agent',
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      // Optimistically update cache
      queryClient.setQueryData<Message[]>(
        messageKeys.list(conversationId),
        (old = []) => [...old, optimisticMessage]
      );

      // Return context for rollback
      return { previousMessages, tempId, previewUrl };
    },

    // On error: rollback + cleanup
    onError: (error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          context.previousMessages
        );
      }

      // Cleanup preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      // Call external error handler if provided
      if (options?.onError) {
        options.onError(error as Error);
      }
    },

    // On success: replace temp message with real message from server
    onSuccess: (data, _variables, context) => {
      // Cleanup preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      // Replace temporary message with real message
      queryClient.setQueryData<Message[]>(
        messageKeys.list(conversationId),
        (oldMessages = []) => {
          return oldMessages.map((msg) => {
            if (msg.id === context?.tempId) {
              // Map backend response to Message type
              return {
                id: data.id,
                conversationId: data.conversationId,
                content: data.content,
                mediaUrl: data.mediaUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                type: (data.type === 'audio' ? 'voice' : data.type) as Message['type'],
                direction: data.direction as Message['direction'],
                senderType: data.senderType as Message['senderType'],
                status: data.status as Message['status'],
                timestamp: data.createdAt,
              };
            }
            return msg;
          });
        }
      );
    },
  });
};
