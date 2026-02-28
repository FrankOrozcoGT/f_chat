// Conversation types for f_chat

export type ConversationStatus = 'active' | 'closed' | 'waiting';
export type ConversationMode = 'AI' | 'HITL';
export type ConversationType = 'individual' | 'group';

export interface Participant {
  id: string;
  phoneNumber: string;
  name: string;
  profilePicUrl?: string | null;
}

export interface Conversation {
  id: string;
  phoneId: string;
  type: ConversationType;
  clientPhone: string;
  clientName: string;
  clientAvatar?: string;
  groupName?: string;
  participants?: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: ConversationStatus;
  mode: ConversationMode;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPreview {
  id: string;
  type: ConversationType;
  clientPhone: string;
  clientName: string;
  clientAvatar?: string;
  participants?: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: ConversationStatus;
  mode: ConversationMode;
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
