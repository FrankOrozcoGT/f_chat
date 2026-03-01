// TanStack Query mutation for manual conversation analysis
// Endpoint: POST /api/conversations/:id/analyze

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface AnalysisConversation {
  id: string;
  summary: string;
  isActive: boolean;
  messageCount: number;
}

export interface AnalysisWarning {
  messageId: string;
  type: string;
  message: string;
}

interface AnalyzeConversationResponse {
  conversations: AnalysisConversation[];
  creditsUsed: number;
  warnings: AnalysisWarning[];
}

export const useAnalyzeConversation = () => {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.post<AnalyzeConversationResponse>(
        `/api/conversations/${conversationId}/analyze`
      );
      return response.data;
    },
  });
};
