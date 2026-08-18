import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from './tenantKeys';
import type { TenantRole } from '@/features/auth/types';

interface InvitePayload {
  email: string;
  role: TenantRole;
}

export const useInviteMember = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InvitePayload) => {
      const { data } = await apiClient.post<
        | { type: 'added'; memberId: string; userId: string; role: TenantRole }
        | { type: 'invited'; email: string; role: TenantRole }
      >(`/api/tenants/${tenantId}/members/invite`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.members(tenantId) });
    },
  });
};
