import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { labelKeys } from './labelKeys';
import type { ContactLabel, UpdateContactLabelDto } from '../types';

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateContactLabelDto }) => {
      const response = await apiClient.put<ContactLabel>(`/api/queue/labels/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
    },
  });
};
