export type ApiName = 'evolution' | 'qwen_stt' | 'qwen_tts' | 'kimi';

export type ApiStatus = 'up' | 'down';

export interface ApiHealth {
  apiName: ApiName;
  status: ApiStatus;
  responseTime: number; // ms
  lastCheck: string; // ISO timestamp
  lastError?: string; // Si status=down
  monitoringActive: boolean; // Si health check está corriendo
}

export type HealthResponse = ApiHealth[];
