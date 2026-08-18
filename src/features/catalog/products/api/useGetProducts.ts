import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from '@/features/catalog/products/api/productKeys';
import type { Product } from '@/features/catalog/products/types';

export const useGetProducts = () => {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/api/catalog/products');
      return response.data;
    },
  });
};
