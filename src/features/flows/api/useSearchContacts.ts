import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { flowKeys } from './flowKeys';
import type { Contact } from '../types';

export const useSearchContacts = (search: string) => {
  return useQuery({
    queryKey: flowKeys.contacts(search),
    queryFn: async () => {
      const response = await apiClient.get<Contact[]>('/api/contacts', {
        params: { search },
      });
      return response.data;
    },
    enabled: search.length >= 2,
  });
};
