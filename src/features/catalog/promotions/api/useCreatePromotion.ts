import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { promotionKeys } from './promotionKeys';
import type { Promotion, CreatePromotionDto } from '../types';

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePromotionDto) => {
      const response = await apiClient.post<Promotion>('/api/catalog/promotions', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
    },
  });
};
