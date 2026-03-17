import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useSwitchTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      await apiClient.post(`/auth/tenants/switch/${tenantId}`);
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });
};
