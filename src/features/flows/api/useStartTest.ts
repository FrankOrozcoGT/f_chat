import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { TestSession } from '@/features/flows/types';

interface StartTestPayload {
  conversationId: string;
  flowId?: string;
  clientPhone: string;
}

export const useStartTest = () => {
  return useMutation({
    mutationFn: async (payload: StartTestPayload) => {
      const response = await apiClient.post<TestSession>('/api/nodes/test/start', payload);
      return response.data;
    },
  });
};
