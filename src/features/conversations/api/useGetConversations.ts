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
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    phoneNumber: string;
    name: string;
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
      const response = await apiClient.get<BackendConversation[]>(
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
      const conversations = response.data.map((conv) => ({
        id: conv.id,
        phoneId: conv.phoneId,
        clientPhone: conv.client.phoneNumber,
        clientName: conv.client.name,
        clientAvatar: undefined,
        lastMessage: conv.lastMessagePreview,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: 0, // TODO: Backend should provide this
        status: conv.isActive ? ('active' as const) : ('closed' as const),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      return {
        conversations,
        hasMore: conversations.length >= limit, // Simple pagination check
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If last page returned full limit, there might be more
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
