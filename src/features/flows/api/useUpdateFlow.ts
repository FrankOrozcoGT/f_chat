import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { Flow, UpdateFlowDto } from '../types';

export const useUpdateFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateFlowDto }) => {
      const response = await apiClient.put<Flow>(`/api/nodes/flows/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
