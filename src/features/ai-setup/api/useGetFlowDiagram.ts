import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface NodeMappingEntry {
  conversationId: string;
  nodeId: string;
}

export interface InternalQueue {
  channelName: string;
  nodeId: string;
  queueType: 'fifo' | 'batch_reply' | 'llm_flexible';
  usage: string;
}

export interface FlowDiagram {
  flowId: string;
  versionId: string;
  version: number;
  consolidatedDiagram: string;
  nodeMapping: Record<string, NodeMappingEntry[]>;
  internalQueues: InternalQueue[];
  nodeCategories: Record<string, string>;
  diagramApproved: boolean;
  diagramModified: boolean;
}

export const useGetFlowDiagram = (flowId: string | undefined) => {
  return useQuery({
    queryKey: ['flow-diagram', flowId],
    queryFn: async () => {
      const { data } = await apiClient.get<FlowDiagram>(`/api/batch-analysis/flows/${flowId}/diagram`);
      return data;
    },
    enabled: !!flowId,
  });
};
