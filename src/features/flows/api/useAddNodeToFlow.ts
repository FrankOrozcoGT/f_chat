import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';

export const useAddNodeToFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flowId, nodeId }: { flowId: string; nodeId: string }) => {
      await apiClient.post(`/api/nodes/flow/${flowId}/nodes/${nodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
