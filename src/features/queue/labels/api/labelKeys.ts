export const labelKeys = {
  all: ['queue-labels'] as const,
  lists: () => [...labelKeys.all, 'list'] as const,
};
