import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { intentKeys } from './flowKeys';
import type { Intent, CreateIntentDto } from '../types';

export const useCreateIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateIntentDto) => {
      const response = await apiClient.post<Intent>('/api/nodes/intents', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intentKeys.lists() });
    },
  });
};
