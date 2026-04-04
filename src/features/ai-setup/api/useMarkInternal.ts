import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface MarkClientInternalPayload {
  type: 'client';
  clientId: string;
  channelName: string;
  internalPurpose: string;
}

interface MarkGroupInternalPayload {
  type: 'group';
  groupJid: string;
  channelName: string;
  internalPurpose: string;
}

type MarkInternalPayload = MarkClientInternalPayload | MarkGroupInternalPayload;

export const useMarkInternal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarkInternalPayload) => {
      const url = payload.type === 'group'
        ? `/api/batch-analysis/groups/${payload.groupJid}/mark-internal`
        : `/api/batch-analysis/clients/${payload.clientId}/mark-internal`;
      const { data } = await apiClient.post(url, {
        channelName: payload.channelName,
        internalPurpose: payload.internalPurpose,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-analysis-internals'] });
      queryClient.invalidateQueries({ queryKey: ['ai-setup', 'analyses'] });
    },
  });
};
