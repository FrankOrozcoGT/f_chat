import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from './tenantKeys';

interface SetTenantMemoryParams {
  path: string; // e.g. "banking_info" or "banking_info/banrural"
  value: unknown;
}

export const useSetTenantMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, value }: SetTenantMemoryParams) => {
      const { data } = await apiClient.put(`/api/tenant-memory/${path}`, { value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.memory() });
    },
  });
};
