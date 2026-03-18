import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { labelKeys } from './labelKeys';
import type { ContactLabelsResponse } from '../types';

export const useGetLabels = () => {
  return useQuery({
    queryKey: labelKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<ContactLabelsResponse>('/api/queue/labels');
      return response.data;
    },
  });
};
