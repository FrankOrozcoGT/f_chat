import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export type InternalStatus = 'pending' | 'approved' | 'rejected';

export interface InternalReview {
  id: string;
  tenantId: string;
  clientId: string | null;
  groupJid: string | null;
  internalPurpose: string;
  status: InternalStatus;
  modifiedPurpose: string | null;
  reviewedAt: string | null;
  createdAt: string;
  conversationIds: string[];
}

export const useGetInternals = () => {
  return useQuery({
    queryKey: ['batch-analysis-internals'],
    queryFn: async () => {
      const { data } = await apiClient.get<InternalReview[]>('/api/batch-analysis/internals');
      return data;
    },
  });
};
