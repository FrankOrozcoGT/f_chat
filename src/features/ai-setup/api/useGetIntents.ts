import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface IntentSummary {
  intent: string;
  count: number;
}

export const useGetIntents = () => {
  return useQuery({
    queryKey: ['batch-analysis', 'intents'],
    queryFn: async () => {
      const { data } = await apiClient.get<IntentSummary[]>('/api/batch-analysis/intents');
      return data;
    },
  });
};
