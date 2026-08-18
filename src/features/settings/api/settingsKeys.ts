export const settingsKeys = {
  all: ['settings'] as const,
  me: () => [...settingsKeys.all, 'me'] as const,
  nodeTemplates: () => [...settingsKeys.all, 'node-templates'] as const,
  nodeTemplate: (code: string) => [...settingsKeys.nodeTemplates(), code] as const,
};
