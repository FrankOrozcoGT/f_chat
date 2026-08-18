import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from '@/features/catalog/products/api/productKeys';
import type { ProductDiscount, CreateDiscountDto } from '@/features/catalog/products/types';

export const useCreateDiscount = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateDiscountDto) => {
      const response = await apiClient.post<ProductDiscount>(
        `/api/catalog/products/${productId}/discounts`,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...productKeys.detail(productId), 'discounts'] });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
