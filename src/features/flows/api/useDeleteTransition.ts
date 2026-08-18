import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';

export const useDeleteTransition = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/nodes/flows/${flowId}/transitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.transitions(flowId) });
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
