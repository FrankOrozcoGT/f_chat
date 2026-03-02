// Zustand store for conversations UI state
// Manages client-side state (selected conversation)

import { create } from 'zustand';

interface ConversationsState {
  selectedConversationId: string | null;
  selectedConversationType: 'individual' | 'group' | null;
  setSelectedConversation: (id: string | null, type?: 'individual' | 'group' | null) => void;
  setSelectedConversationId: (id: string | null) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  selectedConversationId: null,
  selectedConversationType: null,
  setSelectedConversation: (id, type = null) => set({ selectedConversationId: id, selectedConversationType: type }),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
}));
