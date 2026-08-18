import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { TestSendResponse } from '@/features/flows/types';

interface TestSendPayload {
  testId: string;
  message: string;
  mediaUrl?: string;
}

export const useTestSend = () => {
  return useMutation({
    mutationFn: async (payload: TestSendPayload) => {
      const response = await apiClient.post<TestSendResponse>('/api/nodes/test/send', payload);
      return response.data;
    },
  });
};
