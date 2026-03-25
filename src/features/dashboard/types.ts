export interface DashboardStats {
  from: string;
  to: string;
  totalClients: number;
  totalActiveDays: number;
  totalMessages: number;
  avgDaysPerClient: number;
  avgMessagesPerActiveDay: number;
  intentStats: { intent: string; count: number }[];
  internalChannels: { label: string; purpose: string | null; status: string }[];
  conversationAnalyses: ConversationAnalysis[];
  draftFlows?: DraftFlowSummary[];
}

export interface ConversationAnalysis {
  conversationId: string;
  intent: string;
  flowSummary: string;
  flowDiagram: string;
  isInternal: boolean;
  internalPurpose: string | null;
  analyzedAt: string;
}

export interface DraftFlowSummary {
  flowId: string;
  flowName: string;
  isPromoted: boolean;
  versionCount: number;
  analysisIds: string[];
}
