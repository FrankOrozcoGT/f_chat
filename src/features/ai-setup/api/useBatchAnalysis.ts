import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface BatchAnalysisParams {
  channelCount: number;
  messageLimit: number;
}

interface BatchAnalysisResult {
  analyzed: number;
  internalsDetected: number;
  totalCostUsd: number;
  intents: { intent: string; count: number }[];
}

const runBatchAnalysis = async (params: BatchAnalysisParams): Promise<BatchAnalysisResult> => {
  const { data } = await apiClient.post<BatchAnalysisResult>('/api/batch-analysis', params);
  return data;
};

export const useBatchAnalysis = () => {
  return useMutation({
    mutationFn: runBatchAnalysis,
  });
};
