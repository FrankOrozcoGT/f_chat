import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from '@/features/tenants/api/tenantKeys';
import type { TenantMember } from '@/features/tenants/types';

export const useGetTenantMembers = (tenantId: string) => {
  return useQuery({
    queryKey: tenantKeys.members(tenantId),
    queryFn: async (): Promise<TenantMember[]> => {
      const { data } = await apiClient.get<TenantMember[]>(`/api/tenants/${tenantId}/members`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
