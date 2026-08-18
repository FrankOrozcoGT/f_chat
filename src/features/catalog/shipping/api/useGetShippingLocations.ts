import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { shippingKeys } from '@/features/catalog/shipping/api/shippingKeys';
import type { ShippingLocation } from '@/features/catalog/shipping/types';

export const useGetShippingLocations = () => {
  return useQuery({
    queryKey: shippingKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<ShippingLocation[]>('/api/catalog/shipping-locations');
      return response.data;
    },
  });
};
