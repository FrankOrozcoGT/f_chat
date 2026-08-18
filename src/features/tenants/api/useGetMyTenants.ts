import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from '@/features/tenants/api/tenantKeys';
import type { MyTenant } from '@/features/tenants/types';

export const useGetMyTenants = () => {
  return useQuery({
    queryKey: tenantKeys.mine(),
    queryFn: async (): Promise<MyTenant[]> => {
      const { data } = await apiClient.get<MyTenant[]>('/api/tenants/mine');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
