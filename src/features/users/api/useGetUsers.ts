import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { adminTenantKeys } from '@/features/users/api/userKeys';
import type { AdminTenant } from '@/features/users/types';

export const useGetAdminTenants = () => {
  return useQuery({
    queryKey: adminTenantKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<AdminTenant[]>('/admin/tenants');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
