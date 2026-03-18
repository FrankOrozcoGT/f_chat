import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { FlowTransition, CreateTransitionDto } from '../types';

export const useCreateTransition = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTransitionDto) => {
      const response = await apiClient.post<FlowTransition>(
        `/api/nodes/flows/${flowId}/transitions`,
        dto,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.transitions(flowId) });
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
