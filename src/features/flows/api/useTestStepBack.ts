import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { TestStepBackResponse } from '@/features/flows/types';

interface TestStepBackPayload {
  testId: string;
}

export const useTestStepBack = () => {
  return useMutation({
    mutationFn: async (payload: TestStepBackPayload) => {
      const response = await apiClient.post<TestStepBackResponse>('/api/nodes/test/step-back', payload);
      return response.data;
    },
  });
};
