// Hook for fetching conversations with infinite scroll support
// Uses TanStack Query's useInfiniteQuery for pagination

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { conversationKeys } from './conversationKeys';
import type { GetConversationsParams, Participant } from '../types';

// Backend response structure (based on actual API response)
interface BackendConversation {
  id: string;
  phoneId: string;
  clientId: string;
  type: 'individual' | 'group';
  groupName?: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  isActive: boolean;
  mode?: 'AI' | 'HITL';
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: {
    lastMessageDirection: string | null;
    unreadCount: number;
  } | null;
  client: {
    id: string;
    phoneNumber: string;
    name: string;
    profilePicUrl?: string | null;
    firstContactAt: string;
    lastContactAt: string;
  } | null;
  participants?: Participant[];
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
        type: conv.type ?? 'individual',
        clientPhone: conv.client?.phoneNumber ?? conv.participants?.[0]?.phoneNumber ?? '',
        clientName: conv.type === 'group' ? (conv.groupName ?? 'Grupo') : (conv.client?.name ?? ''),
        clientAvatar: conv.type === 'individual' ? (conv.client?.profilePicUrl ?? undefined) : undefined,
        groupName: conv.groupName ?? undefined,
        participants: conv.participants,
        lastMessage: conv.lastMessagePreview,
        lastMessageAt: conv.lastMessageAt,
        lastMessageDirection: conv.stats?.lastMessageDirection ?? null,
        unreadCount: conv.stats?.unreadCount ?? 0,
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
