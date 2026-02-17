import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { userKeys } from './userKeys';
import type { User } from '../types';

interface UpdateLimitsParams {
  userId: string;
  whatsappLimit?: number;
  creditsLimit?: number;
}

export const useUpdateLimits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, whatsappLimit, creditsLimit }: UpdateLimitsParams) => {
      const response = await apiClient.patch<User>(`/admin/users/${userId}/limits`, {
        whatsappLimit,
        creditsLimit,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
