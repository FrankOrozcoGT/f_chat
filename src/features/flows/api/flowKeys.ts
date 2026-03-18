export const flowKeys = {
  all: ['flows'] as const,
  lists: () => [...flowKeys.all, 'list'] as const,
  activeSessions: () => [...flowKeys.all, 'active-sessions'] as const,
  contacts: (search: string) => [...flowKeys.all, 'contacts', search] as const,
  transitions: (flowId: string) => [...flowKeys.all, 'transitions', flowId] as const,
};

export const intentKeys = {
  all: ['intents'] as const,
  lists: () => [...intentKeys.all, 'list'] as const,
};

export const functionKeys = {
  all: ['node-functions'] as const,
  lists: () => [...functionKeys.all, 'list'] as const,
};
