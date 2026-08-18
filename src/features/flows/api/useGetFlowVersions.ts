import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';
import type { FlowVersion } from '@/features/flows/types';

export const useGetFlowVersions = (flowId: string | null) => {
  return useQuery({
    queryKey: flowKeys.versions(flowId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<FlowVersion[]>(`/api/nodes/flows/${flowId}/versions`);
      return data;
    },
    enabled: !!flowId,
  });
};
