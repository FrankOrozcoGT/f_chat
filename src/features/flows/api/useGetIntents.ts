import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { intentKeys } from './flowKeys';
import type { IntentsResponse } from '../types';

export const useGetIntents = () => {
  return useQuery({
    queryKey: intentKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<IntentsResponse>('/api/nodes/intents');
      return response.data;
    },
  });
};
