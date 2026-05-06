import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface UpdateContactNamePayload {
  contactId: string;
  name: string;
}

export const useUpdateContactName = () => {
  return useMutation({
    mutationFn: async ({ contactId, name }: UpdateContactNamePayload) => {
      await apiClient.patch(`/api/contacts/${contactId}/name`, { name });
    },
  });
};
