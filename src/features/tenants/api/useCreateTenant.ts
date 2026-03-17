import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post<{ id: string; name: string }>('/api/tenants', { name });
      await apiClient.post(`/auth/tenants/switch/${data.id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });
};
