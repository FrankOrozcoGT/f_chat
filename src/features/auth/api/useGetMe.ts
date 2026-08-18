import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AuthMe } from '@/features/auth/types';

// Query keys siguiendo patrón jerárquico de la arquitectura
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const useGetMe = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<AuthMe> => {
      const response = await apiClient.get<AuthMe>('/auth/me');
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
