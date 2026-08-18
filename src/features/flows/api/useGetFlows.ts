import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';
import type { FlowsResponse } from '@/features/flows/types';

export const useGetFlows = () => {
  return useQuery({
    queryKey: flowKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<FlowsResponse>('/api/nodes/flows');
      return response.data;
    },
  });
};
