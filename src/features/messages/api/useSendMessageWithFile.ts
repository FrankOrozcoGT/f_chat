// TanStack Query mutation for sending messages with file upload
// Endpoint: POST /api/messages/send-with-file
// Handles file upload + message send in single request

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from '@/features/messages/api/messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { MessageDirection, MessageSenderType, MessageStatus, mapBackendMessageType, mapBackendDirection, mapBackendStatus } from '@/features/messages/types';
import type { Message, BackendMessageType, BackendMessageDirection, BackendSenderType, BackendMessageStatus } from '@/features/messages/types';
import { generateTempId, snapshotMessages, rollbackMessages, classifySendError, type SendErrorType } from '@/features/messages/api/optimisticSend';

interface SendMessageWithFilePayload {
  file: File | Blob;
  conversationId: string;
  tipo: Exclude<BackendMessageType, 'text'>; // No text allowed
  contenido?: string; // Optional caption
}

interface SendMessageWithFileResponse {
  id: string;
  conversationId: string;
  type: BackendMessageType;
  content: string;
  mediaUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: BackendMessageDirection;
  senderType: BackendSenderType;
  status: BackendMessageStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface UseSendMessageWithFileOptions {
  onError?: (error: Error, errorType?: SendErrorType) => void;
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
      const previousMessages = snapshotMessages(queryClient, conversationId);

      const tempId = generateTempId();

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
        direction: MessageDirection.Outgoing,
        senderType: MessageSenderType.Agent,
        status: MessageStatus.Pending,
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
      rollbackMessages(queryClient, conversationId, context?.previousMessages);

      // Cleanup preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      if (options?.onError) {
        options.onError(error as Error, classifySendError(error));
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
                type: mapBackendMessageType(data.type),
                direction: mapBackendDirection(data.direction),
                senderType: data.senderType,
                status: mapBackendStatus(data.status),
                timestamp: data.createdAt,
              };
            }
            return msg;
          });
        }
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};
