import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { promotionKeys } from './promotionKeys';
import type { Promotion } from '../types';

export const useGetPromotions = () => {
  return useQuery({
    queryKey: promotionKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<Promotion[]>('/api/catalog/promotions');
      return response.data;
    },
  });
};
