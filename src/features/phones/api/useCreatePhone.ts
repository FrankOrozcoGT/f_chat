import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneKeys } from '@/features/phones/api/phoneKeys';
import type { CreatePhoneResponse } from '@/features/phones/types';

interface CreatePhoneParams {
  instanceName: string;
}

export const useCreatePhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceName }: CreatePhoneParams) => {
      const response = await apiClient.post<CreatePhoneResponse>('/api/phones/create', {
        instanceName,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phoneKeys.all });
    },
  });
};
