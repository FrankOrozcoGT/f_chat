export const phoneKeys = {
  all: ['phones'] as const,
  lists: () => [...phoneKeys.all, 'list'] as const,
  list: (filters?: string) => [...phoneKeys.lists(), filters] as const,
  details: () => [...phoneKeys.all, 'detail'] as const,
  detail: (id: string) => [...phoneKeys.details(), id] as const,
  qr: (id: string) => [...phoneKeys.detail(id), 'qr'] as const,
};
