export type Period = 'day' | 'week' | 'month';

export interface CostsSummary {
  totalSTT: number;
  totalLLM: number;
  totalTTS: number;
  total: number;
  byUser: CostsByUser[];
  byDay: CostsByDay[];
}

export interface CostsByUser {
  userId: string;
  userName: string;
  email: string;
  total: number;
  totalConversations: number;
  avgCostPerConversation: number;
}

export interface CostsByDay {
  date: string;
  total: number;
}
