import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { contactKeys } from '@/features/contacts/api/contactKeys';

export interface ContactSelectItem {
  id: string;
  name: string | null;
  phoneNumber: string;
}

export const useGetContactsSelect = () => {
  return useQuery({
    queryKey: contactKeys.select,
    queryFn: async () => {
      const response = await apiClient.get<ContactSelectItem[]>('/api/contacts/select');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
