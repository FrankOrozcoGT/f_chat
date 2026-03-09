import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { TestSession } from '../types';

interface StartTestPayload {
  conversationId: string;
  flowId: string;
  testPhone: string;
}

export const useStartTest = () => {
  return useMutation({
    mutationFn: async (payload: StartTestPayload) => {
      const response = await apiClient.post<TestSession>('/api/nodes/test/start', payload);
      return response.data;
    },
  });
};
