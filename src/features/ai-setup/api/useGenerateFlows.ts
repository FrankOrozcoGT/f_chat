import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows';
interface GenerateFlowsResult {
  flowsGenerated: number;
  flows: { id: string; name: string; refined?: boolean }[];
}

const generateFlows = async (): Promise<GenerateFlowsResult> => {
  const { data } = await apiClient.post<GenerateFlowsResult>('/api/batch-analysis/generate-flows');
  return data;
};

export const useGenerateFlows = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateFlows,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
