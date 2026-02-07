/**
 * TanStack Query keys for auth feature
 * Hierarchical pattern for granular cache invalidation
 */
export const authKeys = {
  all: ['auth'] as const,
  login: () => [...authKeys.all, 'login'] as const,
  user: () => [...authKeys.all, 'user'] as const,
} as const;
