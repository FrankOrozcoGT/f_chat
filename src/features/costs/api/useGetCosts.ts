import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { costKeys } from './costKeys';
import type { CostsSummary, Period } from '../types';

export const useGetCosts = (period: Period) => {
  return useQuery({
    queryKey: costKeys.byPeriod(period),
    queryFn: async () => {
      const response = await apiClient.get<CostsSummary>(`/admin/costs?period=${period}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (datos financieros más frescos)
  });
};
