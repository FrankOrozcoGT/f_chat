import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneMessageKeys } from './phoneMessageKeys';
import { mapRawPhoneMessage } from '@/features/phone-messages/types';
import type { RawPhoneMessage } from '@/features/phone-messages/types';

export const useGetPhoneMessages = (phoneId: string, remoteJid: string) => {
  return useQuery({
    queryKey: phoneMessageKeys.messages(phoneId, remoteJid),
    queryFn: async () => {
      const response = await apiClient.get<RawPhoneMessage[]>(
        `/api/phones/${phoneId}/messages/${remoteJid}`
      );
      return response.data
        .filter((raw) => raw.message !== null && raw.messageType !== 'reactionMessage')
        .map(mapRawPhoneMessage);
    },
    enabled: !!phoneId && !!remoteJid,
    staleTime: 60 * 1000,
  });
};
