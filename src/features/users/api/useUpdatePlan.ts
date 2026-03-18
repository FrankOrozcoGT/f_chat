import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { adminTenantKeys } from './userKeys';

interface UpdatePlanParams {
  tenantId: string;
  plan: 'free' | 'full';
}

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, plan }: UpdatePlanParams) => {
      await apiClient.patch(`/admin/tenants/${tenantId}/plan`, { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.all });
    },
  });
};
