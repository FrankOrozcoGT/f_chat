import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from '@/features/tenants/api/tenantKeys';
import type { TenantRole } from '@/features/auth/types';

interface ChangeRolePayload {
  userId: string;
  role: TenantRole;
}

export const useChangeMemberRole = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: ChangeRolePayload) => {
      const { data } = await apiClient.patch(
        `/api/tenants/${tenantId}/members/${userId}/role`,
        { role }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.members(tenantId) });
    },
  });
};
