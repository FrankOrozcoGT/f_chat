import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface FlowAnalysisParticipant {
  clientId: string;
  name: string;
  phoneNumber: string;
}

export interface FlowAnalysis {
  analysisId: string;
  conversationId: string;
  groupJid: string | null;
  participants: FlowAnalysisParticipant[];
  intent: string;
  flowSummary: string;
  flowDiagram: string;
  isInternal: boolean;
  internalPurpose: string | null;
  analyzedAt: string;
}

const aiSetupKeys = {
  flowAnalyses: (flowId: string) => ['ai-setup', 'analyses', flowId] as const,
};

export const useGetFlowAnalyses = (flowId: string | null) => {
  return useQuery({
    queryKey: aiSetupKeys.flowAnalyses(flowId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<FlowAnalysis[]>(`/api/batch-analysis/flows/${flowId}/analyses`);
      return data;
    },
    enabled: !!flowId,
  });
};
