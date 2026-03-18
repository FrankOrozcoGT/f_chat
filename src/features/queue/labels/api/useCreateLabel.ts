import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { labelKeys } from './labelKeys';
import type { ContactLabel, CreateContactLabelDto } from '../types';

export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateContactLabelDto) => {
      const response = await apiClient.post<ContactLabel>('/api/queue/labels', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
    },
  });
};
