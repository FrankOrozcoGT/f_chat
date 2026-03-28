import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface UpdatePayload {
  flowId: string;
  diagram: string;
}

export const useUpdateFlowDiagram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flowId, diagram }: UpdatePayload) => {
      const { data } = await apiClient.patch(`/api/batch-analysis/flows/${flowId}/diagram`, { diagram });
      return data;
    },
    onSuccess: (_data, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flow-diagram', flowId] });
    },
  });
};
