export type AnalysisMode = 'manual' | 'automatic';

export interface WorkScheduleDay {
  start: number; // 0-23
  end: number;   // 0-23
}

// Keys 1-7 = Monday to Sunday. Missing key = no schedule that day.
export type WorkSchedule = Partial<Record<'1' | '2' | '3' | '4' | '5' | '6' | '7', WorkScheduleDay>>;

export interface UserSettings {
  id: string;
  userId: string;
  analysisMode: AnalysisMode;
  messageLimit: number;
  workSchedule: WorkSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  analysisMode?: AnalysisMode;
  messageLimit?: number;
  workSchedule?: WorkSchedule;
}

export interface NodeTemplate {
  code: string;
  content: string;
}
