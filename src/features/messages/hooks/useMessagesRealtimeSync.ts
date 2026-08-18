import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/lib/websocket';
import type { MessageSentPayload, CreditsExhaustedPayload, MediaReadyPayload } from '@/lib/websocket';
import { messageKeys } from '@/features/messages/api/messageKeys';
import { authKeys } from '@/features/auth/api/useGetMe';
import { useToast } from '@/shared/hooks/useToast';
import type { Message, MessageIncomingPayload } from '@/features/messages/types';

/**
 * Suscribe la conversación activa a todos los eventos de WebSocket que afectan
 * su lista de mensajes o su detail (status HITL, créditos). Mantiene la cache
 * de TanStack Query sincronizada en tiempo real.
 */
export function useMessagesRealtimeSync(conversationId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useSocketEvent<MessageIncomingPayload>('message:incoming', useCallback((data) => {
    if (data.conversationId === conversationId) {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
    }
  }, [conversationId, queryClient]));

  useSocketEvent<{ conversationId: string }>('message:new', useCallback((data) => {
    if (data.conversationId === conversationId) {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
    }
  }, [conversationId, queryClient]));

  useSocketEvent<MessageSentPayload>('message:sent', useCallback((data) => {
    if (data.conversationId === conversationId) {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
    }
  }, [conversationId, queryClient]));

  useSocketEvent<{ messageId: string; conversationId: string; status: string }>(
    'message:status_updated',
    useCallback((data) => {
      if (data.conversationId !== conversationId) return;
      queryClient.setQueryData<Message[]>(
        messageKeys.list(conversationId),
        (oldMessages = []) =>
          oldMessages.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, status: data.status as Message['status'] }
              : msg
          )
      );
    }, [conversationId, queryClient]),
  );

  useSocketEvent<{ conversationId: string; error: string; tempId?: string }>(
    'message:error',
    useCallback((data) => {
      if (data.conversationId !== conversationId) return;
      showToast(data.error || 'Error al enviar el mensaje', 'error');
      if (data.tempId) {
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (oldMessages = []) =>
            oldMessages.map((msg) =>
              msg.id === data.tempId
                ? { ...msg, status: 'failed' as Message['status'] }
                : msg
            )
        );
      }
    }, [conversationId, queryClient, showToast]),
  );

  const invalidateConversationDetail = useCallback((data: { conversationId: string }) => {
    if (data.conversationId === conversationId) {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
    }
  }, [conversationId, queryClient]);
  // conversation:hitl — cliente solicita hablar con humano, refetch detail para actualizar mode
  useSocketEvent('conversation:hitl', invalidateConversationDetail);
  // conversation:taken — agente toma la conversación
  useSocketEvent('conversation:taken', invalidateConversationDetail);
  // conversation:returned — conversación devuelta a IA
  useSocketEvent('conversation:returned', invalidateConversationDetail);

  // message:media_ready — media procesada, actualizar mediaUrl del mensaje en cache
  useSocketEvent<MediaReadyPayload>('message:media_ready', useCallback((data) => {
    if (data.conversationId !== conversationId) return;
    queryClient.setQueryData<Message[]>(
      messageKeys.list(conversationId),
      (oldMessages = []) =>
        oldMessages.map((msg) =>
          msg.keyId === data.keyId
            ? { ...msg, mediaUrl: data.mediaUrl, mediaLoading: false }
            : msg
        )
    );
  }, [conversationId, queryClient]));

  // credits:exhausted — créditos agotados, conversación movida a HITL
  useSocketEvent<CreditsExhaustedPayload>('credits:exhausted', useCallback((data) => {
    if (data.conversationId !== conversationId) return;
    const usedFormatted = data.creditsUsed.toFixed(2);
    const limitFormatted = data.creditsLimit.toFixed(0);
    showToast(
      `⚠️ Créditos agotados. Usado: ${usedFormatted} / ${limitFormatted}. La conversación se movió a modo manual (HITL).`,
      'error'
    );
    queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
    queryClient.invalidateQueries({ queryKey: authKeys.me() });
  }, [conversationId, queryClient, showToast]));
}
