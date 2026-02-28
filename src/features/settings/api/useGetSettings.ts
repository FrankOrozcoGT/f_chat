import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { settingsKeys } from './settingsKeys';
import type { UserSettings } from '../types';

export const useGetSettings = () => {
  return useQuery({
    queryKey: settingsKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<UserSettings>('/api/users/settings');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
