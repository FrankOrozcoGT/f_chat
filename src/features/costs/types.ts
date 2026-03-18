export const Period = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type Period = typeof Period[keyof typeof Period];

export interface CostsSummary {
  totalSTT: number;
  totalLLM: number;
  totalTTS: number;
  total: number;
  byTenant: CostsByTenant[];
  byDay: CostsByDay[];
}

export interface CostsByTenant {
  tenantId: string;
  tenantName: string;
  total: number;
  totalConversations: number;
  avgCostPerConversation: number;
}

export interface CostsByDay {
  date: string;
  total: number;
}
