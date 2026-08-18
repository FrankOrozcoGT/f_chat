import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { tenantKeys } from '@/features/tenants/api/tenantKeys';

export interface PendingInvitation {
  id: string;
  token: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  tenant: { id: string; name: string };
}

export const useGetPendingInvitations = () => {
  return useQuery({
    queryKey: tenantKeys.pendingInvitations(),
    queryFn: async () => {
      const { data } = await apiClient.get<PendingInvitation[]>('/api/tenants/invitations/pending');
      return data;
    },
  });
};
