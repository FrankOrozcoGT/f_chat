import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { shippingKeys } from './shippingKeys';
import type { ShippingLocation, UpdateShippingLocationDto } from '../types';

export const useUpdateShippingLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateShippingLocationDto }) => {
      const response = await apiClient.put<ShippingLocation>(`/api/catalog/shipping-locations/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.lists() });
    },
  });
};
