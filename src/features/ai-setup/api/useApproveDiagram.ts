import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useApproveDiagram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flowId: string) => {
      const { data } = await apiClient.post(`/api/batch-analysis/flows/${flowId}/approve-diagram`);
      return data;
    },
    onSuccess: (_data, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['flow-diagram', flowId] });
    },
  });
};
