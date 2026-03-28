import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { InternalStatus } from './useGetInternals';

interface ReviewPayload {
  id: string;
  status: InternalStatus;
  modifiedPurpose?: string;
}

export const useReviewInternal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, modifiedPurpose }: ReviewPayload) => {
      const { data } = await apiClient.patch(`/api/batch-analysis/internals/${id}`, {
        status,
        ...(modifiedPurpose ? { modifiedPurpose } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-analysis-internals'] });
    },
  });
};
