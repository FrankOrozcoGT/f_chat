import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';

const promoteFlow = async (flowId: string) => {
  const { data } = await apiClient.post(`/api/nodes/flows/${flowId}/promote`);
  return data;
};

export const usePromoteFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promoteFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
