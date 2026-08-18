import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from '@/features/catalog/products/api/productKeys';
import type { Product, UpdateProductDto } from '@/features/catalog/products/types';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProductDto }) => {
      const response = await apiClient.put<Product>(`/api/catalog/products/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
