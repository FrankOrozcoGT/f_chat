import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from '@/features/tenants/api/tenantKeys';

export const useGetTenantMemory = () => {
  return useQuery({
    queryKey: tenantKeys.memory(),
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data } = await apiClient.get<Record<string, unknown>>('/api/tenant-memory');
      return data;
    },
    staleTime: 30 * 1000,
  });
};
