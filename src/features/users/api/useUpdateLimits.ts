import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { adminTenantKeys } from '@/features/users/api/userKeys';

interface UpdateLimitsParams {
  tenantId: string;
  whatsappLimit: number;
  creditsLimit: number;
}

export const useUpdateLimits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, whatsappLimit, creditsLimit }: UpdateLimitsParams) => {
      await apiClient.patch(`/admin/tenants/${tenantId}/limits`, { whatsappLimit, creditsLimit });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.all });
    },
  });
};
