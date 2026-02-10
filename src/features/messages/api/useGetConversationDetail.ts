// TanStack Query hook for fetching conversation detail with client data
// Endpoint: GET /api/conversations/:id

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import type { BackendConversationDetail, Client, mapBackendClient } from '../types';

export const useGetConversationDetail = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.detail(conversationId),
    queryFn: async () => {
      const response = await apiClient.get<BackendConversationDetail>(
        `/api/conversations/${conversationId}`
      );

      // Transform backend response to frontend structure
      return {
        conversation: response.data.conversation,
        client: response.data.client ? mapBackendClient(response.data.client) : null,
        summary: response.data.summary,
      };
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes (conversation details change less frequently)
  });
};
