import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from '@/features/flows/api/flowKeys';

interface RestoreParams {
  flowId: string;
  versionId: string;
}

const restoreFlowVersion = async ({ flowId, versionId }: RestoreParams) => {
  const { data } = await apiClient.post(`/api/nodes/flows/${flowId}/restore/${versionId}`);
  return data;
};

export const useRestoreFlowVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreFlowVersion,
    onSuccess: (_data, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flowKeys.versions(flowId) });
    },
  });
};
