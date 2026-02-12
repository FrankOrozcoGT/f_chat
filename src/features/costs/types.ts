export type Period = 'day' | 'week' | 'month';

export interface CostsSummary {
  totalSTT: number;
  totalLLM: number;
  totalTTS: number;
  total: number;
  byClient: CostsByClient[];
  byDay: CostsByDay[];
}

export interface CostsByClient {
  clientPhone: string;
  totalCost: number;
  messageCount: number;
}

export interface CostsByDay {
  date: string;
  totalCost: number;
}
