export type ApiStatus = 'up' | 'down';

export interface ApiHealth {
  id: string;
  apiName: string;
  status: ApiStatus;
  monitoringActive: boolean;
  responseTimeMs: number | null;
  errorMessage: string | null;
  lastErrorAt: string | null;
  lastCheckAt: string | null;
  recoveredAt: string | null;
}

export type HealthResponse = ApiHealth[];
