import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { productKeys } from './productKeys';

export const useUploadProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.put<{ imageUrl: string }>(
        `/api/catalog/products/${id}/image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
