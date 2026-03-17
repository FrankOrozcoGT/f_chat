import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { authKeys } from '@/features/auth/api';

export const useRenameTenant = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.patch(`/api/tenants/${tenantId}`, { name });
      return data;
    },
    onSuccess: () => {
      // Invalidar /auth/me para que Sidebar y UserMenu reflejen el nuevo nombre
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};
