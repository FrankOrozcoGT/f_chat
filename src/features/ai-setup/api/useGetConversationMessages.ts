import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { BackendMessage, Message } from '@/features/messages';
import { mapBackendMessage } from '@/features/messages';

export const useGetConversationMessages = (conversationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get<BackendMessage[]>('/api/messages', {
        params: { conversationId },
      });
      return response.data.map(mapBackendMessage) as Message[];
    },
    enabled: !!conversationId,
  });
};
