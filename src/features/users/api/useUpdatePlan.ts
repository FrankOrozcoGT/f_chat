import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { userKeys } from './userKeys';
import type { User } from '../types';

interface UpdatePlanParams {
  userId: string;
  plan: 'free' | 'full';
}

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, plan }: UpdatePlanParams) => {
      const response = await apiClient.patch<User>(`/users/${userId}/plan`, {
        plan,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
