import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { dashboardKeys } from './dashboardKeys';
import type { DashboardStats } from '../types';

export const useGetDashboard = (from?: string, to?: string) => {
  return useQuery({
    queryKey: dashboardKeys.stats(from, to),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await apiClient.get<DashboardStats>('/api/dashboard', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
