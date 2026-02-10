// Zustand store for conversations UI state
// Manages client-side state (selected conversation)

import { create } from 'zustand';

interface ConversationsState {
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
}));
