import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { intentKeys } from './flowKeys';
import type { Intent, UpdateIntentDto } from '../types';

export const useUpdateIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateIntentDto }) => {
      const response = await apiClient.put<Intent>(`/api/nodes/intents/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intentKeys.lists() });
    },
  });
};
