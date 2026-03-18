import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { promotionKeys } from './promotionKeys';
import type { Promotion, UpdatePromotionDto } from '../types';

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePromotionDto }) => {
      const response = await apiClient.put<Promotion>(`/api/catalog/promotions/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
    },
  });
};
