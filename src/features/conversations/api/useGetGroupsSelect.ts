import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface GroupSelectItem {
  id: string;
  groupJid: string;
  groupName: string;
}

export const useGetGroupsSelect = () => {
  return useQuery({
    queryKey: ['conversations', 'groups', 'select'],
    queryFn: async () => {
      const response = await apiClient.get<GroupSelectItem[]>('/api/conversations/groups/select');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
