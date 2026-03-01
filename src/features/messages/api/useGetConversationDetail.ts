// TanStack Query hook for fetching conversation detail with client data
// Endpoint: GET /api/conversations/:id

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import type { BackendConversationDetail } from '../types';
import { mapBackendClient } from '../types';

export const useGetConversationDetail = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.detail(conversationId),
    queryFn: async () => {
      const response = await apiClient.get<BackendConversationDetail>(
        `/api/conversations/${conversationId}`
      );

      const client = response.data.client ? mapBackendClient(response.data.client) : null;

      return {
        conversation: response.data.conversation,
        client,
        products: response.data.products ?? [],
        clientDiscounts: response.data.clientDiscounts ?? [],
        promotions: response.data.promotions ?? [],
        clientPromotionDiscounts: response.data.clientPromotionDiscounts ?? [],
        analyzedConversations: response.data.analyzedConversations ?? [],
      };
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });
};
