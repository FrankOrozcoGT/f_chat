// TanStack Query hook for fetching conversation detail with client data
// Endpoint: GET /api/conversations/:id

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { messageKeys } from './messageKeys';
import type { BackendClient } from '../types';
import { mapBackendClient } from '../types';

// Backend response structure
interface BackendConversationDetailResponse {
  conversation: {
    id: string;
    phoneId: string;
    clientId: string;
    type: 'individual' | 'group';
    groupName?: string | null;
    lastMessageAt: string;
    lastMessagePreview: string;
    isActive: boolean;
    mode: 'AI' | 'HITL';
    summary: any;
    createdAt: string;
    updatedAt: string;
  };
  client: BackendClient | null;
  summary: {
    conversationId: string;
    clientName: string;
    clientPhone: string;
    lastMessageAt: string;
    lastMessagePreview: string;
    isActive: boolean;
  };
}

export const useGetConversationDetail = (conversationId: string) => {
  return useQuery({
    queryKey: messageKeys.detail(conversationId),
    queryFn: async () => {
      const response = await apiClient.get<BackendConversationDetailResponse>(
        `/api/conversations/${conversationId}`
      );

      // Transform backend client to frontend structure (null for group conversations)
      const client = response.data.client ? mapBackendClient(response.data.client) : null;

      return {
        conversation: response.data.conversation,
        client,
        summary: response.data.summary,
      };
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes (conversation details change less frequently)
  });
};
