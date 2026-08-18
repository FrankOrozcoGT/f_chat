// TanStack Query hook for fetching messages of a conversation
// Endpoint: GET /api/messages?conversationId=<uuid>

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from '@/features/messages/api/messageKeys';
import type { BackendMessage, Message } from '@/features/messages/types';
import { mapBackendMessage } from '@/features/messages/types';

export const useGetMessages = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: async () => {
      const response = await apiClient.get<BackendMessage[]>(
        `/api/messages`,
        { params: { conversationId } }
      );
      // Transform backend messages to frontend structure
      const messages: Message[] = response.data.map(mapBackendMessage);
      return messages;
    },
    enabled: !!conversationId,
    staleTime: Infinity, // Messages update via WebSocket invalidation only
    refetchOnWindowFocus: false,
  });
};
