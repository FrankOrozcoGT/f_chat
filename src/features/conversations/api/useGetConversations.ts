// Hook for fetching conversations with infinite scroll support
// Uses TanStack Query's useInfiniteQuery for pagination

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { conversationKeys } from './conversationKeys';
import type { GetConversationsParams } from '../types';

// Backend response structure (based on actual API response)
interface BackendConversation {
  id: string;
  phoneId: string;
  clientId: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  isActive: boolean;
  mode?: 'AI' | 'HITL';
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    phoneNumber: string;
    name: string;
    profilePicUrl?: string | null;
    firstContactAt: string;
    lastContactAt: string;
  };
  phone: {
    id: string;
    phoneNumber: string;
    instanceName: string;
    status: string;
  };
}

export const useGetConversations = (params: GetConversationsParams = {}) => {
  const { search, phoneId, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: conversationKeys.list({ search, phoneId, limit }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: BackendConversation[]; total: number; page: number; limit: number; totalPages: number }>(
        '/api/conversations',
        {
          params: {
            page: pageParam,
            limit,
            search,
            phoneId,
          },
        }
      );

      // Transform backend response to frontend format
      const conversations = response.data.data.map((conv) => ({
        id: conv.id,
        phoneId: conv.phoneId,
        clientPhone: conv.client.phoneNumber,
        clientName: conv.client.name,
        clientAvatar: conv.client.profilePicUrl ?? undefined,
        lastMessage: conv.lastMessagePreview,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: 0, // TODO: Backend should provide this
        status: conv.isActive ? ('active' as const) : ('closed' as const),
        mode: conv.mode || 'HITL',
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      return {
        conversations,
        page: response.data.page,
        totalPages: response.data.totalPages,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
