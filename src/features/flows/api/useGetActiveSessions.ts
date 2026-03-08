import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { ActiveSessionsResponse } from '../types';

export const useGetActiveSessions = () => {
  return useQuery({
    queryKey: flowKeys.activeSessions(),
    queryFn: async () => {
      const response = await apiClient.get<ActiveSessionsResponse>('/api/nodes/flows/active-sessions');
      return response.data;
    },
    refetchInterval: 30000,
  });
};
