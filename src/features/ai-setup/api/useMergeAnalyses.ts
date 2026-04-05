import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface MergeAnalysesPayload {
  sourceIntents: string[];
  targetIntent: string;
}

interface MergeAnalysesResult {
  targetIntent: string;
  totalRenamed: number;
}

export const useMergeAnalyses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MergeAnalysesPayload) => {
      const { data } = await apiClient.post<MergeAnalysesResult>(
        '/api/batch-analysis/intents/merge-analyses',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-analysis', 'intents'] });
    },
  });
};
