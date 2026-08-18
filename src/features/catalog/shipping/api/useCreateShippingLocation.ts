import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { shippingKeys } from '@/features/catalog/shipping/api/shippingKeys';
import type { ShippingLocation, CreateShippingLocationDto } from '@/features/catalog/shipping/types';

export const useCreateShippingLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateShippingLocationDto) => {
      const response = await apiClient.post<ShippingLocation>('/api/catalog/shipping-locations', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.lists() });
    },
  });
};
