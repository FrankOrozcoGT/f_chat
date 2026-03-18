import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { Flow, CreateFlowDto } from '../types';

export const useCreateFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFlowDto) => {
      const response = await apiClient.post<Flow>('/api/nodes/flows', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
};
