import { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import { messageKeys } from '@/features/messages/api/messageKeys';
import type { Message } from '@/features/messages/types';

export type SendErrorType = 'credits_limit' | 'phone_disconnected' | 'generic';

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function snapshotMessages(queryClient: QueryClient, conversationId: string) {
  return queryClient.getQueryData<Message[]>(messageKeys.list(conversationId));
}

export function rollbackMessages(
  queryClient: QueryClient,
  conversationId: string,
  previousMessages: Message[] | undefined,
) {
  if (previousMessages) {
    queryClient.setQueryData(messageKeys.list(conversationId), previousMessages);
  }
}

export function classifySendError(error: unknown): SendErrorType {
  if (!(error instanceof AxiosError)) return 'generic';
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;
  if (status === 403 && typeof backendMessage === 'string' && backendMessage.includes('Credits limit')) {
    return 'credits_limit';
  }
  if (status === 503) return 'phone_disconnected';
  return 'generic';
}
