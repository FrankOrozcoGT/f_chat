import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';

interface MergeIntentsResult {
  mergedAnalyses: number;
  removedFlows: string[];
  refinement: {
    flowId: string;
    intentName: string;
    costUsd: number;
    newFlows: number;
  } | null;
}

export const useMergeIntents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetIntentId, sourceIntentIds }: { targetIntentId: string; sourceIntentIds: string[] }) => {
      const { data } = await apiClient.post<MergeIntentsResult>(
        `/api/batch-analysis/intents/${targetIntentId}/merge`,
        { sourceIntentIds },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['flow-diagram'] });
      queryClient.invalidateQueries({ queryKey: ['ai-setup', 'analyses'] });
    },
  });
};
