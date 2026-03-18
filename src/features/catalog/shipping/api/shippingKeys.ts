export const shippingKeys = {
  all: ['catalog-shipping'] as const,
  lists: () => [...shippingKeys.all, 'list'] as const,
};
