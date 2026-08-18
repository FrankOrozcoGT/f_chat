import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { labelKeys } from '@/features/queue/labels/api/labelKeys';

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/queue/labels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
    },
  });
};
