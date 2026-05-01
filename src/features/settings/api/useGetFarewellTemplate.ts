import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { settingsKeys } from './settingsKeys';
import type { NodeTemplate } from '../types';

export const useGetFarewellTemplate = () => {
  return useQuery({
    queryKey: settingsKeys.nodeTemplate('farewell'),
    queryFn: async () => {
      const response = await apiClient.get<NodeTemplate>('/api/nodes/templates/farewell');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
