import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { settingsKeys } from '@/features/settings/api/settingsKeys';
import type { NodeTemplate } from '@/features/settings/types';

export const useUpdateFarewellTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.put<NodeTemplate>('/api/nodes/templates/farewell', { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.nodeTemplate('farewell'), data);
    },
  });
};
