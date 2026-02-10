// Query keys factory for messages
// Follows TanStack Query best practices for cache management

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (conversationId: string) => [...messageKeys.lists(), conversationId] as const,
  conversations: () => ['conversations'] as const,
  detail: (conversationId: string) => [...messageKeys.conversations(), conversationId] as const,
  clients: () => ['clients'] as const,
  client: (clientId: string) => [...messageKeys.clients(), clientId] as const,
};
