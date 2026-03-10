export const flowKeys = {
  all: ['flows'] as const,
  lists: () => [...flowKeys.all, 'list'] as const,
  activeSessions: () => [...flowKeys.all, 'active-sessions'] as const,
  contacts: (search: string) => [...flowKeys.all, 'contacts', search] as const,
};
