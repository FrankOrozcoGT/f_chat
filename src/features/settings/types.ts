export type AnalysisMode = 'manual' | 'automatic';

export interface UserSettings {
  id: string;
  userId: string;
  analysisMode: AnalysisMode;
  messageLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  analysisMode?: AnalysisMode;
  messageLimit?: number;
}
