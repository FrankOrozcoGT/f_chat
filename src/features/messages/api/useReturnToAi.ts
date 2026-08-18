// TanStack Query mutation for returning a conversation to AI mode
// Endpoint: POST /api/hitl/return-to-ai

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';

interface ReturnToAiPayload {
  conversationId: string;
}

interface UseReturnToAiOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export const useReturnToAi = (options?: UseReturnToAiOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReturnToAiPayload) => {
      const response = await apiClient.post('/api/hitl/return-to-ai', payload);
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
