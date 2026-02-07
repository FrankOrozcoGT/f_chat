import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { userKeys } from './userKeys';
import type { User } from '../types';

export const useGetUsers = () => {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/api/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
