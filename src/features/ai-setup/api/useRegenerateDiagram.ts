import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface RegenerateDiagramResult {
  flowId: string;
  intentName: string;
  costUsd: number;
  removedInternals: number;
}

export const useRegenerateDiagram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flowId: string) => {
      const { data } = await apiClient.post<RegenerateDiagramResult>(
        `/api/batch-analysis/flows/${flowId}/regenerate-diagram`,
      );
      return data;
    },
    onSuccess: (_data, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['flow-diagram', flowId] });
      queryClient.invalidateQueries({ queryKey: ['ai-setup', 'analyses'] });
    },
  });
};
