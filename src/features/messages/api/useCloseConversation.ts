import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';

interface CloseConversationResponse {
  movedMessages: number;
  subConversationId: string;
}

interface UseCloseConversationOptions {
  onSuccess?: (data: CloseConversationResponse) => void;
  onError?: (error: Error) => void;
}

export const useCloseConversation = (options?: UseCloseConversationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.post<CloseConversationResponse>(
        `/api/conversations/${conversationId}/close`
      );
      return response.data;
    },

    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      options?.onSuccess?.(data);
    },

    onError: (error) => {
      options?.onError?.(error as Error);
    },
  });
};
