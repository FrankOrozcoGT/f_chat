export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (from?: string, to?: string) => [...dashboardKeys.all, 'stats', { from, to }] as const,
};
