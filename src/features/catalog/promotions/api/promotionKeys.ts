export const promotionKeys = {
  all: ['catalog-promotions'] as const,
  lists: () => [...promotionKeys.all, 'list'] as const,
  detail: (id: string) => [...promotionKeys.all, 'detail', id] as const,
};
