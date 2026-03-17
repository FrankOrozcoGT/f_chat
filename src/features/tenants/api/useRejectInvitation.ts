import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useRejectInvitation = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(`/api/tenants/invitations/reject/${token}`);
      return data;
    },
  });
};
