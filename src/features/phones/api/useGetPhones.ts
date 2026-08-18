import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneKeys } from '@/features/phones/api/phoneKeys';
import type { Phone } from '@/features/phones/types';

export const useGetPhones = () => {
  return useQuery({
    queryKey: phoneKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<Phone[]>('/api/phones');
      return response.data;
    },
    // No polling - actualizaciones vía WebSocket (phone:status_changed)
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
