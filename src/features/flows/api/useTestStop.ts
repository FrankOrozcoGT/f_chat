import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface TestStopPayload {
  testId: string;
}

export const useTestStop = () => {
  return useMutation({
    mutationFn: async (payload: TestStopPayload) => {
      await apiClient.post('/api/nodes/test/stop', payload);
    },
  });
};
