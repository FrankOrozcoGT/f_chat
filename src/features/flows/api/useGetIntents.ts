import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { intentKeys } from '@/features/flows/api/flowKeys';
import type { IntentsResponse } from '@/features/flows/types';

export const useGetIntents = () => {
  return useQuery({
    queryKey: intentKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<IntentsResponse>('/api/nodes/intents');
      return response.data;
    },
  });
};
