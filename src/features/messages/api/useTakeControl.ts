// TanStack Query mutation for taking HITL control of a conversation
// Endpoint: POST /api/hitl/take-control

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';

interface TakeControlPayload {
  conversationId: string;
}

interface UseTakeControlOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export const useTakeControl = (options?: UseTakeControlOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TakeControlPayload) => {
      const response = await apiClient.post('/api/hitl/take-control', payload);
      return response.data;
    },

    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      options?.onSuccess?.();
    },

    onError: (error) => {
      options?.onError?.(error as Error);
    },
  });
};
