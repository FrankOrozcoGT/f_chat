import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from './productKeys';

export const useDeleteDiscount = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discountId: string) => {
      const response = await apiClient.delete(`/api/catalog/discounts/${discountId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...productKeys.detail(productId), 'discounts'] });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
