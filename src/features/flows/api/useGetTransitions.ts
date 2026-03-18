import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { FlowTransition } from '../types';

export const useGetTransitions = (flowId: string) => {
  return useQuery({
    queryKey: flowKeys.transitions(flowId),
    queryFn: async () => {
      const response = await apiClient.get<FlowTransition[]>(`/api/nodes/flows/${flowId}/transitions`);
      return response.data;
    },
    enabled: !!flowId,
  });
};
