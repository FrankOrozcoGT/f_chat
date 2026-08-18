import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from '@/features/catalog/products/api/productKeys';
import type { Product, CreateProductDto } from '@/features/catalog/products/types';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const response = await apiClient.post<Product>('/api/catalog/products', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
