import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { functionKeys } from '@/features/flows/api/flowKeys';
import type { NodeFunctionsResponse } from '@/features/flows/types';

export function useGetFunctions() {
  return useQuery({
    queryKey: functionKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<NodeFunctionsResponse>('/api/nodes/functions');
      return response.data;
    },
  });
}
