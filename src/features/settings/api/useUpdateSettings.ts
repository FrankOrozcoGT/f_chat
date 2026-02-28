import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { settingsKeys } from './settingsKeys';
import type { UserSettings, UpdateSettingsPayload } from '../types';

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      const response = await apiClient.patch<UserSettings>('/api/users/settings', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.me(), data);
    },
  });
};
