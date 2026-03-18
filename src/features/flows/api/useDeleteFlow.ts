import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';

export const useDeleteFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/nodes/flows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
