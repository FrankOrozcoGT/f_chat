// Conversation types for f_chat

export type ConversationStatus = 'active' | 'closed' | 'waiting';

export interface Conversation {
  id: string;
  phoneId: string;
  clientPhone: string;
  clientName: string;
  clientAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPreview {
  id: string;
  clientPhone: string;
  clientName: string;
  clientAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: ConversationStatus;
}

export interface PaginatedConversations {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
  phoneId?: string;
}
