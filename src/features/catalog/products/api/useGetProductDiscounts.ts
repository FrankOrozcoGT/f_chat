import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from './productKeys';
import type { ProductDiscount } from '../types';

export const useGetProductDiscounts = (productId: string | null) => {
  return useQuery({
    queryKey: [...productKeys.detail(productId ?? ''), 'discounts'],
    queryFn: async () => {
      const response = await apiClient.get<ProductDiscount[]>(
        `/api/catalog/products/${productId}/discounts`
      );
      return response.data;
    },
    enabled: !!productId,
  });
};
