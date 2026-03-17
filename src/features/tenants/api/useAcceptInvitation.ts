import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface AcceptInvitationResponse {
  tenantId: string;
  role: string;
}

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post<AcceptInvitationResponse>(
        `/api/tenants/invitations/accept/${token}`
      );
      return data;
    },
  });
};
