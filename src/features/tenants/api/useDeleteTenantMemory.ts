import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from './tenantKeys';

export const useDeleteTenantMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await apiClient.delete(`/api/tenant-memory/${key}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.memory() });
    },
  });
};
