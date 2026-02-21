import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneMessageKeys } from './phoneMessageKeys';
import type { Contact } from '@/features/phone-messages/types';

export const useGetPhoneContacts = (phoneId: string | null) => {
  return useQuery({
    queryKey: phoneMessageKeys.contacts(phoneId ?? ''),
    queryFn: async () => {
      const response = await apiClient.get<Contact[]>(`/api/phones/${phoneId}/contacts`);
      return response.data;
    },
    enabled: !!phoneId,
    staleTime: 5 * 60 * 1000,
  });
};
