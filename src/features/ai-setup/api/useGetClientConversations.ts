import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ClientConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  transcription: string | null;
  direction: 'incoming' | 'outgoing';
  type: string;
  createdAt: string;
}

export interface ClientConversation {
  id: string;
  groupJid: string | null;
  isActive: boolean;
  lastMessageAt: string;
  analysis: {
    conversationId: string;
    isInternal: boolean;
    internalPurpose: string | null;
    intent: string;
  } | null;
  messages: ClientConversationMessage[];
}

export const useGetClientConversations = (clientId: string | null) => {
  return useQuery({
    queryKey: ['client-conversations', clientId],
    queryFn: async () => {
      const { data } = await apiClient.get<ClientConversation[]>(
        `/api/batch-analysis/clients/${clientId}/conversations`,
        { params: { limit: 100 } },
      );
      return data;
    },
    enabled: !!clientId,
  });
};
