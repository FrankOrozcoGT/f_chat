import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { intentKeys } from '@/features/flows/api/flowKeys';

export const useDeleteIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/nodes/intents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intentKeys.lists() });
    },
  });
};
