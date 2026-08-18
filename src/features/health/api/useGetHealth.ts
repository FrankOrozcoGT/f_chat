import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HealthResponse } from '@/features/health/types';

export const healthKeys = {
  all: ['health'] as const,
  list: () => [...healthKeys.all, 'list'] as const,
};

export const useGetHealth = () => {
  return useQuery({
    queryKey: healthKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>('/admin/health');
      return response.data;
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
    staleTime: 25000, // Considerar datos stale después de 25 segundos
  });
};
