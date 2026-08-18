import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { labelKeys } from '@/features/queue/labels/api/labelKeys';
import type { ContactLabel, CreateContactLabelDto } from '@/features/queue/labels/types';

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
