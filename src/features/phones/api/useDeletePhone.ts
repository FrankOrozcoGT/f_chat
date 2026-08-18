import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneKeys } from '@/features/phones/api/phoneKeys';

export const useDeletePhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneId: string) => {
      await apiClient.delete(`/api/phones/${phoneId}`);
    },
    onSuccess: () => {
      // Invalidar queries para refrescar la lista
      queryClient.invalidateQueries({ queryKey: phoneKeys.all });
    },
  });
};
