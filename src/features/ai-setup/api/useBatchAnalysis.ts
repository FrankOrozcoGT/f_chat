import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface BatchAnalysisParams {
  channelCount: number;
  messageLimit: number;
}

export interface BatchAnalysisInternal {
  conversationId: string;
  clientId: string | null;
  groupJid: string | null;
  internalPurpose: string;
}

export interface BatchAnalysisResult {
  analyzed: number;
  internalsDetected: number;
  totalCostUsd: number;
  intents: { intent: string; count: number }[];
  internals: BatchAnalysisInternal[];
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
