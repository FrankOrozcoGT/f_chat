import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';

interface GenerateDiagramsResult {
  diagramsGenerated: number;
  totalCostUsd: number;
  flows: { flowId: string; intentName: string }[];
}

export const useGenerateDiagrams = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<GenerateDiagramsResult>('/api/batch-analysis/generate-diagrams');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['flow-diagram'] });
    },
  });
};
